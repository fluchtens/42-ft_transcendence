import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useChatSocket } from "@/hooks/useChatSocket";
import { acceptFriendRequestApi, blockUserApi, declineFriendRequestApi } from "@/services/friendship.api";
import { User } from "@/types/user.interface";
import { notifyError, notifySuccess } from "@/utils/notifications";
import { useNavigate } from "react-router-dom";

interface UserReqElementProps {
  user: User;
  setSheetOpen: (value: boolean) => void;
}

export const UserReqElement = ({ user, setSheetOpen }: UserReqElementProps) => {
  const navigate = useNavigate();
  const chatSocket = useChatSocket();

  const viewUserProfile = () => {
    navigate(`/user/${user.username}`);
    setSheetOpen(false);
  };

  const sendPrivateMessage = async () => {
    chatSocket.emit("privateMessage", user.id, (channelId: string) => {
      if (channelId) {
        navigate("/pm/" + channelId);
        notifySuccess("You has joined the private chat");
      }
    });
    setSheetOpen(false);
  };

  const blockUser = async () => {
    const { success, message } = await blockUserApi(user.id);
    success ? notifySuccess(message) : notifyError(message);
  };

  const acceptFriendRequest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const { success, message } = await acceptFriendRequestApi(user.id);
    success ? notifySuccess(message) : notifyError(message);
  };

  const declineFriendRequest = async (e: React.MouseEvent) => {
    e.stopPropagation();
    const { success, message } = await declineFriendRequestApi(user.id);
    success ? notifySuccess(message) : notifyError(message);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="mb-1 p-2 w-full flex items-center gap-3 rounded-md bg-card">
          <Avatar className="w-10 h-10 rounded-full">
            <AvatarFallback className="bg-secondary">{user.username[0].toUpperCase()}</AvatarFallback>
            {user.avatar && <AvatarImage src={user.avatar} className="object-cover pointer-events-none" />}
          </Avatar>
          <p className="text-sm">{user.username}</p>
        </button>
        {/* {contextMenu && <UserContextMenu user={user} type={ContextMenuType.REQUEST} cb={toggleContextMenu} />} */}
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={acceptFriendRequest}>Accept friend request</DropdownMenuItem>
        <DropdownMenuItem onClick={declineFriendRequest}>Decline friend request</DropdownMenuItem>
        <DropdownMenuItem onClick={viewUserProfile}>View user profile</DropdownMenuItem>
        <DropdownMenuItem onClick={sendPrivateMessage}>Send private message</DropdownMenuItem>
        <DropdownMenuItem onClick={blockUser}>Block all communication</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
