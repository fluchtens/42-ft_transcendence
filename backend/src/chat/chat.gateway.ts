import { BadGatewayException, BadRequestException, Body, Inject, OnModuleInit, Param, Req, UseGuards, forwardRef} from "@nestjs/common";

import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Request} from "express";
import { env } from "process";

import { Server } from 'socket.io'
import { Socket } from "socket.io";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { ChatService } from "./chat.service";
import { ChatController } from "./chat.controller";
import { AuthService } from "src/auth/auth.service";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";
import cookieParser from "cookie-parser";
import { UserService } from "src/user/user.service";
import { RoomsService } from "./room.service";
import { SendMessageDto, ChannelData, Messages, AddMemberDto, CreateChannelDto, GetChannelDto } from "./dtos/gateway.dtos";
import { channel } from "diagnostics_channel";
import * as bcrypt from 'bcryptjs';

@WebSocketGateway({
  namespace: 'socket',
  cors: {
    origin: ["http://localhost"],
    credentials: true,
  },
})
export class ChatGateway implements OnModuleInit {

  constructor(
    private readonly authService: AuthService,
    private readonly chatService: ChatService,
    private readonly userService: UserService,
    private readonly roomService: RoomsService,
  ) {}
  @WebSocketServer()
  server: Server;

  async InitRooms(client: Socket) {
    try {
      const channels = await this.chatService.getUserChannels(Number(client.handshake.auth.userId));
      channels.forEach((channel) => {
        if (!this.roomService.getRoomClients(channel.id)) {
          this.roomService.createRoom(channel.id);
        }
        if (!channel.password)
         this.roomService.joinRoom(client, channel.id);
      });
    }
    catch (error){
      console.error("chat init rooms error socket io", error.message);
    }
  }

  async getChannelData(client: Socket, channelId: string, password?: string): Promise<ChannelData> {
    let channelData: ChannelData;
    try {
      const channelInfo = await this.chatService.getChannelById(channelId, password);
      channelData = new ChannelData();
      channelData.inviteCode = channelInfo.inviteCode;
      channelData.channelId = channelInfo.id;
      channelData.channelName = channelInfo.name;
      channelData.public = channelInfo.public;
      if (channelInfo.password === "true"){
        if (!password){
          channelData.protected = true;
          channelData.messages = [];
          channelData.members = [];
          return channelData;
        }
      }
      if (!channelInfo.password)
      channelData.protected = false;
      const channelMembers = await this.chatService.getChannelMembers(channelId);
      channelData.members = channelMembers;
      const messagesRaw = await this.chatService.getMessagesByChannel(channelId);
      const messages: Messages[] = messagesRaw.map(rawMessage => {
        return new Messages(rawMessage.id, rawMessage.content, rawMessage.edited, rawMessage.userId);
      });
      channelData.messages = messages;
    }
    catch (error) {
      console.error("error getChannelData", error);
      throw error;
    }
    return channelData;
  }

  async handleConnection(@ConnectedSocket() client: Socket) {
    try {
      const cookie = client.handshake.headers.cookie;
      if (!cookie) {
        throw new Error('No cookies found');
      }

      const cookies = cookie.split(';').map((cookie) => cookie.trim());
      const jwtCookie = cookies.find((cookie) =>
        cookie.startsWith('access_token='),
      );

      const token = jwtCookie.substring('access_token='.length);
      if (!token) {
        throw new Error('access_token not found');
      }
      const decodedToken =  this.authService.verifyAccessToken(token);
      client.handshake.auth.userId = decodedToken.id;
    }
    catch (error) {
      console.error('not connected', error.message);
    }
  }

  handleDisconnect(client: Socket) {
    this.roomService.disconnectClient(client);
    console.log(`client ${client.id} disconnected`);
  }

  onModuleInit() {
    this.server.on('connection', (socket) => {
      console.log(socket.id);
      this.InitRooms(socket);
    });
  }

  @SubscribeMessage('getAllChannels')
  async handleGetAllChannels(@ConnectedSocket() client: Socket): Promise<void> {
    const userId = client.handshake.auth.userId;
    if (userId) {
      try {
        const channels = await this.chatService.getUserChannels(userId);
        const channelIds = channels.map((channel) => channel.id);
        client.emit('allChannels', channelIds);
      }
      catch(error) {
        console.error('error getting all channels:', error.message);
      }
    } else {
      console.error('User ID not available.');
    }
  }

