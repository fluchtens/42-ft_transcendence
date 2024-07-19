import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { FaMedal, FaUserPen, FaUserPlus } from "react-icons/fa6";
import { IoGameController, IoPodiumSharp } from "react-icons/io5";
import { PiFootprintsFill } from "react-icons/pi";
import { Stats } from "../../types/game.interface";
import { User } from "../../types/user.interface";
import { convertDate } from "../../utils/date";
import winLossRatio from "../../utils/winLossRatio";
import { ManageBtn } from "./ManageBtn";
import { StatsBar } from "./StatsBar";

interface UserDetailElementProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
}

const UserDetailElement = ({ icon, title, value }: UserDetailElementProps) => (
  <li className="mb-2 py-2 flex items-center gap-2 border-b">
    {icon}
    <p className="text-sm font-medium whitespace-nowrap">{title}</p>
    <p className="text-sm font-normal whitespace-nowrap ml-auto">{value}</p>
  </li>
);

interface UserDetailsProps {
  targetUser: User;
  stats: Stats;
}

const UserDetails = ({ targetUser, stats }: UserDetailsProps) => {
  const totalMatches = stats.wonMatches + stats.lostMatches;

  return (
    <div>
      <h1 className="text-2xl font-semibold text-center">Profile</h1>
      <Separator className="mt-2" />
      <div className="mt-6 flex flex-col md:flex-row justify-center items-center gap-12">
        <div className="flex flex-col items-center gap-3">
          <Avatar className="w-[14rem] h-[14rem] rounded-full">
            <AvatarFallback>{targetUser.username[0].toUpperCase()}</AvatarFallback>
            {targetUser.avatar && <AvatarImage src={targetUser.avatar} className="object-cover pointer-events-none" />}
          </Avatar>
          <h2 className="text-xl font-semibold">{targetUser.username}</h2>
          <ManageBtn targetUser={targetUser} />
        </div>
        <div className="w-full flex flex-col gap-4">
          <div className="flex flex-col md:flex-row md:gap-12">
            <ul className="w-full">
              <UserDetailElement icon={<PiFootprintsFill className="w-[1rem] h-[1rem]" />} title="ID" value={targetUser.id} />
              <UserDetailElement icon={<FaUserPlus className="w-[1rem] h-[1rem]" />} title="Registered" value={convertDate(targetUser.createdAt)} />
              <UserDetailElement icon={<FaUserPen className="w-[1rem] h-[1rem]" />} title="Updated" value={convertDate(targetUser.updatedAt)} />
            </ul>
            <ul className="w-full">
              <UserDetailElement icon={<IoGameController className="w-[1rem] h-[1rem]" />} title="Total games" value={totalMatches} />
              <UserDetailElement icon={<FaMedal className="w-[1rem] h-[1rem]" />} title="Rating" value={targetUser.rating} />
              <UserDetailElement
                icon={<IoPodiumSharp className="w-[1rem] h-[1rem]" />}
                title="W/L ratio"
                value={winLossRatio(stats.wonMatches, stats.lostMatches)}
              />
            </ul>
          </div>
          <StatsBar stats={stats} />
        </div>
      </div>
    </div>
  );
};

export { UserDetails };
