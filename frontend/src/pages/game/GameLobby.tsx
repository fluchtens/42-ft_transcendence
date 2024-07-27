import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useGameSocket } from "@/hooks/useGameSocket";
import { useEffect, useState } from "react";
import * as gm from "../../utils/gameLogic";
import { GamesTable } from "./GameTable";

export type GameInfo = {
  id: number;
  name: string;
  host: string;
  type: string;
  rating: number;
};

const CreateGame = ({ waiting }: { waiting: boolean }) => {
  const socket = useGameSocket();
  const [basicMatchName, setBasicMatchName] = useState<string>("");
  const [customMatchName, setCustomMatchName] = useState<string>("");
  const [selectedMap, setSelectedMap] = useState<string>("");
  let maps = new gm.WallGame().maps;

  const createBasicMatch = (e: React.FormEvent) => {
    e.preventDefault();
    socket.emit("createInvite", { gameName: basicMatchName });
    setBasicMatchName("");
  };

  const createCustomMatch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMap || selectedMap === "") {
      return;
    }
    socket.emit("createInvite", {
      gameName: customMatchName,
      type: "wall",
      args: { mapName: selectedMap },
    });
    setCustomMatchName("");
  };

  return (
    <div className="flex flex-col md:flex-row md:justify-between items-center md:items-start">
      <form onSubmit={createBasicMatch} className="mt-5 flex flex-col gap-1.5">
        <h2 className="text-lg font-semibold">Create a basic match</h2>
        <label className="text-sm font-medium">Name</label>
        <Input
          type="text"
          value={basicMatchName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setBasicMatchName(e.target.value)}
          placeholder="Enter a match name"
          required
          disabled={waiting}
        ></Input>
        <Button type="submit" disabled={waiting} className="mt-2">
          Create
        </Button>
      </form>
      <form onSubmit={createCustomMatch} className="mt-5 flex flex-col gap-1.5">
        <h2 className="text-lg font-semibold">Create a custom match</h2>
        <label className="text-sm font-medium">Name</label>
        <Input
          type="text"
          value={customMatchName}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setCustomMatchName(e.target.value)}
          placeholder="Enter a match name"
          required
          disabled={waiting}
        ></Input>
        <label className="text-sm font-medium">Map</label>
        <Select
          onValueChange={(mapName: string) => {
            setSelectedMap(mapName);
            console.log(mapName);
          }}
          required
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a map" />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              <SelectLabel>Maps</SelectLabel>
              {[...maps.keys()].map((mapName, index) => (
                <SelectItem key={index} value={mapName}>
                  {mapName}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
        <Button type="submit" disabled={waiting} className="mt-2">
          Create
        </Button>
      </form>
    </div>
  );
};

const JoinQueue = ({ waiting }: { waiting: boolean }) => {
  const socket = useGameSocket();

  const joinQueue = () => {
    socket.emit("joinQueue");
  };

  const cancelQueue = () => {
    socket.emit("cancel");
  };

  return (
    <div className="mt-5 flex flex-col items-center gap-1.5">
      {!waiting ? (
        <>
          <label className="text-lg font-semibold">Join matchmaking queue</label>
          <Button onClick={joinQueue}>Find an opponent</Button>
        </>
      ) : (
        <>
          <label className="text-lg font-semibold">Waiting for opponent...</label>
          <Button onClick={cancelQueue} variant="destructive">
            Cancel
          </Button>
        </>
      )}
    </div>
  );
};

export const GamesLobby = ({ waiting }: { waiting: boolean }) => {
  type GamesList = Array<GameInfo>;
  const socket = useGameSocket();
  const [gamesInfo, setGamesInfo] = useState<GamesList>([]);

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
    <div className="m-auto max-w-screen-xl flex flex-col gap-5">
      <div>
        <h1 className="text-2xl font-semibold text-center">Create match</h1>
        <Separator className="mt-2" />
        <CreateGame waiting={waiting} />
      </div>
      <div>
        <h1 className="text-2xl font-semibold text-center">Find match</h1>
        <Separator className="mt-2" />
        <JoinQueue waiting={waiting} />
        <GamesTable
          gamesInfo={gamesInfo}
          onJoin={(gameName) => {
            socket.emit("joinGame", gameName);
          }}
          joinEnable={!waiting}
        />
      </div>
    </div>
  );
};
