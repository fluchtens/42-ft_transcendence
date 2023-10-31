import { io, Socket } from 'socket.io-client';
import { 
	useRef,
	useEffect,
	useState,
	createContext,
	useContext,
} from 'react';
import * as gm from './tmp_game_logic';

const SocketContext = createContext<Socket>(io('wrongaddress').disconnect()); // dummy socket

function assertIsNotNull<Type>(x: Type | null | undefined): asserts x is Type {
	if (x === null || x === undefined)
		throw new Error('is Null');
}

// Proxy to GameState type thing (keep 2 versions to help syncing with servers)
class GameSynchronizer {
	private prev: gm.GameState;
	public cur: gm.GameState;
	constructor(time: number = Date.now()) {
// 		this.cur = new gm.GameState(time, ball);
// 		this.prev = new gm.GameState(time, ball);
		this.cur = new gm.GameState(time);
		this.prev = new gm.GameState(time);
	}

	// There's probably a cleverer way but harder to make work with typescript
	update(time: number = Date.now() ) { return this.cur.update(time); }
	player(which: gm.WhichPlayer): gm.Player { return this.cur.player(which); }
	newBall(to: gm.WhichPlayer) { return this.cur.newBall(to); }

	push(what: any, when: number) {
		this.prev.update(when);
		console.log('push', this, what);
		for (let key of ['player1', 'player2', 'ball' /*, ...*/ ]) {
			if (key in what)
				(this.prev as any)[key] = what[key];
		}
		[this.prev, this.cur] = [this.cur, this.prev];
		this.update();
		console.log('post push', this);
	}
}

