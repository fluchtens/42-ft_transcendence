import { User } from "../../types/user.interface";
import { FaUser, FaUserPlus, FaUserPen } from "react-icons/fa6";
import { PiFootprintsFill } from "react-icons/pi";
import { convertDate } from "../../utils/date";
import defaultAvatar from "/default_avatar.png";
import styles from "./UserDetails.module.scss";
import { Separator } from "../../components/Separator";

interface UserDetailsProps {
  user: User;
}

const UserDetails = ({ user }: UserDetailsProps) => (
  <div className={styles.container}>
    <h1>Profile</h1>
    <Separator />
    <div className={styles.details}>
      {user.avatar ? <img src={user.avatar} /> : <img src={defaultAvatar} />}
      <ul className={styles.dataList}>
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
        <li className={styles.data}>
          <FaUserPen className={styles.icon} />
          <p className={styles.type}>Updated</p>
          <p className={styles.value}>{convertDate(user.updatedAt)}</p>
        </li>
      </ul>
    </div>
  </div>
);

export { UserDetails };
