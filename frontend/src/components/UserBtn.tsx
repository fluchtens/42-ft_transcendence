import defaultAvatar from "/default_avatar.png";
import styles from "./UserBtn.module.scss";
import { AiFillCheckCircle } from "react-icons/ai";
import { AiFillCloseCircle } from "react-icons/ai";

interface UserBtnProps {
  friend: boolean;
  username: string;
  avatar: string;
}

const UserBtn = ({ friend, username, avatar }: UserBtnProps) => (
  <>
    {friend ? (
      <div className={styles.friendContainer}>
        {avatar ? <img src={avatar} /> : <img src={defaultAvatar} />}
        <div>
          <p className={styles.username}>{username}</p>
          <p className={styles.status}>Status</p>
        </div>
      </div>
    ) : (
      <div className={styles.requestContainer}>
        <div className={styles.userInfo}>
          {avatar ? <img src={avatar} /> : <img src={defaultAvatar} />}
          <p className={styles.username}>{username}</p>
        </div>

        <div className={styles.buttons}>
          <button>
            <AiFillCheckCircle className={styles.accept} />
          </button>
          <button>
            <AiFillCloseCircle className={styles.decline} />
          </button>
        </div>
      </div>
    )}
  </>
);

export { UserBtn };
