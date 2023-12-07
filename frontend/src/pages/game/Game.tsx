import { io, Socket } from "socket.io-client";
import { useRef, useEffect, useState, createContext, useContext } from "react";
import * as gm from "../../components/gameLogic";
import { Separator } from "../../components/Separator";
import { notifyError } from "../../utils/notifications";
import styles from "./Game.module.scss";
import lobbyStyles from "./GameLobby.module.scss";
import winStyles from "./GameWin.module.scss";

const SOCK_HOST = import.meta.env.VITE_BACK_URL;
const gameSocket = io(`${SOCK_HOST}/gamesocket`, {
  withCredentials: true,
});

const SocketContext = createContext<Socket>(gameSocket);

/* -------------------------------------------------------------------------- */
/*                                   General                                  */
/* -------------------------------------------------------------------------- */

function Game() {
  let sockRef = useRef<Socket>(gameSocket);

  useEffect(() => {
    sockRef.current.on("gameSocketError", (errmsg: string) => {
      notifyError(errmsg);
    });

    return () => {
      sockRef.current.off("gameSocketError");
    };
  }, []);

  return (
    <SocketContext.Provider value={sockRef.current}>
      <div className={styles.container}>
        <div className={styles.categories}>
          <GameElementContent />
        </div>
      </div>
    </SocketContext.Provider>
  );
}

export default Game;

/* -------------------------------------------------------------------------- */
/*                             GameElementContent                             */
/* -------------------------------------------------------------------------- */

enum UserStatus {
  Normal,
  Waiting,
  Playing,
}

enum WinLose {
  NA = 0,
  Win,
  Lose,
}

