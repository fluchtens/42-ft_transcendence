import { useEffect, useState } from "react";
import { User } from "../../types/user.interface";
import { Friendship } from "../../types/friendship.interface";
import { getUserByIdApi, getUserByUsernameApi } from "../../services/user.api";
import {
  getFriendRequestsApi,
  getFriendsApi,
  sendFriendRequestApi,
} from "../../services/friendship.api";
import { AddFriendBar } from "./AddFriendBar";
import { UserElement } from "./UserElement";
import { notifyError, notifySuccess } from "../../utils/notifications";
import styles from "./Friends.module.scss";
import { io } from "socket.io-client";
import { UserReqElement } from "./UserReqElement";
import { useAuth } from "../../utils/useAuth";

const socket = io(`${import.meta.env.VITE_BACK_URL}/friendship`, {
  withCredentials: true,
});

function Friends() {
  const { user } = useAuth();
  const [friends, setFriends] = useState<User[] | null>(null);
  const [usersReq, setUsersReq] = useState<User[] | null>(null);
  const [addUser, setAddUser] = useState<string>("");
  const [contextMenu, setContextMenu] = useState<number | null>(null);

  const changeAddUser = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddUser(e.target.value);
  };

  const toggleContextMenu = (userId: number) => {
    setContextMenu(contextMenu === userId ? null : userId);
  };

  const sendRequest = async (e: React.FormEvent) => {
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
    if (!user) return;

    // const friends = await getAllUsersApi();
    const friends = await getFriendsApi(user.id);
    if (!friends || !friends.length) {
      setFriends(null);
    } else {
      setFriends(friends);
    }

    const requests = await getFriendRequestsApi();
    if (requests && requests.length) {
      const usersReq = await Promise.all(
        requests.map(async (request: Friendship) => {
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
    if (!user) return;
    getData();
    socket.on("reloadList", getData);

    return () => {
      socket.off("reloadList", getData);
    };
  }, [user]);

  return (
    <>
      {user && (
        <div className={styles.container}>
          <AddFriendBar
            value={addUser}
            onChange={changeAddUser}
            onSubmit={sendRequest}
          />
          <ul>
            {usersReq?.map((user) => (
              <li key={user.id}>
                <UserReqElement
                  user={user}
                  contextMenu={contextMenu === user.id}
                  toggleContextMenu={() => toggleContextMenu(user.id)}
                />
              </li>
            ))}
            {friends?.map((user) => (
              <li key={user.id}>
                <UserElement
                  user={user}
                  contextMenu={contextMenu === user.id}
                  toggleContextMenu={() => toggleContextMenu(user.id)}
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
