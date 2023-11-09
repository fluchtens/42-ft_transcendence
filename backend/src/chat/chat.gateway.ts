import { BadRequestException, Body, Inject, OnModuleInit, Req, UseGuards, forwardRef} from "@nestjs/common";

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
import { SendMessageDto } from "./dtos/gateway.dtos";
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

  async getMessagesInRoom(channelId: string) {
    const messages = await this.chatService.getMessagesByChannel(channelId);
  }

  async sendMessageToChannel(channelId: string, message: string): Promise<void> {
    const channelClients = this.roomService.getRoomClients(channelId);

    if (channelClients) {
      channelClients.forEach((client) => {
        client.emit('sendMessage', {channelId, message});
      });
    }
  }

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

  async handleConnection(client: Socket, @Req() req: Request, ...args: any[]) {
    try {
      console.log("handleConnection");
      const cookie = client.handshake.headers.cookie;
      let token = null;
      if (cookie)
        token = cookie.substring("access_token=".length);
      if (token === null) {
        throw new Error("access_token not found");
      }
      const decodedToken = await this.authService.verifyJwt(token);
      client.handshake.auth.userId = decodedToken.id;
      await this.InitRooms(client);
    }
    catch (error) {
      console.error('not connected', error.message);
    }
  }

  onModuleInit() {
    this.server.on('connection', (socket) => {
      console.log(socket.id);
      console.log('Connected');
    });
  }

  @SubscribeMessage('getAllChannels')
  async handleGetAllChannels(client: Socket): Promise<void> {
    const userId = client.handshake.auth.userId;
    try {
      const channels = await this.chatService.getUserChannels(userId);
      client.emit('allChannels', channels);
    }
    catch(error) {
      console.error('error getting all channels:', error.message);
    }
  }

  @SubscribeMessage('joinChannel')
  async handleJoinChannel(client: Socket, @MessageBody() channelId: string) {
    try {
      const userId = client.handshake.auth.userID
      console.log(userId);
      // const canJoin = await this.chatService.checkIfUserCanJoinChannel(userId, channelId);
      // if (canJoin) {
      //   client.join(channelId);
      //   client.emit('channelJoined', channelId);
      // }
      // else {
      //   client.emit('channelJoinError', 'You have no primission to join the channel.')
      // }
    }
    catch(error) {
      console.error('Error joining channel:', error.message);
      client.emit('channelJoinError', 'An error occurred while joining the channel.');
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(client: Socket, @MessageBody() sendMessageDto: SendMessageDto): Promise<void> {
    console.log('sendMessage');
    const { userId, channelId, message } = sendMessageDto;
    if (userId && channelId && message) {
      try {
        const channel = await this.chatService.getChannelById(channelId);
        if (channel) {
          const messageSend = await this.chatService.addMessage(userId, channelId, message);
          if (!messageSend)
            throw new Error("Message cannot be send");
          console.log(messageSend);
          this.server.emit('newMessage', {userId, message });
        }
      }
      catch (error){
        console.error("sendMessage error", error.message);
      }
    }
    return ;
  }
 
  // @SubscribeMessage('findAllMessages')
  // async findAll(@Req() req) {
  // }

  @SubscribeMessage('createChannel')
  async createChannel(@ConnectedSocket() client: Socket,@MessageBody() channelName: string) {
    const userId = Number(client.handshake.auth.userId);
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
    console.log(channelName);
    this.chatService.createChannel(userId, channelName);
  }

  @SubscribeMessage('getChannels')
  async getChannels(@ConnectedSocket() client: Socket) {
    const userId = Number(client.handshake.auth.userId);
    const channels = await this.chatService.getUserChannels(userId);
    channels.forEach((channel) => {
      console.log(channel.id);
    });
  }

  @SubscribeMessage('typing')
  async typing(@MessageBody('isTyping') isTyping: boolean, 
    @ConnectedSocket() client: Socket,
    ){
      const name = await this.userService.getUserById(Number(client.handshake.auth.userId));
      this.server.emit('typing', { name, isTyping });
  }

  // @SubscribeMessage('updateMessage')
  // async update() {

  // }

  // @SubscribeMessage('removeMessage')
  // async remove() {

  // }

}