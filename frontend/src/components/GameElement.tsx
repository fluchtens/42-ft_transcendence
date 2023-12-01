import { io, Socket } from 'socket.io-client';
import { 
	useRef,
	useEffect,
	useState,
	createContext,
	useContext,
} from 'react';
import * as gm from './gameLogic';

const SOCK_HOST = import.meta.env.VITE_BACK_URL;
const gameSocket = io(
	`${SOCK_HOST}/gamesocket`, 
	{ 
		autoConnect: false, 
		withCredentials: true,
		// maybe set those to check connection is alive with shorter timeouts
		// retries
		// ackTimeout
	});
const SocketContext = createContext<Socket>(gameSocket);

// TODO io.on('connection', () => {refresh();}) or something
// for reconnections
export default function GameElement() {
	let sockRef = useRef<Socket>(gameSocket);
	let [errmsg, setErrmsg] = useState<string | null>(null);

	useEffect( () => {
		sockRef.current.connect();
		sockRef.current.on('gameSocketError', (errmsg: string) => {
			setErrmsg(`Error: ${errmsg}`);
		});

		return () => { sockRef.current.disconnect(); };
	}, []);

	return ( 
		<SocketContext.Provider value={sockRef.current}>
			{errmsg
				? <p style={{color:'red'}}>
						{errmsg}
						<button onClick={() => {setErrmsg(null);}}>x</button>
					</p>
				: <></>
			}
			<GameElementContent />
		</SocketContext.Provider>
	);
}

enum UserStatus { Normal, Waiting, Playing }
function GameElementContent() {
	enum WinLose { NA = 0, Win, Lose };
	const socket = useContext(SocketContext);
	const [ status, setStatus ] = useState<UserStatus | undefined>(undefined);
	const [ winLose, setWinLose ] = useState(WinLose.NA);

	// authenticate and get status + log 
	// set hooks for changes of status
	useEffect( () => { 
		socket.emit('getStatus', (gotStatus: UserStatus | undefined) => {
			setStatus(gotStatus);
		});

		socket.on('statusChange', (gotStatus: UserStatus) => { 
			setStatus(gotStatus); 
		});
		socket.on('winLose', (gotWin: boolean) => { 
			setWinLose(gotWin? WinLose.Win: WinLose.Lose); 
		});
		//cleanup
		return () => { 
			socket.off('statusChange'); 
			socket.off('winLose');
		};
	}, []);

	function WinScreen({win = true}) {
		return (
			<p>
				<b> You { win ? "Win :)" : "Lose :(" } !!! </b>
				<button onClick={() => {setWinLose(WinLose.NA);}}> OK </button>
			</p>
		);
	}

	let content = <></>
	if (winLose != WinLose.NA) {
		content = <WinScreen win={winLose === WinLose.Win}/>
	} else {
		switch (status) {
			case undefined: 
				content = (<p> you are not logged in </p>); 
			break;
			case UserStatus.Playing: 
				content = <PongBoard availWidth={703} availHeight={501}/>; // TODO get width dynamically
			break;
			case UserStatus.Waiting:
				content = <GamesLobby waiting={true} />;
			break;
			case UserStatus.Normal:
				content = <GamesLobby waiting={false} />;
			break;
		}
	}

	return content;
}

function GamesLobby({waiting = false}) {
	type GamesList = Array<{name: string, host: string}>
	const socket = useContext(SocketContext);
	const [ gamesInfo, setGamesInfo ] = useState<GamesList>([]);

	useEffect( () => {
// 		socket.emit('joinLobby', (gotGamesInfo: GamesList) => {
// 		 	setGamesInfo(gotGamesInfo);
// 		});

		socket.on('gameListUpdate', (gotGamesInfo: GamesList) => {
		 	setGamesInfo(gotGamesInfo);
		})
		socket.emit('joinLobby');

		// cleanup
		return () => {socket.off('gameListUpdate');} ;
	}, []);

	// subcomponents
	function CreateGame() {
		let inputRef = useRef<null | HTMLInputElement >(null)
		function requestCreate() {
			if (!inputRef.current)
				throw new Error('Unexpected Error'); // (impossible path normally)
			socket.emit('createInvite', inputRef.current.value);
		}
		return (
			<>
				<h2> Create Public Invite </h2>
				<label>Game Name :<input ref={inputRef} /></label>
				<button onClick={requestCreate}> create </button>
			</>
		);
	}
	function JoinQueue() {
		return (
			<>
				<h2> Join Matchmaking Queue </h2>
				<button onClick={() => {socket.emit('joinQueue');}}> Find Opponent </button>
			</>
		);
	}

	return (
		<>
		<h1> Games Lobby </h1>
		{waiting?
			<>
				<p>Waiting for opponent...  </p>	
				<button onClick={()=> {socket.emit('cancel');} }> Cancel </button>
			</>
			: <></>
		}
		<GamesTable 
			gamesInfo={gamesInfo} 
			onJoin={ (gameName) => { socket.emit('joinGame', gameName); } }
			joinEnable={!waiting}
		/>
		{waiting? <></> : <CreateGame />}
		{waiting? <></> : <JoinQueue />}
		</>
	);
}

