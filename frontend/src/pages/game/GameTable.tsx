import { Button } from "@/components/ui/button";
import { GameInfo } from "./GameLobby";

export const GamesTable = ({
  gamesInfo,
  onJoin,
  joinEnable = true,
}: {
  gamesInfo: Array<GameInfo>;
  onJoin: (gameName: string) => undefined;
  joinEnable: boolean;
}) => {
  const fields = new Map([
    ["Name", "name"],
    ["Host", "host"],
    ["Rating", "rating"],
    ["Type", "type"],
  ]);

  function joinButton(enabled: boolean, onClick: () => undefined) {
    return enabled ? (
      <Button onClick={onClick} className="">
        Join
      </Button>
    ) : (
      <Button disabled>Join</Button>
    );
  }

  function itemRow(item: GameInfo) {
    return (
      <tr key={item.id} className="border-b border-opacity-5">
        {[...fields.values()].map((key, index) => (
          <td key={key} className={`py-3 ${index === 0 && "text-left"}`}>
            {(item as any)[key]}
          </td>
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
    <tr className="text-base font-semibold">
      {fieldkeys.map((field, index) => (
        <th key={field} className={`${index === 0 && "text-left"}`}>
          {field}
        </th>
      ))}
    </tr>
  );
  let rows = gamesInfo.map((item) => itemRow(item));

  return (
    <div className="mt-5 flex flex-col items-center">
      <label className="text-lg font-semibold">Joinable matchs</label>
      {gamesInfo.length === 0 ? (
        <p className="text-sm font-normal text-muted-foreground">No matchs available</p>
      ) : (
        <table className="mt-3 w-full text-right">
          <thead>{headerRow}</thead>
          <tbody>{rows}</tbody>
        </table>
      )}
    </div>
  );
};
