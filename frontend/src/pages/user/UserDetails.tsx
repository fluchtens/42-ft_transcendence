import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FaMedal, FaUserPen, FaUserPlus } from "react-icons/fa6";
import { IoGameController, IoPodiumSharp } from "react-icons/io5";
import { PiFootprintsFill } from "react-icons/pi";
import { Separator } from "../../components/Separator";
import { Stats } from "../../types/game.interface";
import { User } from "../../types/user.interface";
import { convertDate } from "../../utils/date";
import winLossRatio from "../../utils/winLossRatio";
import { ManageBtn } from "./ManageBtn";
import { StatsBar } from "./StatsBar";
import styles from "./UserDetails.module.scss";

interface UserDetailsProps {
  targetUser: User;
  stats: Stats;
}

const UserDetails = ({ targetUser, stats }: UserDetailsProps) => {
  const totalMatches = stats.wonMatches + stats.lostMatches;

  return (
    <div className={styles.container}>
      <h1 className="text-2xl font-semibold">Profile</h1>
      <Separator />
      <div className={styles.profile}>
        <div className="flex flex-col items-center gap-3">
          <Avatar className="w-[14rem] h-[14rem] rounded-full">
            <AvatarFallback>{targetUser.username[0].toUpperCase()}</AvatarFallback>
            {targetUser.avatar && <AvatarImage src={targetUser.avatar} className="object-cover pointer-events-none" />}
          </Avatar>
          <h2 className="text-xl font-semibold">{targetUser.username}</h2>
          <ManageBtn targetUser={targetUser} />
        </div>
        <div className={styles.details}>
          <div className={styles.lists}>
            <ul>
              <li className={styles.data}>
                <PiFootprintsFill className={styles.icon} />
                <p className={styles.type}>ID</p>
                <p className={styles.value}>{targetUser.id}</p>
              </li>
              <li className={styles.data}>
                <FaUserPlus className={styles.icon} />
                <p className={styles.type}>Registered</p>
                <p className={styles.value}>{convertDate(targetUser.createdAt)}</p>
              </li>
              <li className={styles.data}>
                <FaUserPen className={styles.icon} />
                <p className={styles.type}>Updated</p>
                <p className={styles.value}>{convertDate(targetUser.updatedAt)}</p>
              </li>
            </ul>
            <ul>
              <li className={styles.data}>
                <IoGameController className={styles.icon} />
                <p className={styles.type}>Total games</p>
                <p className={styles.value}>{totalMatches}</p>
              </li>
              <li className={styles.data}>
                <FaMedal className={styles.icon} />
                <p className={styles.type}>Rating</p>
                <p className={styles.value}>{targetUser.rating}</p>
              </li>
              <li className={styles.data}>
                <IoPodiumSharp className={styles.icon} />
                <p className={styles.type}>W/L ratio</p>
                <p className={styles.value}>{winLossRatio(stats.wonMatches, stats.lostMatches)}</p>
              </li>
            </ul>
          </div>
          <StatsBar stats={stats} />
        </div>
      </div>
    </div>
  );
};

export { UserDetails };