function GamesTable(
	{gamesInfo, onJoin, joinEnable = true} 
		: {
			gamesInfo: Array<{name: string, host: string}>,
			onJoin: ((gameName:string) => undefined),
			joinEnable: boolean,
		})
{
	if (gamesInfo.length === 0) {
		return (
			<> <h2>Joinable Games</h2> <p> [ None ] </p> </>
		);
	}

	const fields = new Map([ ['Game Name', 'name'], ['Host', 'host'], ['Rating', 'rating'] ]);
	function joinButton(enabled: boolean, onClick : () => undefined ) {
		return (
			enabled
			? <button onClick={onClick}> join </button>
			: <button disabled> join </button>
		);
	}
	function itemRow (item: {name: string}) {
		return (
			<tr>
				{[...fields.values()]
					.map( (key) => <td>{(item as any)[key]}</td> )
				}
				<td>{joinButton(joinEnable, () => {onJoin(item.name)})}</td>
			</tr>
		)
	}

	let fieldkeys = [...fields.keys()];
	fieldkeys.push('Join');
	let headerRow = (
		<tr> 
			{fieldkeys.map( (field) => <th>{field}</th>)}
		</tr>
	)
	let rows = gamesInfo.map( (item) => itemRow(item) );

	return (
		<>
		<h2> Joinable games </h2>
		<table>
			<thead>{headerRow}</thead>
			<tbody>{rows}</tbody>
		</table>
		</>
	);
}

function PongBoard({availWidth, availHeight}: {availWidth: number, availHeight: number}) {
	const gameRef = useRef(new gm.GameState());
	const socket = useContext(SocketContext);
	const boardRef = useRef<HTMLCanvasElement | null>(null)

	let scale = Math.min(
		Math.floor(availWidth / gm.PONG.width),
		Math.floor(availHeight / gm.PONG.height));
	scale = Math.max(1, scale); // if not enough space, dumb crop
	const [canvasWidth, canvasHeight] = [gm.PONG.width * scale, gm.PONG.height * scale];

	function drawGame(cx: CanvasRenderingContext2D) {
		function drawCountdown(seconds: number) {
			const center = { 
				x : Math.floor((canvasWidth + 1) / 2),
				y : Math.floor((canvasHeight + 1) / 2)
			};
			const textSize = Math.floor(canvasHeight / 15);
			cx.textAlign = 'center';
			cx.fillText(String(Math.ceil(seconds)), center.x, center.y + textSize/2, textSize);

			const arcWidth = 10;
			const frac = (seconds % 1);
			cx.beginPath();
			cx.arc(center.x, center.y, textSize, 0, frac * 2 * Math.PI, false);
			cx.arc(center.x, center.y, textSize + arcWidth, frac * 2 * Math.PI, 2 * Math.PI, true);
			cx.fill();
		}
		let game = gameRef.current

		cx.fillStyle = 'black';
		cx.fillRect(0, 0, gm.PONG.width * scale, gm.PONG.height * scale);
		cx.fillStyle = '#00ff80'; // bluish green
		game.update();

		// display paddles
		let [w, h] = [gm.PONG.paddleWidth * scale, gm.PONG.paddleHeight * scale];
		for (let {x, y} of [game.player1, game.player2]) {
			cx.fillRect(x * scale, y * scale, w, h);
		}

		// display ball
		if (game.ball) {
			let {x, y} = game.ball;
			cx.fillRect(x * scale, y * scale, w, w);
		} else {
			let countdown = game.timeToBall() / 1000;
			if (countdown > 0)
				drawCountdown(game.timeToBall() / 1000);
		}

		// display scores
		cx.font = `${Math.floor(canvasHeight / 15)}px Monospace`;
		cx.textAlign = "left";
		cx.fillText(String(game.player1.score), 0, 30);
		cx.textAlign = "right";
		cx.fillText(String(game.player2.score), gm.PONG.width * scale - 1, 30);
		//
		requestAnimationFrame( () => {drawGame(cx);} );
	}

	useEffect( function() {
		socket.emit('syncGame', (packet: {timestamp: number}) => {
			gameRef.current.pushPacket(packet);
		})
		socket.on('gameUpdate', (packet) => {
			gameRef.current.pushPacket(packet);
			gameRef.current.update(); // TESTING
		})

		boardRef.current?.focus();
		let cx = boardRef.current?.getContext('2d');
		if (! cx) throw new Error("Unexpected bad state");
		drawGame(cx);

		return function cleanup() {socket.off('gameUpdate');}
	}, []);

	const pressed = useRef< Set<string> >(new Set());
	function dir(): gm.MotionType {
		return Number(pressed.current.has("ArrowDown")) - Number(pressed.current.has("ArrowUp"));
	}

	function handleKeyDown(ev: any) { // TODO some sort of 'KeyboardEvent' instead of 'any'
		if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
			ev.preventDefault();
			if (ev.repeat) return;
			pressed.current.add(ev.key);
			socket.emit('playerMotion', dir());
		}
	}
	function handleKeyUp(ev: any) {
		if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
			ev.preventDefault();
			pressed.current.delete(ev.key); // refactor as one with _KeyUp?
			socket.emit('playerMotion', dir());
		}
	}

	return (
		<canvas 
			ref={boardRef} width={canvasWidth} height={canvasHeight}
			tabIndex={0} // apperently needed for onKey* events?
			onKeyDown={handleKeyDown} onKeyUp={handleKeyUp}>
		Cannot load pong game.
		</canvas>
	);
}

