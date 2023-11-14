import defaultAvatar from "/default_avatar.png";
import styles from "./UserReqElement.module.scss";
import { AiFillCheckCircle } from "react-icons/ai";
import { AiFillCloseCircle } from "react-icons/ai";
import { notifyError, notifySuccess } from "../../utils/notifications";
import {
  acceptFriendRequestApi,
  declineFriendRequestApi,
} from "../../services/friendship.api";
import { useState } from "react";
import { UserContextMenu } from "./UserContextMenu";

interface UserReqElementProps {
  id: number;
  username: string;
  avatar: string;
  contextMenu: boolean;
  toggleContextMenu: () => void;
}

const UserReqElement = ({
  id,
  username,
  avatar,
  contextMenu,
  toggleContextMenu,
}: UserReqElementProps) => {
  const acceptFriendRequest = async () => {
    const { success, message } = await acceptFriendRequestApi(id);
    success ? notifySuccess(message) : notifyError(message);
  };

  const declineFriendRequest = async () => {
    const { success, message } = await declineFriendRequestApi(id);
    success ? notifySuccess(message) : notifyError(message);
  };

  return (
    <div className={styles.requestContainer}>
      <button className={styles.requestBtn} onClick={toggleContextMenu}>
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
      </button>
      {contextMenu && (
        <UserContextMenu username={username} cb={toggleContextMenu} />
      )}
    </div>
  );
};

export { UserReqElement };
