import defaultAvatar from "/default_avatar.png";
import styles from "./UserReqElement.module.scss";
import { AiFillCheckCircle } from "react-icons/ai";
import { AiFillCloseCircle } from "react-icons/ai";
import { notifyError, notifySuccess } from "../../utils/notifications";
import {
  acceptFriendRequestApi,
  declineFriendRequestApi,
} from "../../services/friendship.api";
import { UserContextMenu } from "./UserContextMenu";
import { User } from "../../types/user.interface";

interface UserReqElementProps {
  user: User;
  contextMenu: boolean;
  toggleContextMenu: () => void;
}

const UserReqElement = ({
  user,
  contextMenu,
  toggleContextMenu,
}: UserReqElementProps) => {
  const acceptFriendRequest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const { success, message } = await acceptFriendRequestApi(user.id);
    success ? notifySuccess(message) : notifyError(message);
  };

  const declineFriendRequest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const { success, message } = await declineFriendRequestApi(user.id);
    success ? notifySuccess(message) : notifyError(message);
  };

  return (
    <div className={styles.requestContainer}>
      <button className={styles.requestBtn} onClick={toggleContextMenu}>
        <div className={styles.userInfo}>
          {user.avatar ? (
            <img src={user.avatar} />
          ) : (
            <img src={defaultAvatar} />
          )}
          <p className={styles.username}>{user.username}</p>
        </div>
        <div className={styles.buttons}>
          <button onClick={acceptFriendRequest}>
            <AiFillCheckCircle className={styles.accept} />
          </button>
          <button onClick={declineFriendRequest}>
            <AiFillCloseCircle className={styles.decline} />
          </button>
        </div>
      </button>
      {contextMenu && <UserContextMenu user={user} cb={toggleContextMenu} />}
    </div>
  );
};

export { UserReqElement };
