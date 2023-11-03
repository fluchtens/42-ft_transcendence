import { Inject, OnModuleInit, Req, UseGuards, forwardRef} from "@nestjs/common";

import { ConnectedSocket, MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { Request} from "express";
import { env } from "process";

import { Server } from 'socket.io'
import { Socket } from "socket.io-client";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { ChatService } from "./chat.service";
import { ChatController } from "./chat.controller";
import { AuthService } from "src/auth/auth.service";
import { ExecutionContextHost } from "@nestjs/core/helpers/execution-context-host";

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
    private readonly authService: AuthService
  ) {}
  @WebSocketServer()
  server: Server;

  async handleConnection(client: Socket, @Req() req: Request, ...args: any[]) {
    // console.log(test);
    console.log("handleConnection");
    const token = client['handshake']['headers']['cookie'];
    console.log(client);
    console.log(token)
    // const decodedToken = await this.authService.verifyJwt(token);
    // console.log(decodedToken);
    // if (decodedToken){
    //   console.log("d")
    // }
    }

  onModuleInit() {
    this.server.on('connection', (socket) => {
      console.log(socket.id);
      console.log('Connected');
    });
  }

  // @SubscribeMessage('sendMessage')
  // async handleSendMessage(client: Socket, payload): Promise<void> {
  //   return ;
  // }
 
  // @SubscribeMessage('findAllMessages')
  // async findAll(@Req() req) {
  // }

  // @SubscribeMessage('join')
  // async joinRoom(@Req() req: Request,
  //  @ConnectedSocket() client: Socket,
  // ) {
  //   console.log ('join Room');
  //   // const tokenValue = await this.authService.
  //   // console.log(client.auth);
  //   // const test = this.jwtAuthGuard.canActivate({ switchToHttp: () => ({ getRequest: () => req }) })
  //   console.log(test);
  //   console.log(req.cookies);
  //   console.log(client['request']['headers']['cookie']);
  //   this.chatService.getUserChannels(req);
  // }

  // @SubscribeMessage('typing')
  // async typing() {

  // }

  // @SubscribeMessage('updateMessage')
  // async update() {

  // }

  // @SubscribeMessage('removeMessage')
  // async remove() {

  // }

}