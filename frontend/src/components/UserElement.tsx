import defaultAvatar from "/default_avatar.png";
import styles from "./UserElement.module.scss";
import { ContextMenuType, UserContextMenu } from "./UserContextMenu";
import { User } from "../types/user.interface";
import { Channel } from "../types/chat.interface";

interface UserElementProps {
  user: User;
  userRole?: string;
  channel?: Channel;
  role?: string;
  contextMenu: boolean;
  contextMenuType: ContextMenuType;
  toggleContextMenu: () => void;
}

const UserElement = ({
  user,
  userRole,
  channel,
  role,
  contextMenu,
  contextMenuType,
  toggleContextMenu,
}: UserElementProps) => {
  const isInGame = user.status === "In game";
  const isOnline = user.status === "Online";
  const isOffline = user.status === "Offline";

  const renderRole = (role: string) => {
    switch (role) {
      case "OWNER":
        return "Owner";
      case "ADMIN":
        return "Administrator";
      case "GUEST":
        return "Member";
      default:
        return "Unknow";
    }
  };

  return (
    <>
      <button
        className={`${styles.button} ${contextMenu ? styles.activeBtn : ""}`}
        onClick={toggleContextMenu}
      >
        {user.avatar ? <img src={user.avatar} /> : <img src={defaultAvatar} />}
        <div>
          {isInGame && (
            <>
              <p className={`${styles.username} ${styles.ingame}`}>
                {user.username}
              </p>
              <p className={`${styles.status} ${styles.ingame}`}>
                {user.status}
              </p>
            </>
          )}
          {isOnline && (
            <>
              <p className={`${styles.username} ${styles.online}`}>
                {user.username}
              </p>
              <p className={`${styles.status} ${styles.online}`}>
                {user.status}
              </p>
            </>
          )}
          {isOffline && (
            <>
              <p className={styles.username}>{user.username}</p>
              <p className={styles.status}>{user.status}</p>
            </>
          )}
          {!isInGame && !isOnline && !isOffline && (
            <>
              <p className={styles.username}>{user.username}</p>
              {role && <p className={styles.status}>{renderRole(role)}</p>}
            </>
          )}
        </div>
      </button>
      {contextMenu && (
        <UserContextMenu
          user={user}
          userRole={userRole}
          type={contextMenuType}
          channel={channel}
          cb={toggleContextMenu}
        />
      )}
    </>
  );
};

export { UserElement };
