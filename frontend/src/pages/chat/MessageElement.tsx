import { useChatSocket } from "../../hooks/useChatSocket";
import { notifyError, notifySuccess } from "../../utils/notifications";
import styles from "./MessageElement.module.scss";
import defaultAvatar from "/default_avatar.png";

interface MessageElementProps {
  avatar: string;
  username: string;
  content: string;
  userId: number;
  gameInvit?: boolean;
}

const MessageElement = ({
  avatar,
  username,
  content,
  userId,
  gameInvit,
}: MessageElementProps) => {
  const useChat = useChatSocket();
  const joiningGame = () => {
    if (gameInvit) {
      useChat.emit('joinGame', userId, (result: string) => {
        if (!result) {
          notifySuccess
          ('join game');
        }
        else if (result) {
          notifyError(result);
        }
      });
    }
  }

return(
  <>
    <div className={styles.avatar}>
      {avatar ? <img src={avatar} /> : <img src={defaultAvatar} />}
    </div>
    <div className={styles.texts}>
      <p className={styles.user}>{username}</p>
      <p className={styles.content}>{content}</p>
    </div>
    {gameInvit && <button className={styles.joinBtn} onClick={joiningGame}>Join</button>}
  </>
);
}

export { MessageElement };
