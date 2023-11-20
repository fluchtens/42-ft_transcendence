import { BadRequestException, Body, Inject, OnModuleInit, Param, Req, UseGuards, forwardRef} from "@nestjs/common";

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
import { SendMessageDto, ChannelData, Messages, AddMemberDto } from "./dtos/gateway.dtos";
import { channel } from "diagnostics_channel";

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

//   async getMessagesInRoom(channelId: string) {
//     const messages = await this.chatService.getMessagesByChannel(channelId);
//   }

//   async sendMessageToChannel(channelId: string, message: string): Promise<void> {
//     const channelClients = this.roomService.getRoomClients(channelId);

//     if (channelClients) {
//       channelClients.forEach((client) => {
//         client.emit('sendMessage', {channelId, message});
//       });
//     }
//   }

  async InitRooms(client: Socket) {
    try {
      const channels = await this.chatService.getUserChannels(Number(client.handshake.auth.userId));
      channels.forEach((channel) => {
        if (!this.roomService.getRoomClients(channel.id)) {
          this.roomService.createRoom(channel.id);
        }
        this.roomService.joinRoom(client, channel.id);
      });
    }
    catch (error){
      console.error("chat init rooms error socket io", error.message);
    }
  }

  async getChannelData(client: Socket, channelId: string): Promise<ChannelData> {
    let channelData: ChannelData;
    try {
      const messagesRaw = await this.chatService.getMessagesByChannel(channelId);
      const messages: Messages[] = messagesRaw.map(rawMessage => {
        return new Messages(rawMessage.id, rawMessage.content, rawMessage.edited, rawMessage.userId);
      });

      const channelInfo = await this.chatService.getChannelById(channelId);
      const channelMembers = await this.chatService.getChannelMembers(channelId);
      channelData = new ChannelData();
      channelData.channelId = channelInfo.id;
      channelData.channelName = channelInfo.name;
      channelData.inviteCode = channelInfo.inviteCode;
      channelData.messages = messages;
      channelData.members = channelMembers;
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
      // await this.InitRooms(client);
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
      console.log('Connected, dunno if initRoomsWork');
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
  
  @SubscribeMessage('getChannelData')
  async channelData(@ConnectedSocket() client: Socket, @MessageBody() channelId: string) {
    const userId = client.handshake.auth.userId;
    if (userId) {
      try {
        const ChannelData : ChannelData = await this.getChannelData(client, channelId);
        console.log(ChannelData);
      }
      catch(error) {
        console.error('error getting all channels:', error.message);
      }
    } else {
      console.error('User ID not available.');
    }
  }

  // @SubscribeMessage('getChannelMessages')
  // async getChannelMessages(@ConnectedSocket() client: Socket, @MessageBody() channelId: string) {
  // const userId = client.handshake.auth.userId;
  // if (userId) {
  //   // console.log(userId);
  //   console.log(channelId);
  // } else {
  //   console.error('User ID not available.');
  // }
  // }

  @SubscribeMessage('joinChannel')
  async handleJoinChannel(@ConnectedSocket() client: Socket, @MessageBody() channelId: string) {
    const userId = client.handshake.auth.userId;
    if (userId) {
      try {
        const ChannelData : ChannelData = await this.getChannelData(client, channelId);
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

  @SubscribeMessage('message')
  async messageEvent() {
    console.log('messageEvent');
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

  @SubscribeMessage(':channelId/message')
  async newMessage(client: Socket) {
    console.log('message event');
  }
  @SubscribeMessage('createChannel')
  async createChannel(@ConnectedSocket() client: Socket, @MessageBody() channelName: string) {
    const userId = Number(client.handshake.auth.userId);
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
      this.chatService.createChannel(userId, channelName);
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
          client.emit("newMessage", message)
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