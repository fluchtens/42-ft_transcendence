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

import { AuthService } from "src/auth/auth.service"
import { PrismaService } from 'src/prisma/prisma.service';
import { UserService } from "src/user/user.service";

// TODO question
// UserStatus should be set only by the service and not the controller

enum UserStatus { Normal, Waiting, Playing } // TODO must stay in sync with frontend

class UserData {
	public sockets = new Set<Socket>();
	public rooms = new Set<string>();
	public status = UserStatus.Normal;
	public rating = 0; // TODO get from db or something

	private _gameRoom : string | null = null;
	get gameRoom() { return this._gameRoom; }
	set gameRoom(newRoom: string | null ) {
		if (this._gameRoom) this.leaveRoom(this._gameRoom);
		if (newRoom)	 this.joinRoom(newRoom);
		this._gameRoom = newRoom;
	}
	get userRoom() { return 'user_' + String(this.id) };

	constructor(public id: number) {}

	joinRoom(room: string) {
		[...this.sockets].forEach( (sock) => { sock.join(room); } );
		this.rooms.add(room);
	}
	leaveRoom(room: string) {
		[...this.sockets].forEach( (sock) => { sock.leave(room); } );
		this.rooms.delete(room);
	}
	leaveAll() {
		[...this.rooms].forEach( (room) => { this.leaveRoom(room); } );
	}

	addSocket(sock: Socket) {
		this.sockets.add(sock);
		[...this.rooms].forEach( (room) => {this.joinRoom(room)});
		if (this._gameRoom) sock.join(this._gameRoom);
// 		this.joinRoom(this.userRoom);
		sock.join(this.userRoom);
	}
	rmSocket(sock: Socket) {
		this.sockets.delete(sock);
	}
}

class MMQueue { // Matchmaking queue
	// TODO are data races possible if someone leaves the queue while we're matching??

	public matchRequests = new Map<string, { timestamp: number, rating: number}>();
	public options = {
		widenRate: 5, // points per second
		initialRange: 50, // +/-
		refreshRate: (1 / 5), // per sec (ie 1 every 5 sec)
	}
	private _intervalHandle : any = null; // what type is returned by `setInterval`? TODO

	constructor (
		public onMatch : ((userId1: number, userId2: number) => undefined) 
			= ( (id1, id2) => {} ) 
	)
	{}

	add(userId, userRating, autolaunch = true) {
		this.matchRequests.set(userId, {timestamp: Date.now(), rating: userRating});
		if (autolaunch && this.matchRequests.size == 2) {
			this.launch();
		}
	}

	del(userId) {
		this.matchRequests.delete(userId);
	}

	launch () {
		let repeat = () => {
				console.log('queue: handling matches');
				let matches = this.makeMatches();
				matches.forEach( (ids) => {this.onMatch(ids[0], ids[1])} );
		}
		repeat();
		this._intervalHandle = setInterval( () => {
			repeat();
			if (this.matchRequests.size < 2)
				clearInterval(this._intervalHandle!);
		}, 1000 / this.options.refreshRate);
	}

	stop() {
			clearInterval(this._intervalHandle);
	}

	makeMatches(autostop = true) {
		let sorted = [...this.matchRequests].sort(
			( [, {rating: rating1}] , [, {rating:rating2}] ) => (rating1 - rating2)
		).map( 
			( [userId, {timestamp, rating}] ) => ({timestamp, rating, userId})
	  );

		let isMatch = (req1, req2) => {
			let [initRg, wRate] = [this.options.initialRange, this.options.widenRate];
			let minRating1 = req2.rating - (initRg + wRate * ( Date.now() - req2.timestamp ) / 1000);
			let maxRating2 = req1.rating + (initRg + wRate * ( Date.now() - req1.timestamp ) / 1000);
			console.log('matching:', req1, req2, minRating1, maxRating2);
			return ( minRating1 < req1.rating && req2.rating < maxRating2 );
		}

		let matches = [];
		for (let i = sorted.length - 2; i >= 0; --i) {
			let [req1, req2] = sorted.slice(i, 2);
			if ( isMatch(req1, req2) ) {
				i--; // skip
				this.matchRequests.delete(req1.userId);
				this.matchRequests.delete(req2.userId);
				matches.push([req1.userId, req2.userId]);
			}
		}
		return matches;
	}
}

class GameService {
	// unique game_invite name to info required to launch the game
	lobbyRoom = '_LOBBY_';
	invites = new Map<string, { host: UserData /*, maybe game options etc*/}>();
	userInvites = new Map<number, string>(); // userId -> inviteName, used for deleting
																					 // invites along their hosts

	// sockId to active games
	games = new Map<string, gm.GameState>();
	userGames = new Map<number, { p: gm.WhichPlayer, gameId: string } >();
	// note: gameId is both key in `games` and socket.io room for game packets

