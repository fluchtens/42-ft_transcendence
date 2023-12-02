import defaultAvatar from "/default_avatar.png";
import styles from "./UserElement.module.scss";
import { ContextMenuType, UserContextMenu } from "./UserContextMenu";
import { User } from "../types/user.interface";

interface UserElementProps {
  user: User;
  contextMenu: boolean;
  contextMenuType: ContextMenuType;
  toggleContextMenu: () => void;
}

const UserElement = ({
  user,
  contextMenu,
  contextMenuType,
  toggleContextMenu,
}: UserElementProps) => {
  const isInGame = user.status === "In game";
  const isOnline = user.status === "Online";
  const isOffline = user.status === "Offline";

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
            </>
          )}
        </div>
      </button>
      {contextMenu && (
        <UserContextMenu
          user={user}
          type={contextMenuType}
          cb={toggleContextMenu}
        />
      )}
    </>
  );
};

export { UserElement };
