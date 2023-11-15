import { blockUserApi, removeFriendApi } from "../../services/friendship.api";
import { User } from "../../types/user.interface";
import { notifyError, notifySuccess } from "../../utils/notifications";
import styles from "./UserContextMenu.module.scss";
import { Link } from "react-router-dom";

interface UserContextMenuProps {
  user: User;
  cb: () => void;
}

const UserContextMenu = ({ user, cb }: UserContextMenuProps) => {
  const removeFriend = async () => {
    cb();
    const { success, message } = await removeFriendApi(user.id);
    success ? notifySuccess(message) : notifyError(message);
  };

  const blockUser = async () => {
    cb();
    const { success, message } = await blockUserApi(user.id);
    success ? notifySuccess(message) : notifyError(message);
  };

  return (
    <div className={styles.container}>
      <Link className={styles.link} to={`/user/${user.username}`} onClick={cb}>
        View user profile
      </Link>
      <button onClick={blockUser}>Block all communication</button>
      <button onClick={removeFriend}>Remove friend</button>
    </div>
  );
};

export { UserContextMenu };