  @SubscribeMessage('joinChannel')
  async handleJoinChannel(@ConnectedSocket() client: Socket, @MessageBody() getChannelDto: GetChannelDto) {
    const userId = client.handshake.auth.userId;
    const { channelId, password } = getChannelDto;
    if (userId) {
      try {
        const ChannelData : ChannelData = await this.getChannelData(client, channelId, password);
        client.emit(`channelData:${channelId}`, ChannelData);
      }
      catch(error) {
        console.error('Error joining channel:', error.message);
        client.emit('channelJoinError', 'An error occurred while joining the channel.');
      }
    }
    else {
      console.error('User ID not available.');
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(@ConnectedSocket() client: Socket,
  @MessageBody() messageDto: SendMessageDto,
  ): Promise<void> {
    const userId = client.handshake.auth.userId;
    const {channelId, message} = messageDto;
    if (userId && channelId && message) {
      try {
        const channel = await this.chatService.getChannelById(channelId);
        if (channel) {
          const messageSend = await this.chatService.addMessage(userId, channelId, message);
          if (!messageSend)
            throw new Error("Message cannot be send");
          this.server.to(channelId).emit(`${channelId}/message`, messageSend);
        }
      }
      catch (error){
        console.error("sendMessage error", error.message);
      }
    }
    return ;
  }

  @SubscribeMessage('createChannel')
  async createChannel(@ConnectedSocket() client: Socket, @MessageBody() createChannelDto: CreateChannelDto) {
    const userId = Number(client.handshake.auth.userId);
    let { channelName } = createChannelDto;
    const { isPublic, password } = createChannelDto;
    if (userId) {
      if (!channelName){
        try {
          const user = await this.userService.getUserById(userId);
          channelName = user.username + "_channel";
        }
        catch (error) {
          console.error('createchannel error', error.message);
          throw new BadRequestException;
        }
      }
      try {
        console.log(password);
        const channelData = await this.chatService.createChannel(userId, channelName, isPublic, password);
        this.roomService.createRoom(channelData.id);
        this.roomService.joinRoom(client, channelData.id);
        client.emit('newChannel', channelData.id);
      }
      catch (error) {
        console.error('createchannel error', error.message);
        throw new BadRequestException;
      }
    }
   else {
    console.log("User ID not available.");
   }
  }

  @SubscribeMessage('addMember')
  async addMember(@ConnectedSocket() client: Socket, @MessageBody() addMemberDto: AddMemberDto) {
    const userId = Number(client.handshake.auth.userId);
    if (userId) {
      const {channelId, memberId} = addMemberDto;
      if (channelId && memberId) {
        const result = await this.chatService.addMember(userId, channelId, memberId);
        if (result) {
          const message = userId + " have added " + memberId;
          await this.chatService.addMessage(userId, channelId, message);
          client.emit(`${channelId}/message`, message);
        }
      }
      else {
        console.error("channelId or memberId not found, addMemberFail");
      }
    }
   else {
    console.log("User ID not available.");
   }
  }

  @SubscribeMessage('ProtectChannel')
  async handleChannelProtection(@ConnectedSocket() client: Socket, @MessageBody() channelId: string) {
    const userId = Number(client.handshake.auth.userId);
    if (userId) {
     
    }
   else {
    console.log("User ID not available.");
   }
  }
//   // @SubscribeMessage('getChannels')
//   // async getChannels(@ConnectedSocket() client: Socket) {
//   //   const userId = Number(client.handshake.auth.userId);
//   //   const channels = await this.chatService.getUserChannels(userId);
//   //   channels.forEach((channel) => {
//   //     console.log(channel.id);
//   //   });
//   // }

//   // @SubscribeMessage('typing')
//   // async typing(@MessageBody('isTyping') isTyping: boolean, 
//   //   @ConnectedSocket() client: Socket,
//   //   ){
//   //     const name = await this.userService.getUserById(Number(client.handshake.auth.userId));
//   //     this.server.emit('typing', { name, isTyping });
//   // }

//   // @SubscribeMessage('updateMessage')
//   // async update() {

//   // }

//   // @SubscribeMessage('removeMessage')
//   // async remove() {

//   // }

}