import { useEffect, useState } from "react";
import { User } from "../../types/user.interface";
import { Friendship } from "../../types/friendship.interface";
import {
  getUserApi,
  getUserByIdApi,
  getUserByUsernameApi,
} from "../../services/user.api";
import {
  getFriendRequestsApi,
  getFriendsApi,
  sendFriendRequestApi,
} from "../../services/friendship.api";
import { AddFriendBar } from "./AddFriendBar";
import { UserElement } from "./UserElement";
import { notifyError, notifySuccess } from "../../utils/notifications";
import styles from "./Friends.module.scss";

function Friends() {
  const [user, setUser] = useState<User | null>(null);
  const [friends, setFriends] = useState<User[] | null>(null);
  const [usersReq, setUsersReq] = useState<User[] | null>(null);
  const [addUser, setAddUser] = useState<string>("");

  const changeAddUser = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddUser(e.target.value);
  };

  const sendFriendRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!addUser) return;

    const userData = await getUserByUsernameApi(addUser);
    if (!userData) {
      notifyError("User not found");
      setAddUser("");
      return;
    }

    const { success, message } = await sendFriendRequestApi(userData.id);
    success ? notifySuccess(message) : notifyError(message);
    setAddUser("");
  };

  const getData = async () => {
    const user = await getUserApi();
    if (!user) return;
    setUser(user);

    const friends = await getFriendsApi(user.id);
    if (!friends || !friends.length) return;
    setFriends(friends);

    const friendReq = await getFriendRequestsApi();
    if (friendReq && friendReq.length) {
      const usersReq = await Promise.all(
        friendReq.map(async (request: Friendship) => {
          const user = await getUserByIdApi(request.senderId);
          if (user) {
            user.friendship = request;
            return user;
          }
        })
      );
      setUsersReq(usersReq as User[]);
    } else {
      setUsersReq(null);
    }
  };

  useEffect(() => {
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
                <UserElement
                  friend={false}
                  id={user.id}
                  username={user.username}
                  avatar={user.avatar}
                  cb={getData}
                />
              </li>
            ))}
            {friends?.map((user) => (
              <li key={user.id}>
                <UserElement
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
