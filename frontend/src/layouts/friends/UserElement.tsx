import defaultAvatar from "/default_avatar.png";
import styles from "./UserElement.module.scss";
import { AiFillCheckCircle } from "react-icons/ai";
import { AiFillCloseCircle } from "react-icons/ai";
import { notifyError, notifySuccess } from "../../utils/notifications";
import {
  acceptFriendRequestApi,
  declineFriendRequestApi,
} from "../../services/friendship.api";

interface UserElementProps {
  friend: boolean;
  id: number;
  username: string;
  avatar: string;
}

const UserElement = ({ friend, id, username, avatar }: UserElementProps) => {
  const acceptFriendRequest = async () => {
    const { success, message } = await acceptFriendRequestApi(id);
    success ? notifySuccess(message) : notifyError(message);
  };

  const declineFriendRequest = async () => {
    const { success, message } = await declineFriendRequestApi(id);
    success ? notifySuccess(message) : notifyError(message);
  };

  return (
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
            <button onClick={acceptFriendRequest}>
              <AiFillCheckCircle className={styles.accept} />
            </button>
            <button onClick={declineFriendRequest}>
              <AiFillCloseCircle className={styles.decline} />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export { UserElement };
