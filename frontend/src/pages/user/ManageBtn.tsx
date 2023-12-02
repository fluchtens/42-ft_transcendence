import { useEffect, useRef, useState } from "react";
import styles from "./ManageBtn.module.scss";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { User } from "../../types/user.interface";
import {
  blockUserApi,
  getFriendsApi,
  removeFriendApi,
  sendFriendRequestApi,
} from "../../services/friendship.api";
import { notifyError, notifySuccess } from "../../utils/notifications";
import { ImBlocked } from "react-icons/im";
import { FaUser } from "react-icons/fa6";
interface ManageBtnProps {
  targetUser: User;
}

const ManageBtn = ({ targetUser }: ManageBtnProps) => {
  const { user, refreshUser } = useAuth();
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [isMe, setIsMe] = useState<boolean>(false);
  const [isFriend, setIsFriend] = useState<boolean>(false);
  const navigate = useNavigate();

  const handleMenu = () => {
    setMenu(!menu);
  };

  const editProfile = () => {
    navigate("/settings");
  };

  const sendPrivateMessage = () => {
    navigate("/chat/1");
  };

  const sendFriendRequest = async () => {
    const { success, message } = await sendFriendRequestApi(targetUser.id);
    success ? notifySuccess(message) : notifyError(message);
  };

  const blockUser = async () => {
    handleMenu();
    const { success, message } = await blockUserApi(targetUser.id);
    if (!success) {
      notifyError(message);
      return;
    }
    notifySuccess(message);
    await refreshUser();
  };

  const removeFriend = async () => {
    handleMenu();
    const { success, message } = await removeFriendApi(targetUser.id);
    if (!success) {
      notifyError(message);
      return;
    }
    notifySuccess(message);
    await refreshUser();
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current) {
        if (!menuRef.current.contains(e.target as Node)) {
          setMenu(false);
        }
      }
    };
    document.addEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (user) {
        if (user.id === targetUser.id) {
          setIsMe(true);
          return;
        }

        const friends = await getFriendsApi(user.id);
        if (friends) {
          friends.map((friend) => {
            if (friend.id === targetUser.id) {
              setIsFriend(true);
              return;
            }
          });
        }
      }
    };

    setIsMe(false);
    setIsFriend(false);
    fetchData();
  }, [user, targetUser]);

  return (
    <div className={styles.container} ref={menuRef}>
      {isMe && <button onClick={editProfile}>Edit Profile</button>}
      {isFriend && <button onClick={sendPrivateMessage}>Message</button>}
      {!isMe && !isFriend && (
        <button onClick={sendFriendRequest}>Add Friend</button>
      )}
      {!isMe && <button onClick={handleMenu}>...</button>}
      {menu && (
        <div className={styles.menu}>
          <button onClick={blockUser}>
            <ImBlocked className={styles.icon}></ImBlocked>
            <p>Block all communication</p>
          </button>
          {isFriend && (
            <button onClick={removeFriend}>
              <FaUser></FaUser>
              <p>Remove friend</p>
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export { ManageBtn };
