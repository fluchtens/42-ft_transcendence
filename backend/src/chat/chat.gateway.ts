import { OnModuleInit } from "@nestjs/common";
import { MessageBody, SubscribeMessage, WebSocketGateway, WebSocketServer } from "@nestjs/websockets";
import { env } from "process";

import { Server } from 'socket.io'

@WebSocketGateway({
  namespace: 'socket',
  cors: {
    origin: ["http://localhost"]
  }
})
export class ChatGateway implements OnModuleInit {

  @WebSocketServer()
  server: Server;

  onModuleInit() {
    this.server.on('connection', (socket) => {
      console.log(socket.id);
      console.log('Connected');
    });
  }

  @SubscribeMessage('newMessage')
  onNewMessage(@MessageBody() message: any): void {
    console.log(message);
    this.server.emit('onMessage', {
      msg: 'New Message',
      content: message,
    })
  }

}