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
import * as gm from './tmp_game_logic'
// TODO?                   ^^^  encapsulate better (have more in service less in gateway)?

class SockState {
	static get LOBBY() { return '_LOBBY_'; } // Global Lobby room

// 	public game: gm.GameState | null = null;
	public whichPlayer = gm.WhichPlayer.P1;

	constructor(private _socket : Socket, private _room: string | null = null) {}

	get socket() { return this._socket; }
	get room() { return this._room; }
	set room( newRoom ) {
		if (this._room)
			this._socket.leave(this._room);
		if (newRoom)
			this._socket.join(newRoom);
		this._room = newRoom;
	}

// 	get player(): gm.Player | undefined {
// 		if (!this.game) return ;
// 		return this.isPlayer1? this.game.player1 : this.game.player2;
// 	}
}
	

@WebSocketGateway({
	namespace: '/gamesocket',
	cors: { 
		origin: ['http://localhost:3000'], // localhost is react client
	}
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
	private _socks = new Map<string, SockState>();
	constructor(private games: GameRouter ) { }

	@WebSocketServer()
	_server: Server;

	handleConnection(client: Socket) {
		this._socks.set(client.id, new SockState(client));
		console.log('CONNECTION', client.id);
	}

	handleDisconnect(client: Socket) {
		console.log('DICONNECT', client.id);
		this._socks.delete(client.id);
	}

	_emitLobby(event, ...data) {
		this._server.to(SockState.LOBBY).emit(event, ...data); // broadcast
	}

	_emit(room, event, ...data) {
		if (room)
			this._server.to(room).emit(event, ...data); // broadcast
	}

	@SubscribeMessage('joinLobby')
	joinLobby(client: Socket, iutser): string[] | undefined {
		let con = this._socks.get(client.id);
		console.log(client.id, ': joinLobby');
		if ( this.games.hasRunning(con.room) ) 
			return ;
		//
		console.log('joined');
		con.room = SockState.LOBBY;
		return [...this.games.pendingGames];
	}

	@SubscribeMessage('join')
	joinGame( client: Socket, gameId: string) { 
		let con = this._socks.get(client.id);
		console.log(client.id, ': join game', gameId);
		if (!this.games.hasPending(gameId)) return;
		//
		console.log('found game');
		con.room = gameId;
		con.whichPlayer = gm.WhichPlayer.P2;
		let [startTime, game] = this.games.joinGame(gameId);
		//
		this._emitLobby('removedGame', gameId);
		//
		this._emit(
			gameId,
			'start',
			startTime, 
			game.newBall(gm.WhichPlayer.P1, startTime));
		console.log('start', client.id, startTime);

		let handleFinish = (winner: gm.WhichPlayer) => {
			this.games.finishGame(gameId);
			this._emit(gameId, 'finish', winner);
		}

		let resetBallTimer = () => {
			game.update();
			let dist = (game.ball.dx < 0)? 
				(game.ball.x - (-gm.PONG.ballSize)):
				(game.ball.x - gm.PONG.width);
			let ballResetTime = -dist / game.ball.dx * (1000 / gm.PONG.fps);
			console.log(ballResetTime);
			setTimeout( () => {
				let scorer : gm.WhichPlayer | null = null;
				if (game.ball.x <= -gm.PONG.ballSize) {
					scorer = gm.WhichPlayer.P2;
				} else if (game.ball.x >= gm.PONG.width) {
					scorer = gm.WhichPlayer.P1;
				}
				if (scorer) {
					if (++game.player(scorer).score >= 11)
						handleFinish(scorer);
					console.log('SCORE', game);
					let time = Date.now();
					game.newBall(scorer * -1, time);
					this._emit(gameId, 'gameUpdate', time, 
										 { ball: game.ball, player1: game.player1, player2: game.player2 });
				}
				resetBallTimer();
			}, ballResetTime);
		}
		resetBallTimer();
	}

	@SubscribeMessage('cancel')
	cancel(client: Socket) {
		console.log(client.id, 'cancel');
		let con = this._socks.get(client.id);
		let gameId = con.room;
		if (this.games.hasPending(gameId)) {
			this.games.cancelGame(gameId);
			this._emitLobby('removedGame', gameId);
			con.room = null;
		}
	}

	@SubscribeMessage('createGame')
	createGame(client: Socket) {
		console.log(client.id, ': creating game')
		let con = this._socks.get(client.id);
		if ( con.room && con.room != SockState.LOBBY )
			return ;
		//
		let newId = this.games.createGame();
		con.room = newId;
		console.log('created', newId);
		con.whichPlayer = gm.WhichPlayer.P1;
		this._emitLobby('newGame', newId);
	}

	@SubscribeMessage('changeMotion')
	setPlayerMotion(client: Socket, mo: gm.MotionType) {
		console.log(client.id, ': chmo');
		let con = this._socks.get(client.id);
		let game = this.games.get(con.room);
		if (  !game )
			return ;
		//
		let time = Date.now();
		console.log('chmo pre', game);
		game.update(time);
		game.player(con.whichPlayer).dy = mo * gm.PONG.playerSpeed;
		console.log('chmo post', game);
		console.log('will push', {player1: game.player1, player2: game.player2} );

		this._emit(con.room, 'gameUpdate', time, {ball: game.ball, player1: game.player1, player2: game.player2} );
		// TODO goalETA timer thing
	}


	// TODO handle disconnects

}
