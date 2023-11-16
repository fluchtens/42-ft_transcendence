import {
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { UserService } from 'src/user/user.service';

interface UserStatus {
  status: 'Online' | 'In game';
  sockets: Set<string>;
}

@WebSocketGateway({
  namespace: 'friendship',
  cors: {
    origin: process.env.VITE_FRONT_URL,
    credentials: true,
  },
})
export class FriendshipGateway {
  private userStatus: Map<number, UserStatus> = new Map();

  constructor(private readonly authService: AuthService) {}

  @WebSocketServer()
  server: Server;

  private addSocketToUser(userId: number, socketId: string): void {
    let userObject = this.userStatus.get(userId);
    if (!userObject) {
      userObject = {
        status: 'Online',
        sockets: new Set<string>(),
      };
      this.userStatus.set(userId, userObject);
    }

    userObject.sockets.add(socketId);
    this.userStatus.set(userId, userObject);
  }

  private removeSocketFromUser(userId: number, socketId: string) {
    const userObject = this.userStatus.get(userId);
    if (userObject) {
      userObject.sockets.delete(socketId);

      if (userObject.sockets.size === 0) {
        this.userStatus.delete(userId);
      } else {
        this.userStatus.set(userId, userObject);
      }
    }
  }

  public getUserStatus() {
    return this.userStatus;
  }

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
      const socketId = client.id;

      this.addSocketToUser(userId, socketId);
      this.server.emit('reloadList');
    } catch (error) {
      client.disconnect(true);
      console.error(`client ${client.id} disconnected`, error.message);
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.handshake.auth.userId;
    const socketId = client.id;

    this.removeSocketFromUser(userId, socketId);
    this.server.emit('reloadList');
  }

  @SubscribeMessage('reloadList')
  handleReloadList() {
    this.server.emit('reloadList');
  }
}