// React Component
enum UserStatus { Default, OpponentPending, InGame, PostGame }
function PlayTab() {

	const [ status, setStatus ] = useState<UserStatus>(UserStatus.Default);
	const socket = useContext(SocketContext);
	const gameState = useRef<GameSynchronizer | null>(null);

	useEffect( function() {
		// TODO check socket connection ok
		socket.on('start', function (startTime : number, ball: gm.Ball) {
			setStatus(UserStatus.InGame);
			gameState.current = new GameSynchronizer(startTime);
			gameState.current.push({ball}, startTime);
		});
		socket.on('finish', function ( startTime : number ) {
// 			setStatus(UserStatus.PostGame);
			setStatus(UserStatus.Default);
			gameState.current = null;
		});
		///
		return function cleanup() { 
			socket.off('start'); 
			socket.off('finish'); 
		}
	}, []);

	function GameLobby() {
		const [gameList, setGameList] = useState<string[]>([]);
		let gamesRef = useRef< Set<string> >(new Set() );
		//
		useEffect( function() {
			socket.emit('joinLobby', function(games: string[]) {
				gamesRef.current = new Set(games);
				setGameList(games);
				console.log('joined lobby');
				console.log(games);
			});
			socket.on('newGame', function ( game ) {
				console.log(`new game: ${game}`);
				gamesRef.current.add(game);
				setGameList(Array.from(gamesRef.current));
			});
			socket.on('removedGame', function (game) {
				console.log(`removed game: ${game}`);
				gamesRef.current.delete(game);
				setGameList(Array.from(gamesRef.current));
			});
			////
			return function cleanup() { 
				socket.off('newGame');
				socket.off('removedGame');
				console.log('lobby cleanup');
			}
		}, []);
		//
		function JoinGameButton ( {game} : {game: string} ) {
			return (
				<li>
				## {game} ##
				<button onClick={ () => {socket.emit('join', game);} }>join game</button>
				</li>
			);
		}
		function CreateGameButton() {
			return (
				<button onClick={ () => {
					socket.emit('createGame' /*, user...*/);
					/* if OK */ setStatus(UserStatus.OpponentPending); // TODO don't assume ok
					console.log('created game');
				}}>
				Create New Game
				</button>
			);
		}
		//
		return (
			<>
			<h1> Games: </h1>
			<ul> { gameList.map( (game) => (<JoinGameButton key={game} game={game}/>) )} </ul>
			<h2> Create New Game </h2>
			<CreateGameButton /> 
			</>
		);
	}

	function PongBoard () {
		let board = useRef<HTMLCanvasElement | null>(null);
		useEffect( function () {
			function draw() {
				let cx = board?.current?.getContext('2d');
				if (!cx || !gameState.current)
					return ;
				cx.fillStyle = 'black';
				cx.fillRect(0, 0, gm.PONG.width, gm.PONG.height);
				cx.fillStyle = '#00ff80'; // bluish green
				let curState = gameState.current.cur;
				curState.update();
				// display paddles
				let [w, h] = [gm.PONG.paddleWidth, gm.PONG.paddleHeight];
				for (let {x, y} of [curState.player1, curState.player2]) {
					cx.fillRect(x, y, w, h);
				}
				// display ball
				if (curState.ball) {
					let {x, y} = curState.ball;
					cx.fillRect(x, y, w, w);
				}
				// display scores
				cx.font = "30px Monospace";
				cx.textAlign = "left";
				cx.fillText(String(curState.player1.score), 0, 30);
				cx.textAlign = "right";
				cx.fillText(String(curState.player2.score), gm.PONG.width - 1, 30);
				console.log('scores:', curState.player1.score, curState.player2.score);
				//
				requestAnimationFrame(draw);
			}

			socket.on('gameUpdate', (time, packet) => {
				gameState.current?.push(packet, time);
			});

			board.current?.focus();
			draw();
		}, []);

		const pressed = useRef< Set<string> >(new Set());
		function dir(): gm.MotionType {
			return Number(pressed.current.has("ArrowDown")) - Number(pressed.current.has("ArrowUp"));
		}

		function handleKeyDown(ev: any) { // TODO some sort of 'KeyboardEvent' instead of 'any'
			if (ev.repeat) return;
			console.log('keydown event', ev.key);
			if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
				pressed.current.add(ev.key);
				console.log('dir', dir());
				socket.emit('changeMotion', dir());
			}
		}
		function handleKeyUp(ev: any) {
			console.log('keyup event', typeof ev.key, ev.key);
			if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
				pressed.current.delete(ev.key); // refactor as one with _KeyUp?
				console.log('dir', dir());
				socket.emit('changeMotion', dir());
			}
		}

		if (!gameState.current) return <></>;
		//
		return (
			<canvas 
				ref={board} width={gm.PONG.width} height={gm.PONG.height}
				tabIndex={0} // apperently needed for onKey* events?
				onKeyDown={handleKeyDown} onKeyUp={handleKeyUp}>
			Cannot load pong game.
			</canvas>
		);
	}

	function AwaitingOpponent() { // better name?
		function cancel() {
			socket.emit('cancel');
			console.log('canceling');
			setStatus(UserStatus.Default);
		}
		return (
			<>
				<p>Waiting for opponent...</p>
				<button onClick={cancel}>Cancel</button>
			</>
		);
	}

// 	function WinLoseScreen(win: boolean) {
// 		return (
// 			<>
// 				(win ? (<p> You Win !</p>) : (<p> You Lose !</p>))
// 				<button onClick={() => setStatus(UserStatus.Default)}>
// 					Ok
// 				</button>
// 			</>
// 		)
// 	}

	let content = <></>; // tmp value
	if ( status === UserStatus.Default ) 					content = (<GameLobby />);
	if ( status === UserStatus.InGame ) 					content = (<PongBoard />);
	if ( status === UserStatus.OpponentPending )	content = (<AwaitingOpponent />);
// 	if ( status === UserStatus.PostGame )					content = (<WinLoseScreen />);

	// TODO maybe have explicit SocketProvider

	return content;
}

export default function GameElement() {
	let socket = useRef<Socket>(io('localhost:3000/gamesocket'));
	return ( 
		<SocketContext.Provider value={socket.current}>
			<PlayTab />
		</SocketContext.Provider>
	);
}