// 
// 
// 
// 
// 	useEffect( function () {
// 		function draw() {
// 			let cx = board?.current?.getContext('2d');
// 			if (!cx || !gameState.current)
// 				return ;
// 			cx.fillStyle = 'black';
// 			cx.fillRect(0, 0, gm.PONG.width, gm.PONG.height);
// 			cx.fillStyle = '#00ff80'; // bluish green
// 			let curState = gameState.current.cur;
// 			curState.update();
// 			// display paddles
// 			let [w, h] = [gm.PONG.paddleWidth, gm.PONG.paddleHeight];
// 			for (let {x, y} of [curState.player1, curState.player2]) {
// 				cx.fillRect(x, y, w, h);
// 			}
// 			// display ball
// 			if (curState.ball) {
// 				let {x, y} = curState.ball;
// 				cx.fillRect(x, y, w, w);
// 			}
// 			// display scores
// 			cx.font = "30px Monospace";
// 			cx.textAlign = "left";
// 			cx.fillText(String(curState.player1.score), 0, 30);
// 			cx.textAlign = "right";
// 			cx.fillText(String(curState.player2.score), gm.PONG.width - 1, 30);
// 			//
// 			requestAnimationFrame(draw);
// 		}
// 
// 		socket.on('gameUpdate', (time, packet) => {
// 			gameState.current?.push(packet, time);
// 		});
// 
// 		board.current?.focus();
// 		draw();
// 	}, []);
// 
// 	const pressed = useRef< Set<string> >(new Set());
// 	function dir(): gm.MotionType {
// 		return Number(pressed.current.has("ArrowDown")) - Number(pressed.current.has("ArrowUp"));
// 	}
// 
// 	function handleKeyDown(ev: any) { // TODO some sort of 'KeyboardEvent' instead of 'any'
// 		if (ev.repeat) return;
// 		if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
// 			pressed.current.add(ev.key);
// 			socket.emit('changeMotion', dir());
// 		}
// 	}
// 	function handleKeyUp(ev: any) {
// 		if (ev.key === 'ArrowDown' || ev.key === 'ArrowUp') {
// 			pressed.current.delete(ev.key); // refactor as one with _KeyUp?
// 			socket.emit('changeMotion', dir());
// 		}
// 	}
// 
// 	if (!gameState.current) return <></>;
// 	//
// 	return (
// 		<canvas 
// 			ref={board} width={gm.PONG.width} height={gm.PONG.height}
// 			tabIndex={0} // apperently needed for onKey* events?
// 			onKeyDown={handleKeyDown} onKeyUp={handleKeyUp}>
// 		Cannot load pong game.
// 		</canvas>
// 	);
// 	}
