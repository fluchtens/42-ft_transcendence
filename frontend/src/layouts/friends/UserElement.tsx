import defaultAvatar from "/default_avatar.png";
import styles from "./UserElement.module.scss";
import { UserContextMenu } from "./UserContextMenu";
import { User } from "../../types/user.interface";

interface UserElementProps {
  user: User;
  contextMenu: boolean;
  toggleContextMenu: () => void;
}

const UserElement = ({
  user,
  contextMenu,
  toggleContextMenu,
}: UserElementProps) => (
  <div className={styles.friendContainer}>
    <button
      className={`${styles.friendBtn} ${contextMenu ? styles.activeBtn : ""}`}
      onClick={toggleContextMenu}
    >
      {user.avatar ? <img src={user.avatar} /> : <img src={defaultAvatar} />}
      <div>
        <p className={styles.username}>{user.username}</p>
        <p className={styles.status}>Status</p>
      </div>
    </button>
    {contextMenu && <UserContextMenu user={user} cb={toggleContextMenu} />}
  </div>
);

export { UserElement };
