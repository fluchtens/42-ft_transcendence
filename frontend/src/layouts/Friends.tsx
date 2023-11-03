import defaultAvatar from "/default_avatar.png";
import styles from "./Friends.module.scss";
import { useEffect, useState } from "react";
import { getUser, getUserAvatar } from "../services/user.api";
import { User } from "../types/user.interface";
import { getUserFriends } from "../services/friendship.api";

interface UserElementProps {
  username: string;
  avatar: string;
}

const UserElement = ({ username, avatar }: UserElementProps) => (
  <li>
    {avatar ? <img src={avatar} /> : <img src={defaultAvatar} />}
    <div>
      <p className={styles.username}>{username}</p>
      <p className={styles.status}>In game</p>
    </div>
  </li>
);

function Friends() {
  const [user, setUser] = useState<User | null>(null);
  const [friends, setFriends] = useState<User[] | null>(null);

  useEffect(() => {
    const getUserData = async () => {
      const userData = await getUser();
      if (!userData) {
        return;
      }
      setUser(userData);

      const friendsData = await getUserFriends(userData.id);
      if (!friendsData) {
        return;
      }
      friendsData.map((user) => (user.avatarUrl = getUserAvatar(user.avatar)));
      setFriends(friendsData);
    };

    getUserData();
  }, []);

  return (
    <>
      {user && (
        <div className={styles.container}>
          <ul>
            {friends?.map((user, index) => (
              <UserElement
                key={index}
                username={user.username}
                avatar={user.avatarUrl}
              />
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

export default Friends;
