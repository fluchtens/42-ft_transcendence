import { Separator } from "@/components/ui/separator";
import { GiPingPongBat } from "react-icons/gi";
import { Game } from "../../types/game.interface";
import { convertDate } from "../../utils/date";

interface UserHistoryProps {
  history: Game[];
}

const UserHistory = ({ history }: UserHistoryProps) => (
  <div>
    <h1 className="text-2xl font-semibold text-center">Match history</h1>
    <Separator className="mt-2" />
    {history?.length === 0 ? (
      <p className="mt-2 text-sm text-muted-foreground text-center">No games played</p>
    ) : (
      <ul>
        {history.map((match) => (
          <li className="py-4 flex flex-col items-center border-b" key={match.id}>
            <p className="text-sm font-medium text-[#7e848c]">{convertDate(match.finished)}</p>
            <div className="flex items-center gap-5">
              <div className="flex flex-col items-end">
                <p className="text-lg font-semibold">{match.winner.username}</p>
                <div className="flex items-center gap-1">
                  <p className="text-base font-normal">{match.winnerRatingAfter}</p>
                  <p className="text-base font-medium text-[#81b64c]">+{match.winnerRatingAfter - match.winnerRatingBefore}</p>
                </div>
              </div>
              <GiPingPongBat className="w-[2rem] h-[2rem]" />
              <div className="flex flex-col items-start">
                <p className="text-lg font-semibold">{match.loser.username}</p>
                <div className="flex items-center gap-1">
                  <p className="text-base font-normal">{match.loserRatingAfter}</p>
                  <p className="text-base font-medium text-[#e02827]">{match.loserRatingAfter - match.loserRatingBefore}</p>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    )}
  </div>
);

export { UserHistory };
