import defaultAvatar from "/default_avatar.png";
import styles from "./UserBtn.module.scss";

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
          <p className={styles.status}>In game</p>
        </div>
      </div>
    ) : (
      <div className={styles.requestContainer}>
        {avatar ? <img src={avatar} /> : <img src={defaultAvatar} />}
        <p className={styles.username}>{username}</p>
      </div>
    )}
  </>
);

export { UserBtn };
