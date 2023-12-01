import { User } from "../../types/user.interface";
import { FaUser, FaUserPlus, FaMedal } from "react-icons/fa6";
import { IoGameController, IoPodiumSharp } from "react-icons/io5";
import { PiFootprintsFill } from "react-icons/pi";
import { convertDate } from "../../utils/date";
import defaultAvatar from "/default_avatar.png";
import styles from "./UserDetails.module.scss";
import { Separator } from "../../components/Separator";
import { Stats } from "../../types/game.interface";
import { StatsBar } from "./StatsBar";

interface UserDetailsProps {
  user: User;
  stats: Stats;
}

const UserDetails = ({ user, stats }: UserDetailsProps) => {
  const totalMatches = stats.wonMatches + stats.lostMatches;
  const winLossRatio = stats.wonMatches / stats.lostMatches;

  return (
    <div className={styles.container}>
      <h1>Profile</h1>
      <Separator />
      <div className={styles.profile}>
        {user.avatar ? <img src={user.avatar} /> : <img src={defaultAvatar} />}
        <div className={styles.details}>
          <div className={styles.lists}>
            <ul>
              <li className={styles.data}>
                <PiFootprintsFill className={styles.icon} />
                <p className={styles.type}>ID</p>
                <p className={styles.value}>{user.id}</p>
              </li>
              <li className={styles.data}>
                <FaUser className={styles.icon} />
                <p className={styles.type}>Username</p>
                <p className={styles.value}>{user.username}</p>
              </li>
              <li className={styles.data}>
                <FaUserPlus className={styles.icon} />
                <p className={styles.type}>Registered</p>
                <p className={styles.value}>{convertDate(user.createdAt)}</p>
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
                <p className={styles.value}>{user.rating}</p>
              </li>
              <li className={styles.data}>
                <IoPodiumSharp className={styles.icon} />
                <p className={styles.type}>W/L ratio</p>
                <p className={styles.value}>{winLossRatio.toFixed(2)}</p>
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
