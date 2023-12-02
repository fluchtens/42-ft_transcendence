import { User } from "../../types/user.interface";
import { FaUserPlus, FaMedal, FaUserPen } from "react-icons/fa6";
import { IoGameController, IoPodiumSharp } from "react-icons/io5";
import { PiFootprintsFill } from "react-icons/pi";
import { convertDate } from "../../utils/date";
import defaultAvatar from "/default_avatar.png";
import styles from "./UserDetails.module.scss";
import { Separator } from "../../components/Separator";
import { Stats } from "../../types/game.interface";
import { StatsBar } from "./StatsBar";
import { ManageBtn } from "./ManageBtn";
import winLossRatio from "../../utils/winLossRatio";

interface UserDetailsProps {
  targetUser: User;
  stats: Stats;
}

const UserDetails = ({ targetUser, stats }: UserDetailsProps) => {
  const totalMatches = stats.wonMatches + stats.lostMatches;

  return (
    <div className={styles.container}>
      <h1>Profile</h1>
      <Separator />
      <div className={styles.profile}>
        <div className={styles.user}>
          {targetUser.avatar ? (
            <img src={targetUser.avatar} />
          ) : (
            <img src={defaultAvatar} />
          )}
          <h2 className={styles.username}>{targetUser.username}</h2>
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
                <p className={styles.value}>
                  {convertDate(targetUser.createdAt)}
                </p>
              </li>
              <li className={styles.data}>
                <FaUserPen className={styles.icon} />
                <p className={styles.type}>Updated</p>
                <p className={styles.value}>
                  {convertDate(targetUser.updatedAt)}
                </p>
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
                <p className={styles.value}>
                  {winLossRatio(stats.wonMatches, stats.lostMatches)}
                </p>
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
