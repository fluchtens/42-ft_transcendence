import { blockUserApi, removeFriendApi } from "../../services/friendship.api";
import { User } from "../../types/user.interface";
import { notifyError, notifySuccess } from "../../utils/notifications";
import styles from "./UserContextMenu.module.scss";
import { Link, useNavigate } from "react-router-dom";

export enum ContextMenuType {
  FRIEND = "FRIEND",
  REQUEST = "REQUEST",
  MEMBER = "MEMBER",
}

interface UserContextMenuProps {
  user: User;
  type: ContextMenuType;
  cb: () => void;
}

const UserContextMenu = ({ user, type, cb }: UserContextMenuProps) => {
  const navigate = useNavigate();

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

  const sendPrivateMessage = async () => {
    cb();
    navigate("/chat/1");
  };

  const promoteOwner = async () => {
    cb();
    notifySuccess("promote owner");
  };

  const promoteAdmin = async () => {
    cb();
    notifySuccess("promote admin");
  };

  const demoteUser = async () => {
    cb();
    notifySuccess("demote user");
  };

  const renderButtons = () => {
    switch (type) {
      case ContextMenuType.FRIEND:
        return (
          <>
            <button onClick={removeFriend}>Remove friend</button>
          </>
        );
      case ContextMenuType.REQUEST:
        return null;
      case ContextMenuType.MEMBER:
        return (
          <>
            <button onClick={promoteOwner}>Promote to owner rank</button>
            <button onClick={promoteAdmin}>Promote to admin rank</button>
            <button onClick={demoteUser}>Demote to user rank</button>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <Link className={styles.link} to={`/user/${user.username}`} onClick={cb}>
        View user profile
      </Link>
      <button onClick={sendPrivateMessage}>Send private message</button>
      <button onClick={blockUser}>Block all communication</button>
      {renderButtons()}
    </div>
  );
};

export { UserContextMenu };