	// sockId to User
	users = new Map<number, UserData>(); // userId to runtime states
	socketUsers = new Map<string, number>(); // sockId to owning userId
	pendingDelete = new Set<number>(); // User (by id) who are still in game and have no sock

	queue = new MMQueue();

	gameCallback = ( ( props: {gameRoom:string,game:gm.GameState} ) => {} );
	gameFinishCallback = ( (props: {
		gameRoom: string,
	 	game:gm.GameState,
	 	winner:UserData,
	 	loser: UserData,
	}) => {} );

	// TESTING
	constructor() {
		this.invites.set('test1', {host: new UserData(19)});
		this.invites.set('test2', {host: new UserData(42)});

// 		let alice = new UserData(1);
// 		let bob = new UserData(2);
// 		alice.rating = 1100;
// 		bob.rating = 1000;
// 		this.users.set(1, bob);
// 		this.users.set(2, alice);
	}
	// END TESTING

	queueSetCallback(callback) {
		this.queue.onMatch = (userId1, userId2) =>  {
			let {gameRoom, game} = this.launchGame(userId1, userId2); // TODO this in ctor problems?
			callback({gameRoom, game});
		}
	}

	gameSetCallbacks( {onRefresh, onFinish} ) {
		this.gameCallback = onRefresh;
		this.gameFinishCallback = onFinish;
	}

	bindSocket ( sock: Socket, userId: number ) {
		this.socketUsers.set(sock.id, userId);
		if ( !this.users.get(userId) ) {
			console.log('creating new user:', userId);
			this.users.set( userId, new UserData(userId) );
		}

		this.users.get(userId).addSocket(sock);
		this.pendingDelete.delete(userId);
		console.log('found user', this.users.get(userId));

		return this.users.get(userId);
	}

	unbindSocket ( sock: Socket ) {
		let userId = this.socketUsers?.get(sock.id);
		let user = userId ? this.users.get(userId) : null; // can userId be 0? (TODO)

		let deletions = { user: false, invite: false }
		if (!user) return deletions;

		this.socketUsers.delete(sock.id);
		user.rmSocket(sock);

		if (user.sockets.size === 0) { // delete users that don't have any sockets
			if (user.status === UserStatus.Playing){
				this.pendingDelete.add(user.id);
			} else {
				deletions.user = true;
				this.users.delete(userId);
				deletions.invite = this.lobbyCancelInvite(userId);
				this.queue.del(userId);
			}
		}
		return deletions;
	}

	getUserData( sockId: string ): UserData | null {
		return this.users.get(this.socketUsers.get(sockId));
	}

	getGameData( userId: number): {player: gm.WhichPlayer, room: string, state: gm.GameState} | null {
		let data = this.userGames.get(userId);
		if (!data) return null;

		return {
			player: data.p, 
			room: this.users.get(userId).gameRoom, 
			state: this.games.get(data.gameId),
		};
	}

	// creating / join games
	lobbyCreateInvite (userId: number, inviteName: string) {
		let user = this.users.get(userId);
		if (!user)
			throw new Error("no such active user");
		if (this.invites.has(inviteName))
			throw new Error("invite name already taken");

		user.status = UserStatus.Waiting;
		
		this.invites.set(inviteName, {host: user});
		this.userInvites.set(userId, inviteName);
	}

	lobbyCancelInvite(userId: number) {
		if (this.userInvites.has(userId)) {
			if (this.users.get(userId))
				this.users.get(userId).status = UserStatus.Normal;
			this.invites.delete(this.userInvites.get(userId)); // note: delete ok when undefined
			this.userInvites.delete(userId);
			return true;
		}
		return false;
	}

	private genId () {
		// TODO something less hacky needed??
		let id;
		do { 
			id = 'game_' + String(Math.random()).slice(2);
		} while ( this.games.has(id) );
		return id;
	}

