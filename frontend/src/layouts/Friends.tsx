import defaultAvatar from "/default_avatar.png";
import styles from "./Friends.module.scss";
import { useEffect, useState } from "react";
import {
  getUserApi,
  getUserAvatar,
  getUserByUsernameApi,
} from "../services/user.api";
import { User } from "../types/user.interface";
import {
  getFriendsApi,
  sendFriendRequestApi,
} from "../services/friendship.api";
import { notifyError, notifySuccess } from "../utils/notifications";
import { AddFriendBar } from "../components/AddFriendBar";

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
  const [addUser, setAddUser] = useState<string>("");

  const changeAddUser = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddUser(e.target.value);
  };

  const sendFriendRequest = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!addUser) {
      return;
    }

    const userData = await getUserByUsernameApi(addUser);
    if (!userData) {
      notifyError("User not found");
      setAddUser("");
      return;
    }

    const { success, message } = await sendFriendRequestApi(userData.id);
    if (!success) {
      notifyError(message);
    } else {
      notifySuccess(message);
    }
    setAddUser("");
  };

  useEffect(() => {
    const getData = async () => {
      const user = await getUserApi();
      if (!user) return;

      const friends = await getFriendsApi(user.id);
      if (!friends) return;
      friends.map(
        (friend) => (friend.avatarUrl = getUserAvatar(friend.avatar))
      );

      setUser(user);
      setFriends(friends);
    };

    getData();
  }, []);

  return (
    <>
      {user && (
        <div className={styles.container}>
          <AddFriendBar
            value={addUser}
            onChange={changeAddUser}
            onSubmit={sendFriendRequest}
          />
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
