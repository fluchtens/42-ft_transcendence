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

@WebSocketGateway({
  namespace: 'socket',
  cors: {
    origin: ["http://localhost"],
    credentials: true,
  },
  // cookie: true
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

  async handleConnection(client: Socket, @Req() req: Request, ...args: any[]) {
    try {
      console.log("handleConnection");
      const cookie = client['handshake']['headers']['cookie'];
      let token = null;
      if (cookie)
        token = cookie.substring("access_token=".length);
      if (token === null) {
        throw new Error("access_token not found");
      }
      const decodedToken = await this.authService.verifyJwt(token);
      console.log(decodedToken.id);
      client.handshake.auth.userId = decodedToken.id;
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

  @SubscribeMessage('sendMessage')
  async handleSendMessage(client: Socket, payload): Promise<void> {
    console.log('sendMessage');
    return ;
  }
 
  // @SubscribeMessage('findAllMessages')
  // async findAll(@Req() req) {
  // }
  async InitRoom(client: Socket) {
    try {
      const channels = await this.chatService.getUserChannels(Number(client.auth));
      channels.forEach((channel) => {
        if (!this.roomService.getRoomClients(channel.id)) {
          this.roomService.createRoom(channel.id);
        }
        this.roomService.joinRooms(client, channel.id);
        console.log(channel.id);
      });
    }
    catch (error){
      console.error("chat init rooms error socket io", error.message);
    }
  }

  createRoom(roomName: string) {
    this.roomService.createRoom(roomName);
  }

  joinRoom(client: Socket, roomName: string) {

    client.emit('joinedRoom', roomName);
  }

  @SubscribeMessage('createChannel')
  async createChannel(@ConnectedSocket() client: Socket,@MessageBody() channelName: string) {
    const userId = Number(client.auth);
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
    const userId = Number(client.auth);
    const channels = await this.chatService.getUserChannels(userId);
    channels.forEach((channel) => {
      console.log(channel.id);
    });
  }
  @SubscribeMessage('join')
  joinChannel(@MessageBody('name') name: string,
   @ConnectedSocket() client: Socket,
   ){
    console.log('join')
   }

  @SubscribeMessage('typing')
  async typing(@MessageBody('isTyping') isTyping: boolean, 
    @ConnectedSocket() client: Socket,
    ){
      const name = await this.userService.getUserById(Number(client.auth));
      this.server.emit('typing', { name, isTyping });
  }

  // @SubscribeMessage('updateMessage')
  // async update() {

  // }

  // @SubscribeMessage('removeMessage')
  // async remove() {

  // }

}