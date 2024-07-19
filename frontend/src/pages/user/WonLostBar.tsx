import { Stats } from "../../types/game.interface";

export const WonLostBar = ({ stats }: { stats: Stats }) => {
  const totalMatches = stats.wonMatches + stats.lostMatches;
  const wonPercentage = (stats.wonMatches / totalMatches) * 100;
  const lostPercentage = 100 - wonPercentage;

  return (
    <div className="w-full">
      <div className="flex justify-between items-center text-lg font-bold">
        <p className="text-[#81b64c]">{wonPercentage.toFixed(2)}%</p>
        <p className="text-[#e02827]">{lostPercentage.toFixed(2)}%</p>
      </div>
      <div className="h-3 flex rounded-lg bg-[#374151]">
        <div className={`bg-[#81b64c] ${wonPercentage === 100 ? "rounded-lg" : "rounded-l-lg"}`} style={{ width: `${wonPercentage}%` }}></div>
        <div className={`bg-[#e02827] ${lostPercentage === 100 ? "rounded-lg" : "rounded-r-lg"}`} style={{ width: `${lostPercentage}%` }}></div>
      </div>
      <div className="mt-1 flex justify-between items-center text-sm font-normal">
        <p className="text-[#81b64c]">{stats.wonMatches} Won</p>
        <p className="text-[#e02827]">{stats.lostMatches} Lost</p>
      </div>
    </div>
  );
};
