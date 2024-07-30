import { AddUserBar } from "@/components/layouts/friends/AddUserBar";
import { UserElement } from "@/components/layouts/friends/UserElement";
import { UserReqElement } from "@/components/layouts/friends/UserReqElement";
import { Button } from "@/components/ui/button";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useFriendshipSocket } from "@/hooks/useFriendshipSocket";
import { getFriendRequestsApi, getFriendsApi, sendFriendRequestApi } from "@/services/friendship.api";
import { getUserByIdApi, getUserByUsernameApi } from "@/services/user.api";
import { Friendship } from "@/types/friendship.interface";
import { User } from "@/types/user.interface";
import { notifyError, notifySuccess } from "@/utils/notifications";
import { useEffect, useState } from "react";
import { FaUserGroup } from "react-icons/fa6";
import { Link } from "react-router-dom";

export const ChatMembers = () => {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [friends, setFriends] = useState<User[] | null>(null);
  const [usersReq, setUsersReq] = useState<User[] | null>(null);
  const [addUser, setAddUser] = useState<string>("");
  const { user } = useAuth();
  const socket = useFriendshipSocket();

  const changeAddUser = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddUser(e.target.value);
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
    if (user === null) return;
    getData();
    socket.on("reloadList", getData);

    return () => {
      socket.off("reloadList", getData);
    };
  }, [user]);

  return (
    <>
      {user && (
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <FaUserGroup className="h-[1.1rem] w-[1.1rem]" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetClose asChild>
              <Link to="/" className="text-xl font-semibold text-left">
                <DialogTitle>ft_transcendence</DialogTitle>
                <DialogDescription className="text-sm font-light text-muted-foreground">Multiplayer pong game</DialogDescription>
              </Link>
            </SheetClose>
            <div className="mt-2 max-h-[61rem] flex flex-col">
              <AddUserBar value={addUser} onChange={changeAddUser} onSubmit={sendRequest} />
              <ul className="mt-2 overflow-y-scroll flex flex-col">
                {usersReq?.map((user) => (
                  <li key={user.id}>
                    <UserReqElement user={user} setSheetOpen={setSheetOpen} />
                  </li>
                ))}
                {friends?.map((user, index) => (
                  <li key={user.id}>
                    <UserElement user={user} setSheetOpen={setSheetOpen} />
                    <Separator className={`${index !== friends.length - 1 ? "my-1" : "hidden"}`} />
                  </li>
                ))}
              </ul>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
};
