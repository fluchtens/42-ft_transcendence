import { io, Socket } from 'socket.io-client';
import { 
	useRef,
	useEffect,
	useState,
	createContext,
	useContext,
} from 'react';
// import * as gm from './tmp_game_logic';

const SOCK_HOST = "localhost:3000"
const gameSocket = io(
	`${SOCK_HOST}/gamesocket`, 
	{ autoConnect: false, });
const SocketContext = createContext<Socket>(gameSocket);

export default function GameElement() {
	let sockRef = useRef<Socket>(gameSocket);
	useEffect( () => {
		sockRef.current.connect();
		// if (! socket.connected ) throw ...;
		return () => { sockRef.current.disconnect(); };
	}, []);
	return ( 
		<SocketContext.Provider value={sockRef.current}>
			<GameElementContent />
		</SocketContext.Provider>
	);
}

enum UserStatus { Normal, Waiting, Playing }
function GameElementContent() {
	const socket = useContext(SocketContext);
	const [ status, setStatus ] = useState<UserStatus | null>(null);
	// todo status logged_in or something?

	// authenticate and get status + log 
	// set hooks for changes of status
	useEffect( () => { 
		let userId = prompt('who are you?'); // TESTING
		socket.emit('authenticate', {userId}, (gotStatus: UserStatus | null) => {
			console.log('got status:', gotStatus);
			setStatus(gotStatus);
			// TODO handle error, not logged in etc
			// + What if already authenticated?
			// + Make it work if log out / re log in
		});

		socket.on('statusChange', (gotStatus: UserStatus) => { console.log('stat change'); setStatus(gotStatus); } );
		//cleanup
		return () => { socket.off('statusChange'); };
	}, []);

	let content = <></>
	switch (status) {
		case null: 
			content = (<p> you are not logged in </p>); 
		break;
		case UserStatus.Playing: 
			content = (<p>placeholder</p>);
		break;
		case UserStatus.Waiting:
			content = <GamesLobby waiting={true} />
		break;
		case UserStatus.Normal:
			content = <GamesLobby waiting={false} />
		break;
	}

	return content;
}

function GamesLobby({waiting = false}) {
	const socket = useContext(SocketContext);
	const [ gamesInfo, setGamesInfo ] = useState< Array<{name: string, host: string}> >([]);

	useEffect( () => {
		socket.emit('joinLobby', (gotGamesInfo) => {
		 	setGamesInfo(gotGamesInfo);
			console.log('lobby log.', 'waiting?', waiting? 'yes':'no');
// 			console.log('game info', gamesInfo);
		});

		socket.on('gameListUpdate', (gotGamesInfo) => {
		 	setGamesInfo(gotGamesInfo);
		})

		// cleanup
		return () => {socket.off('gameListUpdate');} ;
	}, []);

	// subcomponents
	function CreateGame() {
		let inputRef = useRef<null | HTMLInputElement >(null)
		function requestCreate() {
			if (!inputRef)
				throw new Error('???'); // TODO (impossible path normally)
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

	console.log('in compo. game info', gamesInfo);
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
	console.log('table: games info', gamesInfo);
	if (gamesInfo.length === 0) {
		return (
			<> <h2>Joinable Games</h2> <p> [ None ] </p> </>
		);
	}

	const fields = new Map([ ['Game Name', 'name'], ['Host', 'host'] ]);
	function joinButton(enabled, onClick) {
		return (
			enabled
			? <button onClick={onClick}> join </button>
			: <button disabled> join </button>
		);
	}
	function itemRow (item) {
		return (
			<tr>
				{[...fields.values()]
					.map( (key) => <td>{item[key]}</td> )
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
			{headerRow}
			{rows}
		</table>
		</>
	);
}
