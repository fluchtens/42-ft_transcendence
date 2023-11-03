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
    origin: ["http://localhost"]
  }
})
export class ChatGateway implements OnModuleInit {

  constructor(
    // private readonly chatService: ChatService,
    // private readonly jwtAuthGuard: JwtAuthGuard,
    // private chatController: ChatController
    // @Inject(forwardRef(() => JwtAuthGuard)) private readonly jwtAuthGuard: JwtAuthGuard,

  ) {}
  @WebSocketServer()
  server: Server;

  // handleConnection(client: Socket, @Req() req: Request, ...args: any[]) {
  //   const executionContext = new ExecutionContextHost([client, req, ...args]);
  //   // console.log(executionContext);
  //   const context = executionContext;
  //   const jwtAuthGuard = new JwtAuthGuard()
  //   const canActivateResult = jwtAuthGuard.canActivate(context);
  //   console.log(canActivateResult);
  //   // const jwtAuthGuard = new JwtAuthGuard(); // Instanciez votre JwtAuthGuard ici si nécessaire
  
  //   // // Utilisez le contexte pour appeler canActivate avec JwtAuthGuard
  //   // const canActivateResult = jwtAuthGuard.canActivate(context);
  //   // if (canActivateResult) {
  //   //   // Authentification réussie, continuez
  //   //   console.log("Verification succefful");
  //   // } else {
  //   //   console.log("Verification failed");
  //   //   // Authentification échouée, gestion des erreurs
  //   // }
  //   console.log(client);
  //   // console.log(test);
  //   console.log("handleConnection");
  //   const cookies = client['handshake']['headers']['cookie'];
  //   }

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