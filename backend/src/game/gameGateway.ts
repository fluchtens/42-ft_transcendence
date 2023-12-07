import {
  WebSocketGateway,
  SubscribeMessage,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Socket, Server } from 'socket.io';
import * as gm from './gameLogic';
import { GameService, UserStatus, UserData } from './game.service';
import { AuthService } from 'src/auth/auth.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from 'src/user/user.service';

@WebSocketGateway({
  namespace: '/gamesocket',
  cors: {
    origin: [process.env.VITE_FRONT_URL],
    credentials: true,
  },
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly prismaService: PrismaService,
    private readonly gameService: GameService,
  ) {
    this.gameService.queueSetCallback(({ gameRoom, game }) => {
      this.server.to(gameRoom).emit('statusChange', UserStatus.Playing);
    });

    function newRatings(winnerRating: number, loserRating: number) {
      let change = Math.ceil(
        Math.max(1, 25 + (loserRating - winnerRating) / 10),
      );
      return [winnerRating + change, loserRating - change];
    }

    this.gameService.gameSetCallbacks({
      onRefresh: ({ gameRoom, game }) => {
        this.server.to(gameRoom).emit('gameUpdate', game.packet());
      },
      onFinish: ({ gameRoom, game, winner, loser }) => {
        (async () => {
          let winnerRatingBefore = await this._rating(winner.id);
          let loserRatingBefore = await this._rating(loser.id);

          let [winnerRatingAfter, loserRatingAfter] = newRatings(
            winnerRatingBefore,
            loserRatingBefore,
          );

          await this.prismaService.user.update({
            where: { id: winner.id },
            data: { rating: winnerRatingAfter },
          });
          await this.prismaService.user.update({
            where: { id: loser.id },
            data: { rating: loserRatingAfter },
          });
          for (let user of [winner, loser]) {
            this.server
              .to(user.userRoom)
              .emit('statusChange', UserStatus.Normal);
            this.server.to(user.userRoom).emit('winLose', user === winner);
          }

          await this.prismaService.gameRecord.create({
            data: {
              winnerId: winner.id,
              winnerRatingBefore,
              winnerRatingAfter,
              loserId: loser.id,
              loserRatingBefore,
              loserRatingAfter,
            },
          });
        })();
      },
    });
  }

  @WebSocketServer()
  server: Server;

  async _rating(userId: number) {
    return (await this.userService.getUserById(userId)).rating;
  }

  handleConnection(sock: Socket) {
    try {
      const cookie = sock.handshake.headers.cookie;
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
      let userId = decodedToken.id;
      this.gameService.bindSocket(sock, userId);
    } catch (error) {
      sock.disconnect();
    }
  }

  handleDisconnect(sock: Socket) {
    let deletions = this.gameService.unbindSocket(sock);
    if (deletions.invite) {
      this._pushGameList();
    }
  }

  @SubscribeMessage('getStatus')
  getStatus(sock: Socket) {
    return this.gameService.getUserData(sock.id)?.status;
  }

  async _gamesInfo() {
    let gamesInfo = [];
    for (let [key, { id, host, type, args }] of [...this.gameService.invites]) {
      let gameType = 'classic';
      if (type === 'wall') {
        gameType = 'custom' + (args?.mapName ? ':' + args.mapName : '');
      }
      try {
        let user = await this.userService.getUserById(host.id);
        let rating = await this._rating(host.id);
        gamesInfo.push({
          id,
          type: gameType,
          name: key,
          host: user.username,
          rating,
        });
      } catch {
        gamesInfo.push({
          id,
          type,
          name: key,
          host: '[unkown user]',
          rating: -1,
        });
      }
    }
    return gamesInfo;
  }

  _pushGameList() {
    let promise = this._gamesInfo();
    promise.then((gamesInfo) => {
      this.server
        .to(this.gameService.lobbyRoom)
        .emit('gameListUpdate', gamesInfo);
    });
  }

  _confirmStatus(
    sock,
    accepted,
    errmsg = 'Forbidden action (try to refresh)',
  ): UserData {
    let userData = this.gameService.getUserData(sock.id);
    if (!userData) {
      sock.emit('gameSocketError', 'you have no active session.');
      return null;
    }
    if (!new Set(accepted).has(userData.status)) {
      if (errmsg !== null) sock.emit('gameSocketError', errmsg);
      return null;
    }
    return userData;
  }

  @SubscribeMessage('joinLobby')
  joinLobby(sock: Socket) {
    try {
      let userData = this._confirmStatus(sock, [
        UserStatus.Normal,
        UserStatus.Waiting,
      ]);
      if (!userData) return null;

      userData.joinRoom(this.gameService.lobbyRoom);
      this._pushGameList();
    } catch {
      return null;
    }
  }

  @SubscribeMessage('createInvite')
  createInvite(
    sock: Socket,
    {
      gameName,
      type = 'classic',
      args = null,
    }: { gameName: string; type?: 'classic' | 'wall'; args?: any },
  ) {
    let userData = this._confirmStatus(sock, [UserStatus.Normal]);
    if (!userData) return null;

    if (gameName === '') {
      sock.emit('gameSocketError', "name can't be empty");
      return null;
    }

    try {
      this.gameService.lobbyCreateInvite(userData.id, gameName, type, args);
    } catch {
      sock.emit('gameSocketError', 'name already taken');
      return;
    }

    this.server.to(userData.userRoom).emit('statusChange', UserStatus.Waiting);

    this._pushGameList();
  }

  @SubscribeMessage('cancel')
  cancel(sock: Socket, { silent }: { silent: boolean } = { silent: false }) {
    let userData = null;
    if (silent)
      userData = this._confirmStatus(sock, [UserStatus.Waiting], null);
    else userData = this._confirmStatus(sock, [UserStatus.Waiting]);

    if (!userData) return null;

    if (this.gameService.lobbyCancelInvite(userData.id)) this._pushGameList();

    this.gameService.leaveQueue(userData.id);

    this.server.to(userData.userRoom).emit('statusChange', UserStatus.Normal);
  }

  @SubscribeMessage('joinGame')
  joinGame(sock: Socket, gameId: string) {
    let userData = this._confirmStatus(sock, [UserStatus.Normal]);
    if (!userData) return null;

    this.gameService.lobbyJoinGame(userData.id, gameId);

    this.server.to(userData.gameRoom).emit('statusChange', UserStatus.Playing);

    this._pushGameList();
  }

  @SubscribeMessage('joinQueue')
  joinQueue(sock: Socket) {
    let userData = this._confirmStatus(sock, [UserStatus.Normal]);
    if (!userData) return null;

    (async () => {
      let rating = await this._rating(userData.id);
      this.server
        .to(userData.userRoom)
        .emit('statusChange', UserStatus.Waiting);
      this.gameService.joinQueue(userData.id, rating);
    })();
  }

  @SubscribeMessage('syncGame')
  syncGame(sock: Socket) {
    let userData = this._confirmStatus(sock, [UserStatus.Playing]);
    if (!userData) return null;

    let {
      player: whichPlayer,
      room,
      state: game,
    } = this.gameService.getGameData(userData.id);
    let args =
      game.type === 'wall' ? { mapName: (game as gm.WallGame).mapName } : null;
    return { type: game.type, args, packet: game.packet(Date.now()) };
  }

  @SubscribeMessage('playerMotion')
  playerMotion(sock: Socket, mo: gm.MotionType) {
    let userData = this._confirmStatus(sock, [UserStatus.Playing], null);
    if (!userData) return;

    let {
      player: whichPlayer,
      room,
      state: game,
    } = this.gameService.getGameData(userData.id);
    let now = Date.now();
    game.setMotion(whichPlayer, mo, now);
    this.server.to(room).emit('gameUpdate', game.packet(now));
  }
}