	launchGame(userId1, userId2, startTime = Date.now()) {
		let player1 = this.users.get(userId1);
		let player2 = this.users.get(userId2);
		console.log('players', player1?.id, player2?.id);
		if (!player1 || !player2)
			throw new Error("no such active user");

		let gameId = this.genId();
		let game = new gm.GameState(startTime);
		game.newBall(gm.WhichPlayer.P1, startTime);
		// TESTING
		game.ball.dx = - gm.PONG.ballXSpeed;
		game.ball.dy = 0;
		game.ball.x = Math.floor(gm.PONG.width / 2);
		game.ball.y = Math.floor(gm.PONG.height / 2);
		// END TESTING
		// //
		this.games.set(gameId, game);
		console.log('ready to launch:', game);

		let bindPlayer = (user, whichP) => {
			user.status = UserStatus.Playing;
			user.leaveAll();
			user.gameRoom = gameId;
			this.userGames.set(user.id, {p: whichP, gameId: gameId});
		}
		bindPlayer(player1, gm.WhichPlayer.P1);
		bindPlayer(player2, gm.WhichPlayer.P2);

		let deleteGame = () => {
			for (let player of [player1, player2]) {
				player.status = UserStatus.Normal;
				player.gameRoom = null;
				this.userGames.delete(player.id);
				if (this.pendingDelete.has(player.id)) {
					this.users.delete(player.id);
					this.pendingDelete.delete(player.id);
				}
			}
			this.games.delete(gameId);
		}

		let onFinish = (winner: gm.WhichPlayer) => {
			this.gameFinishCallback({
				gameRoom: gameId,
			 	game,
				winner: (winner === gm.WhichPlayer.P1) ? player1: player2,
				loser: (winner === gm.WhichPlayer.P1) ? player2: player1,
		 	});
			deleteGame();
		}

		let resetTimer = () => {
			if (this.pendingDelete.has(player1.id) && this.pendingDelete.has(player2.id)) {
				console.log('game aborted bc both players disconnected');
				deleteGame();
				return ;
			}
			game.update();
			let {finish, winner} = game.updateScores();
			if (finish) {
				onFinish(winner);
			} else {
				this.gameCallback({gameRoom: gameId, game});
// 				let nextTimepoint = Math.max(20, game.minTimeToPoint());
				let nextTimepoint = game.minTimeToPoint();
				console.log('wait:', nextTimepoint);
				setTimeout(resetTimer, nextTimepoint);
			}
		}
		resetTimer();

		return {gameRoom: gameId, game};
	}

	lobbyJoinGame (
		userId: number,
	 	inviteName: string,
	 	startTime: number = Date.now())
	{
		let pending = this.invites.get(inviteName);
		if (! pending ) throw new Error('No such game invite');

		let joiner = this.users.get(userId);
		if (!joiner) throw new Error("no such active user");

		this.invites.delete(inviteName);
		return this.launchGame(pending.host.id, joiner.id, startTime);
	}

	joinQueue(userId, userRating) {
		let user = this.users.get(userId);
		if (!user)
			throw new Error("no such active user");
		if (user.status != UserStatus.Normal)
			throw new Error("can't join queue while busy");

		user.status = UserStatus.Waiting;
		this.queue.add(user.id, userRating);
	}

	leaveQueue(userId: number) {
		let user = this.users.get(userId);
		if (!user)
			throw new Error("no such active user");

		user.status = UserStatus.Normal;
		this.queue.del(user.id);
	}
}

@WebSocketGateway({
	namespace: '/gamesocket',
	cors: { 
		origin: [process.env.VITE_FRONT_URL], // localhost is react client
		credentials: true,
	}
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {

	gameService = new GameService(); // TODO use nest module system

	constructor(
		private readonly authService : AuthService,
		private readonly userService : UserService,
		private readonly prismaService : PrismaService,
	) {
		this.gameService.queueSetCallback( ({gameRoom, game}) => {
			this.server.to(gameRoom).emit('statusChange', UserStatus.Playing);
		});

		function mockNewRatings(winnerRating: number, loserRating: number) {
			return [winnerRating + 10, loserRating - 10];
		} // TODO not mock

		this.gameService.gameSetCallbacks( {
			onRefresh: ({gameRoom, game}) => {
				this.server.to(gameRoom).emit('gameUpdate', game.packet());
			},
			onFinish: ({gameRoom, game, winner, loser}) => {
				(async () => {
					let winnerRatingBefore = await this._rating(winner.id);
					let loserRatingBefore = await this._rating(loser.id);

					let [winnerRatingAfter, loserRatingAfter] = mockNewRatings(winnerRatingBefore, loserRatingBefore);

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
					console.log(await this.prismaService.gameRecord.findMany());
					console.log(await this.prismaService.user.findMany({include: {wonMatches: true, lostMatches: true}}));
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
		console.log('CONNECTION: ', sock.id);
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
			console.log('connection from user', userId);
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
			console.log("caught error");
			sock.emit('gameSocketError', "name already taken");
			return;
		}

		this.server.to(userData.userRoom).emit('statusChange', UserStatus.Waiting);

		this._pushGameList();

		console.log(`${userData.id} created game ${gameName}`);
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

		console.log(`${userData.id} will join the queue`);

		(async () => {
			let rating = await this._rating(userData.id);
			this.gameService.joinQueue(userData.id, rating);
			console.log('did join');
			this.server.to(userData.userRoom).emit('statusChange', UserStatus.Waiting);
		}) ();
	}

	@SubscribeMessage('syncGame')
	syncGame(sock: Socket) {
		let userData = this._confirmStatus(sock, [UserStatus.Playing]);
		if (!userData) return null;

		let {player: whichPlayer, room, state: game} = this.gameService.getGameData(userData.id);
		console.log('syncing', game);
		return game.packet(Date.now());
	}

	@SubscribeMessage('playerMotion')
	playerMotion(sock: Socket, mo: gm.MotionType) {
		console.log('got motion', mo);
		let userData = this._confirmStatus(sock, [UserStatus.Playing]);
		if (!userData) return null;

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

