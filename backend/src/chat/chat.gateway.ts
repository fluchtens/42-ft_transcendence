import { Inject, OnModuleInit, Req, UseGuards, forwardRef } from "@nestjs/common";
import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Request, request } from "express";
import { env } from "process";

import { Server } from 'socket.io'
import { Socket } from "socket.io-client";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { ChatService } from "./chat.service";
import { ChatController } from "./chat.controller";

@WebSocketGateway({
  namespace: 'socket',
  cors: {
    origin: ["http://localhost"]
  }
})
export class ChatGateway implements OnModuleInit {

  constructor(
    private readonly chatService: ChatService,
    // private chatController: ChatController
    // @Inject(forwardRef(() => JwtAuthGuard)) private readonly jwtAuthGuard: JwtAuthGuard,
  ) {}
  @WebSocketServer()
  server: Server;

  onModuleInit() {
    this.server.on('connection', (socket) => {
      console.log(socket.id);
      console.log('Connected');
    });
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(client: Socket, payload): Promise<void> {
    return ;
  }
 
  @SubscribeMessage('findAllMessages')
  async findAll() {

  }

  @SubscribeMessage('join')
  async joinRoom(@Req() req: Request,
   @ConnectedSocket() client: Socket,
  ) {
    console.log ('join Room');
    console.log(req.headers);
    console.log(client);
    this.chatService.getUserChannels(req);
  }

  @SubscribeMessage('typing')
  async typing() {

  }

  @SubscribeMessage('updateMessage')
  async update() {

  }

  @SubscribeMessage('removeMessage')
  async remove() {

  }

}