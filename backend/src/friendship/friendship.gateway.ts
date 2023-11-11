import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: ['http://localhost'],
    credentials: true,
  },
})
export class FriendshipGateway {
  @WebSocketServer() server: Server;

  handleConnection(client: any, ...args: any[]): any {
    console.log('Client connected to FriendshipGateway:', client.id);
  }

  @SubscribeMessage('friendRequest')
  handleFriendRequest(client: any, payload: any): void {
    this.server.emit('friendRequest', payload);
  }
}
