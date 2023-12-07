import { io, Socket } from "socket.io-client";
import { useRef, useEffect, useState, createContext, useContext } from "react";
import * as gm from "./gameLogic";

const SOCK_HOST = import.meta.env.VITE_BACK_URL;
const gameSocket = io(`${SOCK_HOST}/gamesocket`, {
  withCredentials: true,
});
const SocketContext = createContext<Socket>(gameSocket);

export default function GameElement() {
  let sockRef = useRef<Socket>(gameSocket);
  let [errmsg, setErrmsg] = useState<string | null>(null);

  useEffect(() => {
    sockRef.current.on("gameSocketError", (errmsg: string) => {
      setErrmsg(`Error: ${errmsg}`);
    });
  }, []);

  return (
    <SocketContext.Provider value={sockRef.current}>
      {errmsg ? (
        <p style={{ color: "red" }}>
          {errmsg}
          <button
            onClick={() => {
              setErrmsg(null);
            }}
          >
            {" "}
            x{" "}
          </button>
        </p>
      ) : (
        <></>
      )}
      <GameElementContent />
    </SocketContext.Provider>
  );
}

enum UserStatus {
  Normal,
  Waiting,
  Playing,
}
function GameElementContent() {
  enum WinLose {
    NA = 0,
    Win,
    Lose,
  }
  const socket = useContext(SocketContext);
  const [status, setStatus] = useState<UserStatus | undefined>(undefined);
  const [winLose, setWinLose] = useState(WinLose.NA);

  // authenticate and get status + log
  // set hooks for changes of status
  useEffect(() => {
    socket.emit("getStatus", (gotStatus: UserStatus | undefined) => {
      setStatus(gotStatus);
    });

    socket.on("statusChange", (gotStatus: UserStatus) => {
      setStatus(gotStatus);
    });
    socket.on("winLose", (gotWin: boolean) => {
      setWinLose(gotWin ? WinLose.Win : WinLose.Lose);
    });
    //cleanup
    return () => {
      socket.emit("cancel", { silent: true });
      socket.off("statusChange");
      socket.off("winLose");
    };
  }, []);

  function WinScreen({ win = true }) {
    return (
      <p>
        <b> You {win ? "Win :)" : "Lose :("} !!! </b>
        <button
          onClick={() => {
            setWinLose(WinLose.NA);
          }}
        >
          {" OK "}
        </button>
      </p>
    );
  }

  let content = <></>;
  if (winLose != WinLose.NA) {
    content = <WinScreen win={winLose === WinLose.Win} />;
  } else {
    switch (status) {
      case undefined:
        content = <p>cannot reach server</p>;
        break;
      case UserStatus.Playing:
        content = <PongBoard availWidth={1280} availHeight={720} />;
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

type GameInfo = {
  id: number;
  name: string;
  host: string;
  type: string;
  rating: number;
};
function GamesLobby({ waiting = false }) {
  type GamesList = Array<GameInfo>;
  const socket = useContext(SocketContext);
  const [gamesInfo, setGamesInfo] = useState<GamesList>([]);

  useEffect(() => {
    socket.on("gameListUpdate", (gotGamesInfo: GamesList) => {
      setGamesInfo(gotGamesInfo);
    });
    socket.emit("joinLobby");

    // cleanup
    return () => {
      socket.off("gameListUpdate");
    };
  }, []);

  // subcomponents
  function CreateGame() {
    let inputRef = useRef<null | HTMLInputElement>(null);
    let mapChoice = useRef<null | HTMLSelectElement>(null);
    function requestCreate(custom = false) {
      if (!inputRef.current) return;
      if (custom) {
        if (!mapChoice.current) return;
        //
        socket.emit("createInvite", {
          gameName: inputRef.current.value,
          type: "wall",
          args: { mapName: mapChoice.current.value },
        });
      } else {
        socket.emit("createInvite", { gameName: inputRef.current.value });
      }
    }
    let maps = new gm.WallGame().maps;
    return (
      <>
        <h2> Create Public Invite </h2>
        <label>
          Game Name :<input ref={inputRef} />
        </label>
        <p>
          <button
            onClick={() => {
              requestCreate();
            }}
          >
            {" "}
            Create Classic Game
          </button>
        </p>
        <p>
          Or use a custom map:
          <select ref={mapChoice}>
            {[...maps.keys()].map((mapName) => (
              <option value={mapName} key={mapName}>
                {mapName}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              requestCreate(true);
            }}
          >
            {" "}
            Create Custom Map Game{" "}
          </button>
        </p>
      </>
    );
  }
  function JoinQueue() {
    return (
      <>
        <h2> Join Matchmaking Queue </h2>
        <button
          onClick={() => {
            socket.emit("joinQueue");
          }}
        >
          {" "}
          Find Opponent{" "}
        </button>
      </>
    );
  }

  return (
    <>
      <h1> Games Lobby </h1>
      <hr />
      {waiting ? (
        <>
          <p>Waiting for opponent... </p>
          <button
            onClick={() => {
              socket.emit("cancel");
            }}
          >
            {" "}
            Cancel{" "}
          </button>
        </>
      ) : (
        <></>
      )}
      {waiting ? <></> : <JoinQueue />}
      <hr />
      {waiting ? <></> : <CreateGame />}
      <hr />
      <GamesTable
        gamesInfo={gamesInfo}
        onJoin={(gameName) => {
          socket.emit("joinGame", gameName);
        }}
        joinEnable={!waiting}
      />
    </>
  );
}

function GamesTable({
  gamesInfo,
  onJoin,
  joinEnable = true,
}: {
  gamesInfo: Array<GameInfo>;
  onJoin: (gameName: string) => undefined;
  joinEnable: boolean;
}) {
  if (gamesInfo.length === 0) {
    return (
      <>
        <h2>Joinable Games</h2>
        <p> [ None ] </p>
      </>
    );
  }

  const fields = new Map([
    ["Name", "name"],
    ["Host", "host"],
    ["Rating", "rating"],
    ["Type", "type"],
  ]);
  function joinButton(enabled: boolean, onClick: () => undefined) {
    return enabled ? (
      <button onClick={onClick}> join </button>
    ) : (
      <button disabled> join </button>
    );
  }
  function itemRow(item: GameInfo) {
    return (
      <tr key={item.id}>
        {[...fields.values()].map((key) => (
          <td key={key}>{(item as any)[key]}</td>
        ))}
        <td>
          {joinButton(joinEnable, () => {
            onJoin(item.name);
          })}
        </td>
      </tr>
    );
  }

  let fieldkeys = [...fields.keys()];
  fieldkeys.push("Join");
  let headerRow = (
    <tr>
      {fieldkeys.map((field) => (
        <th key={field}>{field}</th>
      ))}
    </tr>
  );
  let rows = gamesInfo.map((item) => itemRow(item));

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

function PongBoard({
  availWidth,
  availHeight,
}: {
  availWidth: number;
  availHeight: number;
}) {
  // DRAW FUNCTIONS
  function drawCountdown(
    cx: CanvasRenderingContext2D,
    seconds: number,
    { width, height }: { width: number; height: number },
    color = "#4000ff"
  ) {
    const cen = {
      x: Math.floor((width + 1) / 2),
      y: Math.floor((height + 1) / 2),
    };
    const textSize = Math.floor(height / 15);
    let saveColor = cx.fillStyle;
    cx.fillStyle = color;
    cx.textAlign = "center";
    cx.fillText(
      String(Math.ceil(seconds)),
      cen.x,
      cen.y + textSize / 2,
      textSize
    );

    const arcWidth = 10;
    const frac = seconds % 1;
    cx.beginPath();
    cx.arc(cen.x, cen.y, textSize, 0, frac * 2 * Math.PI, false);
    cx.arc(
      cen.x,
      cen.y,
      textSize + arcWidth,
      frac * 2 * Math.PI,
      2 * Math.PI,
      true
    );
    cx.fill();
    cx.fillStyle = saveColor;
  }

  function drawGame(
    cx: CanvasRenderingContext2D,
    { width, height, scale }: { width: number; height: number; scale: number }
  ) {
    let game: any = gameRef.current; // will actually be `ClassicGame`
    if (!game || !cx) return;

    cx.fillStyle = "black";
    cx.fillRect(0, 0, width, height);
    cx.fillStyle = "#00ff80"; // bluish green
    game.update();

    // display paddles
    let [w, h] = [gm.PONG.paddleWidth * scale, gm.PONG.paddleHeight * scale];
    for (let { x, y } of [game.player1, game.player2]) {
      cx.fillRect(x * scale, y * scale, w, h);
    }

    // display ball
    if (game.ball) {
      let { x, y } = game.ball;
      cx.fillRect(x * scale, y * scale, w, w);
    } else {
      let countdown = game.timeToBall() / 1000;
      if (countdown > 0)
        drawCountdown(cx, game.timeToBall() / 1000, { width, height });
    }

    // display scores
    let textHeight = Math.floor(height / 15);
    cx.font = `${textHeight}px Monospace`;
    cx.textAlign = "left";
    cx.fillText(String(game.player1.score), 0, textHeight);
    cx.textAlign = "right";
    cx.fillText(String(game.player2.score), width - 1, textHeight);
    //
    requestAnimationFrame(() => {
      drawGame(cx, { width, height, scale });
    });
  }

  function drawWallGame(
    cx: CanvasRenderingContext2D,
    { width, height }: { width: number; height: number }
  ) {
    function rtop(r: number): number {
      // real to pixel
      return Math.ceil((r / gm.WALL_PONG.width) * width);
    }

    let game: any = gameRef.current; // will actually be `WallGame`
    if (!game || !cx) return;

    game.update();

    cx.fillStyle = "black";
    cx.fillRect(0, 0, width, height);

    cx.fillStyle = "#00ff80"; // bluish green

    // display paddles
    let [w, h] = [
      rtop(gm.WALL_PONG.paddleWidth),
      rtop(gm.WALL_PONG.paddleHeight),
    ];
    for (let { x, y } of game.players) {
      [x, y] = [rtop(x), rtop(y)];
      cx.fillRect(x, y, w, h);
    }

    // display walls
    for (let { x, y, w, h } of game.walls) {
      [x, y, w, h] = [x, y, w, h].map(rtop);
      cx.fillRect(x, y, w, h);
    }

    // display scores
    let textHeight = Math.floor(height / 15);
    cx.font = `${textHeight}px Monospace`;
    cx.textAlign = "left";
    cx.fillText(String(game.scores[0]), 0, textHeight);
    cx.textAlign = "right";
    cx.fillText(String(game.scores[1]), width - 1, textHeight);
    //
    requestAnimationFrame(() => {
      drawWallGame(cx, { width, height });
    });

    // display ball
    let countdown = game.timeToBall() / 1000;
    if (countdown <= 0) {
      let { x, y } = game.ball;
      [x, y] = [rtop(x), rtop(y)];
      cx.fillRect(x, y, w, w);
    } else {
      drawCountdown(cx, game.timeToBall() / 1000, { width, height });
    }
  }

  // ACTUAL COMPONENT LOGIC
  const gameRef = useRef<gm.Game | null>(null);
  const socket = useContext(SocketContext);
  const boardRef = useRef<HTMLCanvasElement | null>(null);

  let [canvasDim, setCanvasDim] = useState<[number, number]>([
    availWidth,
    availHeight,
  ]);
  // 	let [canvasWidth, canvasHeight] = [availWidth, availHeight];
  // reset them before drawGame in some cases

  useEffect(function () {
    socket.emit(
      "syncGame",
      ({
        type,
        args,
        packet,
      }: {
        type: "classic" | "wall";
        args: any;
        packet: any;
      }) => {
        if (!gameRef.current) {
          gameRef.current = gm.makeGame({ type, args });
          gameRef.current.pushPacket(packet);

          boardRef.current?.focus();
          let cx = boardRef.current?.getContext("2d");
          if (!cx) throw new Error("Unexpected bad state");

          if (type === "classic") {
            let scale = Math.min(
              Math.floor(availWidth / gm.PONG.width),
              Math.floor(availHeight / gm.PONG.height)
            );
            scale = Math.max(1, scale); // if not enough space, dumb crop
            let [width, height] = [
              gm.PONG.width * scale,
              gm.PONG.height * scale,
            ];
            setCanvasDim([width, height]);
            drawGame(cx, { width, height, scale });
          } else if (type === "wall") {
            let aspectRatio = gm.WALL_PONG.width / gm.WALL_PONG.height;
            let [width, height] = [0, 0];
            if (availWidth >= availHeight * aspectRatio)
              [width, height] = [availHeight * aspectRatio, availHeight];
            else [width, height] = [availWidth, availWidth / aspectRatio];
            setCanvasDim([width, height]);
            drawWallGame(cx, { width, height });
          }
        } else {
          gameRef.current.pushPacket(packet);
        }
      }
    );

    socket.on("gameUpdate", (packet) => {
      if (!gameRef.current) return;

      gameRef.current.pushPacket(packet);
      gameRef.current.update();
    });

    return function cleanup() {
      gameRef.current = null;
      socket.off("gameUpdate");
    };
  }, []);

  const pressed = useRef<Set<string>>(new Set());
  function dir(): gm.MotionType {
    return (
      Number(pressed.current.has("ArrowDown")) -
      Number(pressed.current.has("ArrowUp"))
    );
  }

  function handleKeyDown(ev: any) {
    if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
      ev.preventDefault();
      if (ev.repeat) return;
      pressed.current.add(ev.key);
      socket.emit("playerMotion", dir());
    }
  }
  function handleKeyUp(ev: any) {
    if (ev.key === "ArrowDown" || ev.key === "ArrowUp") {
      ev.preventDefault();
      pressed.current.delete(ev.key);
      socket.emit("playerMotion", dir());
    }
  }

  return (
    <canvas
      ref={boardRef}
      width={canvasDim[0]}
      height={canvasDim[1]}
      tabIndex={0} // apparently needed for onKey* events?
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
    >
      Cannot load pong game.
    </canvas>
  );
}

// function PongBox() {
// 	let box = useRef<HTMLDivElement | null>(null);
// 	let [dims, setDims] = useState<{width: number, height: number}>({width: 750, height: 500});
//
// 	useEffect( () => {
// 		addEventListener("resize", () => {
// 			if (!box.current) return;
//
// 			let newDims = { width: box.current.clientWidth, height: box.current.clientHeight};
// 			setDims( newDims );
// 			console.log(newDims);
// 		});
// 	}, []);
//
// 	return (
// 		<div ref={box} style={{width: '100%', height: '100%'}}>
// 			<PongBoard
// 				availWidth={dims.width}
// 				availHeight={dims.height}
// 			/>
// 		</div>
// 	);
// }
