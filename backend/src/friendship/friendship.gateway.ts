import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { UserStatus } from '@prisma/client';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { UserService } from 'src/user/user.service';

@WebSocketGateway({
  namespace: 'friendship',
  cors: {
    origin: process.env.VITE_FRONT_URL,
    credentials: true,
  },
})
export class FriendshipGateway {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
  ) {}

  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    try {
      const cookie = client.handshake.headers.cookie;
      if (!cookie) {
        throw new Error('No cookies found');
      }

      const token = cookie.substring('access_token='.length);
      if (!token) {
        throw new Error('access_token not found');
      }

      const decodedToken = this.authService.verifyAccessToken(token);
      client.handshake.auth.userId = decodedToken.id;

      const userId = client.handshake.auth.userId;
      this.userService.updateUserStatus(userId, UserStatus.ONLINE);
    } catch (error) {
      client.disconnect(true);
      console.error(`client ${client.id} disconnected`, error.message);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.auth.userId;
    this.userService.updateUserStatus(userId, UserStatus.OFFLINE);
  }

  @SubscribeMessage('reloadList')
  handleReloadList() {
    this.server.emit('reloadList');
  }
}
