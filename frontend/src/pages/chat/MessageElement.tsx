import styles from "./MessageElement.module.scss";
import defaultAvatar from "/default_avatar.png";

interface MessageElementProps {
  avatar: string;
  username: string;
  content: string;
}

const MessageElement = ({ avatar, username, content }: MessageElementProps) => (
  <>
    <div className={styles.avatar}>
      {avatar ? <img src={avatar} /> : <img src={defaultAvatar} />}
    </div>
    <div className={styles.texts}>
      <p className={styles.user}>{username}</p>
      <p className={styles.content}>{content}</p>
    </div>
  </>
);

export { MessageElement };
