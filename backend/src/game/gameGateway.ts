import { 
	WebSocketGateway,
	SubscribeMessage,
	WebSocketServer,
	OnGatewayConnection,
	OnGatewayDisconnect,
	MessageBody,
} from '@nestjs/websockets' 
import { Socket, Server } from 'socket.io'
import { GameRouter } from './gameRouter.service'
import * as gm from './gameLogic'

import { GameService, UserStatus, UserData } from './game.service'
import { AuthService } from "src/auth/auth.service"
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from "src/user/user.service";

// TODO question
// UserStatus should be set only by the service and not the controller

@WebSocketGateway({
	namespace: '/gamesocket',
	cors: { 
		origin: [process.env.VITE_FRONT_URL], // localhost is react client
		credentials: true,
	}
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {

// 	gameService = new GameService(); // TODO use nest module system

	constructor(
		private readonly authService : AuthService,
		private readonly userService : UserService,
		private readonly prismaService : PrismaService,
		private readonly gameService: GameService
	) {
		this.gameService.queueSetCallback( ({gameRoom, game}) => {
			this.server.to(gameRoom).emit('statusChange', UserStatus.Playing);
		});

		function newRatings(winnerRating: number, loserRating: number) {
			let change = Math.ceil(Math.max(1, 25 + (winnerRating - loserRating) / 10));
			return [winnerRating + change, loserRating - change];
		} 

		this.gameService.gameSetCallbacks( {
			onRefresh: ({gameRoom, game}) => {
				this.server.to(gameRoom).emit('gameUpdate', game.packet());
			},
			onFinish: ({gameRoom, game, winner, loser}) => {
				(async () => {
					let winnerRatingBefore = await this._rating(winner.id);
					let loserRatingBefore = await this._rating(loser.id);

					let [winnerRatingAfter, loserRatingAfter] = newRatings(winnerRatingBefore, loserRatingBefore);

					// awaits needed?? (when not testing)
					await this.prismaService.user.update({
						where: { id: winner.id},
						data: { rating: winnerRatingAfter }
					});
					await this.prismaService.user.update({
						where: { id: loser.id},
						data: { rating: loserRatingAfter }
					});
					for (let user of [winner, loser]) {
						this.server.to(user.userRoom).emit('statusChange', UserStatus.Normal);
						this.server.to(user.userRoom).emit('winLose', (user === winner) );
					}
// 					this.server.to(gameRoom).emit('statusChange', UserStatus.Normal);
// 					this.server.to(winner.userRoom).emit('winLose', true);
// 					this.server.to(loser.userRoom).emit('winLose', false);

					await this.prismaService.gameRecord.create({
						data: {
							winnerId: winner.id,
							winnerRatingBefore,
							winnerRatingAfter,
							loserId: loser.id,
							loserRatingBefore,
							loserRatingAfter,
						}
					});
				//}) ();
				})().then( async () => { // TESTING
					//console.log(await this.prismaService.gameRecord.findMany());
					//console.log(await this.prismaService.user.findMany({include: {wonMatches: true, lostMatches: true}}));
				});
				// END TESTING
			}
		});
	}
			
	@WebSocketServer()
	server: Server;

	async _rating(userId: number) {
		// TODO errors?
		return (await this.userService.getUserById(userId)).rating;
	}

	handleConnection(sock: Socket) {
		//console.log('CONNECTION: ', sock.id);
		try {
			const cookie = sock.handshake.headers.cookie;
			if (!cookie) {
				throw new Error('No cookies found');
			}

			const cookies = cookie.split(';').map((cookie) => cookie.trim());
			const jwtCookie = cookies.find((cookie) => (
				cookie.startsWith('access_token=')
			));

			const token = jwtCookie.substring('access_token='.length);
			if (!token) {
				throw new Error('access_token not found');
			}
			const decodedToken =  this.authService.verifyAccessToken(token);
// 			client.handshake.auth.userId = decodedToken.id;
			let userId = decodedToken.id;
			console.log('CONNECTION from user', userId, 'at sock', sock.id);
			this.gameService.bindSocket(sock, userId); // refactor so userId is an int
			// await this.InitRooms(client);
		}
		catch (error) {
			console.error('not connected', error.message);
		}
	}

	handleDisconnect(sock: Socket) {
		console.log('DICONNECT', sock.id);
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
		for (let [key, {host}] of [...this.gameService.invites]) {
			try {
				let user = await this.userService.getUserById(host.id);
				gamesInfo.push({name: key, host: user.username});
			} catch {
				gamesInfo.push( {name: key, host: '[unkown user]'});
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

	_confirmStatus(sock, accepted, errmsg = "Forbidden action") : UserData {
		let userData = this.gameService.getUserData(sock.id);
		if ( !userData ) {
			sock.emit('gameSocketError', "you have no active session.");
			return null;
		}
		if ( !(new Set(accepted).has(userData.status)) ) {
			sock.emit('gameSocketError', errmsg);
			return null;
		}
		return userData;
	}

	@SubscribeMessage('joinLobby')
	joinLobby(sock: Socket) {
		try {
			let userData = this._confirmStatus(sock, [UserStatus.Normal, UserStatus.Waiting])
			if (!userData) return null;

			userData.joinRoom(this.gameService.lobbyRoom);
			this._pushGameList();
		} catch {
			return null;
		}
	}

	@SubscribeMessage('createInvite')
	createInvite(sock: Socket, gameName: string) {
		let userData = this._confirmStatus(sock, [UserStatus.Normal] );
		if (!userData) return null;
		
// 		if (this.gameService.invites.has(gameName) )
// 				throw new Error ("name already taken"); // TODO handle in client somehow

		try {
			this.gameService.lobbyCreateInvite(userData.id, gameName);
		} catch {
			//console.log("caught error");
			sock.emit('gameSocketError', "name already taken");
			return;
		}

		this.server.to(userData.userRoom).emit('statusChange', UserStatus.Waiting);

		this._pushGameList();

		//console.log(`${userData.id} created game ${gameName}`);
	}

	@SubscribeMessage('cancel')
	cancel(sock: Socket) {
		let userData = this._confirmStatus(sock, [UserStatus.Waiting]);
		if (!userData) return null;

		if (this.gameService.lobbyCancelInvite(userData.id))
			this._pushGameList();

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

		//console.log(`${userData.id} will join the queue`);

		(async () => {
			let rating = await this._rating(userData.id);
			this.server.to(userData.userRoom).emit('statusChange', UserStatus.Waiting);
			this.gameService.joinQueue(userData.id, rating);
			//console.log('did join');
		}) ();
	}

	@SubscribeMessage('syncGame')
	syncGame(sock: Socket) {
		let userData = this._confirmStatus(sock, [UserStatus.Playing]);
		if (!userData) return null;

		let {player: whichPlayer, room, state: game} = this.gameService.getGameData(userData.id);
		//console.log('syncing', game);
		return game.packet(Date.now());
	}

	@SubscribeMessage('playerMotion')
	playerMotion(sock: Socket, mo: gm.MotionType) {
		// don't use confirm status to silently refuse and not send error
		let userData = this.gameService.getUserData(sock.id);
		if ( !userData ) return;
		if ( userData.status !== UserStatus.Playing ) return;

		let {player: whichPlayer, room, state: game} = this.gameService.getGameData(userData.id);
		let now = Date.now();
		game.setMotion(whichPlayer, mo, now);
		this.server.to(room).emit('gameUpdate', game.packet(now));
	}
}

// try {
//       const cookie = client.handshake.headers.cookie;
//       if (!cookie) {
//         throw new Error('No cookies found');
//       }
// 
//       const cookies = cookie.split(';').map((cookie) => cookie.trim());
//       const jwtCookie = cookies.find((cookie) =>
//         cookie.startsWith('access_token='),
//       );
// 
//       const token = jwtCookie.substring('access_token='.length);
//       if (!token) {
//         throw new Error('access_token not found');
//       }
//       const decodedToken =  this.authService.verifyAccessToken(token);
//       client.handshake.auth.userId = decodedToken.id;
//       // await this.InitRooms(client);
//     }
//     catch (error) {
//       console.error('not connected', error.message);
//     }

///

// 	@SubscribeMessage('joinLobby')
// 	joinLobby(sock: Socket) {
// 		let userData = this.gameService.getUserData(sock.id);
// 		if ( !userData ) 
// 			throw new Error("not authenticated");
// 		if ( !userData.status === UserStatus.Playing) 
// 			throw new Error("cannot join lobby when playing");
// 		
// 		userData.joinRoom(LOBBY);
// 		return [...this.gameService.games.pending];
// 	}
// 
// 	@SubscribeMessage('createGame')
// 	createGame(sock: Socket) {
// 		let userData = this.gameService.getUserData(sock.id);
// 		if ( !userData ) 
// 			throw new Error("not authenticated");
// 		if ( !userData.status !== UserStatus.Normal) 
// 			throw new Error("cannot create game when busy");
// 
// 		userData.gameRoom = this.gameService.createGameRoom();
// 		sock.emit('statusWaiting');
// 	}
// 
// 	@SubscribeMessage('joinGame')
// 	joinGame(sock: Socket, gameRoom: string) {
// 		let userData = this.gameService.getUserData(sock.id);
// 		if ( !userData ) 
// 			throw new Error("not authenticated");
// 
// 		userData.gameRoom = gameRoom;
// 
// 		let startTime = Date.now() + 5000; // 5 sec countdown
// 		let game = this.gameService.initGame(gameRoom, startTime);
// 		game.newBall(gm.WhichPlayer.P1, startTime);
// 		this.server
// 			.to(userData.gameRoom)
// 			.emit('startGame', game.packet(startTime, ['ball']));
// 	}
// 
// 	@SubscribeMessage('cancel')
// 	cancel(sock: Socket) {
// 		let userData = this.gameService.getUserData(sock.id);
// 		if ( !userData ) 
// 			throw new Error("not authenticated");
// 
// 		userData.gameRoom = null;
// 
// 	// creating / joining games
// 	// hande 'createGame', 'joinGame', 'queue'
// }

