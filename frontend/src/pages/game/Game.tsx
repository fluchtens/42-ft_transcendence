import { Button } from "@/components/ui/button";
import { useGameSocket } from "@/hooks/useGameSocket";
import { useEffect, useState } from "react";
import { notifyError } from "../../utils/notifications";
import { GamesLobby } from "./GameLobby";
import { PongBoard } from "./PongBoard";

export default function Game() {
  const socket = useGameSocket();

  useEffect(() => {
    socket.on("gameSocketError", (errmsg: string) => {
      notifyError(errmsg);
    });

    return () => {
      socket.off("gameSocketError");
    };
  }, []);

  return <GameContent />;
}

enum UserStatus {
  Normal,
  Waiting,
  Playing,
}

const GameContent = () => {
  enum WinLose {
    NA = 0,
    Win,
    Lose,
  }
  const socket = useGameSocket();
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
      socket.emit("cancel", { silent: true });
      socket.off("statusChange");
      socket.off("winLose");
    };
  }, []);

  const WinScreen = ({ win = true }) => {
    return (
      <div className="m-auto max-w-screen-md h-full flex justify-center items-center">
        <div className="p-6 bg-card rounded-xl text-center">
          <h1 className="text-3xl font-semibold">YOU {win ? "WIN" : "LOSE"}!</h1>
          <Button onClick={() => setWinLose(WinLose.NA)} className="mt-2">
            Back to lobby
          </Button>
        </div>
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
        content = <PongBoard availWidth={858} availHeight={525} />;
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
