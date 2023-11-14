import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: 'friendship',
  cors: {
    origin: process.env.VITE_FRONT_URL,
    credentials: true,
  },
})
export class FriendshipGateway {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    console.log(`FriendshipGateway: Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`FriendshipGateway: Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('reloadList')
  handleReloadList() {
    this.server.emit('reloadList');
  }
}
