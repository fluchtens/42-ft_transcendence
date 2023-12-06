import {
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { RoomsService } from 'src/chat/room.service';

interface ReloadListType {
  reqUserId: number;
  targetUserId: number;
}

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

  constructor(
    private readonly authService: AuthService,
    private readonly roomService: RoomsService,
  ) {}

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

  public setUserStatus(userId: number, playing: boolean) {
    let userObject = this.userStatus.get(userId);
    if (!userObject) return;
    userObject.status = playing ? 'In game' : 'Online';
    this.server.emit('reloadList');
  }

  onModuleInit() {
    this.server.on('connection', (socket) => {
      if (
        !this.roomService.getRoomClients(
          String(socket.handshake.auth.userId) + '/friendship',
        )
      ) {
        this.roomService.createRoom(
          String(socket.handshake.auth.userId) + '/friendship',
        );
      }
      this.roomService.joinRoom(
        socket,
        String(socket.handshake.auth.userId) + '/friendship',
      );
    });
  }

  handleConnection(client: Socket) {
    try {
      const cookie = client.handshake.headers.cookie;
      if (!cookie) {
        throw new Error('No cookies found');
      }

      const cookies = cookie.split(';').map((cookie) => cookie.trim());
      const jwtCookie = cookies.find((cookie) =>
        cookie.startsWith('access_token='),
      );

      const token = jwtCookie.substring('access_token='.length);
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

    this.roomService.disconnectClient(client);
    this.removeSocketFromUser(userId, socketId);
    this.server.emit('reloadList');
  }

  @SubscribeMessage('reloadList')
  handleReloadList(@MessageBody() { reqUserId, targetUserId }: ReloadListType) {
    this.server.to(String(reqUserId) + '/friendship').emit('reloadList');
    this.server.to(String(targetUserId) + '/friendship').emit('reloadList');
  }
}
