import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useChatSocket } from "../../hooks/useChatSocket";
import { blockUserApi, getFriendsApi, removeFriendApi, sendFriendRequestApi } from "../../services/friendship.api";
import { User } from "../../types/user.interface";
import { notifyError, notifySuccess } from "../../utils/notifications";

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
  const chatSocket = useChatSocket();

  const handleMenu = () => {
    setMenu(!menu);
  };

  const editProfile = () => {
    navigate("/settings");
  };

  const sendPrivateMessage = async () => {
    chatSocket.emit("privateMessage", targetUser.id, (channelId: string) => {
      if (channelId) {
        navigate("/pm/" + channelId);
        notifySuccess("You has joined the private chat");
      }
    });
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
    <div className="flex items-center gap-2">
      {isMe && <Button onClick={editProfile}>Edit Profile</Button>}
      {isFriend && <Button onClick={sendPrivateMessage}>Message</Button>}
      {!isMe && !isFriend && <Button onClick={sendFriendRequest}>Add Friend</Button>}
      {!isMe && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="secondary" size="icon" onClick={handleMenu}>
              ...
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={blockUser}>Block all communication</DropdownMenuItem>
            {isFriend && <DropdownMenuItem onClick={removeFriend}>Remove friend</DropdownMenuItem>}
          </DropdownMenuContent>
        </DropdownMenu>
      )}
    </div>
  );
};

export { ManageBtn };