const GameElementContent = () => {
  const socket = useContext(SocketContext);
  const [status, setStatus] = useState<UserStatus | undefined>(undefined);
  const [winLose, setWinLose] = useState(WinLose.NA);

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

    return () => {
      socket.off("statusChange");
      socket.off("winLose");
    };
  }, []);

  const WinScreen = ({ win = true }) => {
    return (
      <div className={winStyles.container}>
        <h1>YOU {win ? "WIN" : "LOSE"}!</h1>
        <button onClick={() => setWinLose(WinLose.NA)}>Back to lobby</button>
      </div>
    );
  };

  let content = <></>;
  if (winLose != WinLose.NA) {
    content = <WinScreen win={winLose === WinLose.Win} />;
  } else {
    switch (status) {
      case undefined:
        content = <></>;
        break;
      case UserStatus.Playing:
        content = <PongBoard availWidth={703} availHeight={501} />; // TODO get width dynamically
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
};

/* -------------------------------------------------------------------------- */
/*                                 GamesLobby                                 */
/* -------------------------------------------------------------------------- */

const GamesLobby = ({ waiting = false }) => {
  type GamesList = Array<{ name: string; host: string }>;
  const socket = useContext(SocketContext);
  const [gamesInfo, setGamesInfo] = useState<GamesList>([]);

  const CreateGame = () => {
    const [matchName, setMatchName] = useState<string>("");

    const changeMatchName = (e: React.ChangeEvent<HTMLInputElement>) => {
      setMatchName(e.target.value);
    };

    const requestCreate = (e: React.FormEvent) => {
      e.preventDefault();
      if (waiting || !matchName) return;
      socket.emit("createInvite", matchName);
      setMatchName("");
    };

    return (
      <form onSubmit={requestCreate}>
        <label>Match Name</label>
        <input
          type="text"
          value={matchName}
          onChange={changeMatchName}
          placeholder="Enter a match name"
          required
          disabled={waiting}
        />
        {waiting ? (
          <button className={lobbyStyles.disabled} type="submit">
            Create Match
          </button>
        ) : (
          <button className={lobbyStyles.enabled} type="submit">
            Create Match
          </button>
        )}
      </form>
    );
  };

  const JoinQueue = () => {
    const joinQueue = () => {
      socket.emit("joinQueue");
    };

    const cancelQueue = () => {
      socket.emit("cancel");
    };

    return (
      <div className={lobbyStyles.joinQueue}>
        {!waiting ? (
          <>
            <label> Join matchmaking queue </label>
            <button className={lobbyStyles.confirm} onClick={joinQueue}>
              Find an opponent
            </button>
          </>
        ) : (
          <>
            <label>Waiting for opponent...</label>
            <button className={lobbyStyles.cancel} onClick={cancelQueue}>
              Cancel
            </button>
          </>
        )}
      </div>
    );
  };

  useEffect(() => {
    socket.on("gameListUpdate", (gotGamesInfo: GamesList) => {
      setGamesInfo(gotGamesInfo);
    });
    socket.emit("joinLobby");

    return () => {
      socket.off("gameListUpdate");
    };
  }, []);

  return (
    <div className={lobbyStyles.container}>
      <div className={lobbyStyles.createMatch}>
        <h1>Create match</h1>
        <Separator />
        <CreateGame />
      </div>
      <div className={lobbyStyles.findMatch}>
        <h1>Find match</h1>
        <Separator />
        <div className={lobbyStyles.findMatchOptions}>
          <JoinQueue />
          <GamesTable
            gamesInfo={gamesInfo}
            onJoin={(gameName) => {
              socket.emit("joinGame", gameName);
            }}
            joinEnable={!waiting}
          />
        </div>
      </div>
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                 GamesTable                                 */
/* -------------------------------------------------------------------------- */

interface GamesTableProps {
  gamesInfo: Array<{ name: string; host: string }>;
  onJoin: (gameName: string) => undefined;
  joinEnable: boolean;
}

const GamesTable = ({
  gamesInfo,
  onJoin,
  joinEnable = true,
}: GamesTableProps) => {
  const fields = new Map([
    ["Name", "name"],
    ["Host", "host"],
    ["Rating", "rating"],
  ]);

  const joinButton = (enabled: boolean, onClick: () => undefined) => {
    return enabled ? (
      <button className={lobbyStyles.enabled} onClick={onClick}>
        Join
      </button>
    ) : (
      <button className={lobbyStyles.disabled} disabled>
        Join
      </button>
    );
  };

  const itemRow = (item: { name: string }, index: number) => {
    return (
      <tr key={index}>
        {[...fields.values()].map((key, index) => (
          <td key={index}>{(item as any)[key]}</td>
        ))}
        <td>
          {joinButton(joinEnable, () => {
            onJoin(item.name);
          })}
        </td>
      </tr>
    );
  };

  let fieldkeys = [...fields.keys()];
  fieldkeys.push("Join");
  let headerRow = (
    <tr>
      {fieldkeys.map((field, index) => (
        <th key={index}>{field}</th>
      ))}
    </tr>
  );
  let rows = gamesInfo.map((item, index) => itemRow(item, index));

  return (
    <div className={lobbyStyles.joinableGames}>
      <label>Joinable matchs</label>
      {gamesInfo.length === 0 ? (
        <>
          <p>No matchs available</p>
        </>
      ) : (
        <>
          <table>
            <thead>{headerRow}</thead>
            <tbody>{rows}</tbody>
          </table>
        </>
      )}
    </div>
  );
};

/* -------------------------------------------------------------------------- */
/*                                 GamesTable                                 */
/* -------------------------------------------------------------------------- */

interface PongBoardProps {
  availWidth: number;
  availHeight: number;
}

const PongBoard = ({ availWidth, availHeight }: PongBoardProps) => {
  const gameRef = useRef(new gm.GameState());
  const socket = useContext(SocketContext);
  const boardRef = useRef<HTMLCanvasElement | null>(null);

  let scale = Math.min(
    Math.floor(availWidth / gm.PONG.width),
    Math.floor(availHeight / gm.PONG.height)
  );
  scale = Math.max(1, scale); // if not enough space, dumb crop
  const [canvasWidth, canvasHeight] = [
    gm.PONG.width * scale,
    gm.PONG.height * scale,
  ];

  function drawGame(cx: CanvasRenderingContext2D) {
    function drawCountdown(seconds: number) {
      const center = {
        x: Math.floor((canvasWidth + 1) / 2),
        y: Math.floor((canvasHeight + 1) / 2),
      };
      const textSize = Math.floor(canvasHeight / 15);
      cx.textAlign = "center";
      cx.fillText(
        String(Math.ceil(seconds)),
        center.x,
        center.y + textSize / 2,
        textSize
      );

      const arcWidth = 10;
      const frac = seconds % 1;
      cx.beginPath();
      cx.arc(center.x, center.y, textSize, 0, frac * 2 * Math.PI, false);
      cx.arc(
        center.x,
        center.y,
        textSize + arcWidth,
        frac * 2 * Math.PI,
        2 * Math.PI,
        true
      );
      cx.fill();
    }
    let game = gameRef.current;

    cx.fillStyle = "black";
    cx.fillRect(0, 0, gm.PONG.width * scale, gm.PONG.height * scale);
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
      if (countdown > 0) drawCountdown(game.timeToBall() / 1000);
    }

    // display scores
    cx.font = `${Math.floor(canvasHeight / 15)}px Monospace`;
    cx.textAlign = "left";
    cx.fillText(String(game.player1.score), 0, 30);
    cx.textAlign = "right";
    cx.fillText(String(game.player2.score), gm.PONG.width * scale - 1, 30);
    //
    requestAnimationFrame(() => {
      drawGame(cx);
    });
  }

  useEffect(function () {
    socket.emit("syncGame", (packet: { timestamp: number }) => {
      gameRef.current.pushPacket(packet);
    });
    socket.on("gameUpdate", (packet) => {
      gameRef.current.pushPacket(packet);
      gameRef.current.update(); // TESTING
    });

    boardRef.current?.focus();
    let cx = boardRef.current?.getContext("2d");
    if (!cx) throw new Error("Unexpected bad state");
    drawGame(cx);

    return function cleanup() {
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
    // TODO some sort of 'KeyboardEvent' instead of 'any'
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
      pressed.current.delete(ev.key); // refactor as one with _KeyUp?
      socket.emit("playerMotion", dir());
    }
  }

  return (
    <canvas
      ref={boardRef}
      width={canvasWidth}
      height={canvasHeight}
      tabIndex={0} // apperently needed for onKey* events?
      onKeyDown={handleKeyDown}
      onKeyUp={handleKeyUp}
    >
      Cannot load pong game.
    </canvas>
  );
};
