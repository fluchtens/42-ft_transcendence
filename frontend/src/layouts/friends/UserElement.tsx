import defaultAvatar from "/default_avatar.png";
import styles from "./UserElement.module.scss";
import { useState } from "react";
import { UserContextMenu } from "./UserContextMenu";

interface UserElementProps {
  username: string;
  avatar: string;
  contextMenu: boolean;
  toggleContextMenu: () => void;
}

const UserElement = ({
  username,
  avatar,
  contextMenu,
  toggleContextMenu,
}: UserElementProps) => {
  return (
    <div className={styles.friendContainer}>
      <button className={styles.friendBtn} onClick={toggleContextMenu}>
        {avatar ? <img src={avatar} /> : <img src={defaultAvatar} />}
        <div>
          <p className={styles.username}>{username}</p>
          <p className={styles.status}>Status</p>
        </div>
      </button>
      {contextMenu && (
        <UserContextMenu username={username} cb={toggleContextMenu} />
      )}
    </div>
  );
};

export { UserElement };
