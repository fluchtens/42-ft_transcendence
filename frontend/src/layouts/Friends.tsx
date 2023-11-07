import styles from "./Friends.module.scss";
import { useEffect, useState } from "react";
import {
  getUserApi,
  getUserByIdApi,
  getUserByUsernameApi,
} from "../services/user.api";
import { User } from "../types/user.interface";
import {
  getFriendRequestsApi,
  getFriendsApi,
  sendFriendRequestApi,
} from "../services/friendship.api";
import { notifyError, notifySuccess } from "../utils/notifications";
import { AddFriendBar } from "../components/AddFriendBar";
import { UserBtn } from "../components/UserBtn";

function Friends() {
  const [user, setUser] = useState<User | null>(null);
  const [friends, setFriends] = useState<User[] | null>(null);
  const [friendReq, setFriendReq] = useState(null);
  const [usersReq, setUsersReq] = useState<User[] | null>(null);
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

      const friendRequests = await getFriendRequestsApi();
      if (!friendRequests) return;

      const usersReq = await Promise.all(
        friendRequests.map(async (request: any) => {
          const user = await getUserByIdApi(request.senderId);
          return user;
        })
      );

      setUser(user);
      setFriends(friends);
      setFriendReq(friendRequests);
      setUsersReq(usersReq);
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
            {usersReq?.map((user) => (
              <li key={user.id}>
                <UserBtn
                  friend={false}
                  username={user.username}
                  avatar={user.avatar}
                />
              </li>
            ))}
            {friends?.map((user) => (
              <li key={user.id}>
                <UserBtn
                  friend={true}
                  username={user.username}
                  avatar={user.avatar}
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

export default Friends;
