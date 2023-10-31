import defaultAvatar from "/default_avatar.png";
import styles from "./Friends.module.scss";
import { useEffect, useState } from "react";
import { getAllUsers, getUserAvatar } from "../services/user.api";
import { User } from "../types/user.interface";

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
  const [users, setUsers] = useState<User[] | null>(null);

  useEffect(() => {
    const getUsersData = async () => {
      const data = await getAllUsers();
      if (data) {
        data.map((data) => (data.avatarUrl = getUserAvatar(data.avatar)));
        setUsers(data);
        console.log(data);
      }
    };
    getUsersData();
  }, []);

  return (
    <div className={styles.container}>
      <ul>
        {users?.map((user, index) => (
          <UserElement
            key={index}
            username={user.username}
            avatar={user.avatarUrl}
          />
        ))}
      </ul>
    </div>
  );
}

export default Friends;
