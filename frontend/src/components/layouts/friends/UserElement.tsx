import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useChatSocket } from "@/hooks/useChatSocket";
import { blockUserApi, removeFriendApi } from "@/services/friendship.api";
import { Channel } from "@/types/chat.interface";
import { User } from "@/types/user.interface";
import { notifyError, notifySuccess } from "@/utils/notifications";
import { useNavigate } from "react-router-dom";

interface UserElementProps {
  user: User;
  userRole?: string;
  channel?: Channel;
  setSheetOpen: (value: boolean) => void;
}

export const UserElement = ({ user, setSheetOpen }: UserElementProps) => {
  const navigate = useNavigate();
  const chatSocket = useChatSocket();
  const isInGame = user.status === "In game";
  const isOnline = user.status === "Online";
  const isOffline = user.status === "Offline";

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

  const removeFriend = async () => {
    const { success, message } = await removeFriendApi(user.id);
    success ? notifySuccess(message) : notifyError(message);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-2 w-full flex items-center gap-3 rounded-md hover:bg-card">
            <Avatar className="w-10 h-10 rounded-full">
              <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
              {user.avatar && <AvatarImage src={user.avatar} className="object-cover pointer-events-none" />}
            </Avatar>
            {isInGame && (
              <div className="text-left">
                <p className="text-sm text-[#e2fdc2]">{user.username}</p>
                <p className="text-xs text-[#a3cf03]">{user.status}</p>
              </div>
            )}
            {isOnline && (
              <div className="text-left">
                <p className="text-sm text-[#57cbde]">{user.username}</p>
                <p className="text-xs text-[#57cbde]">{user.status}</p>
              </div>
            )}
            {isOffline && (
              <div className="text-left">
                <p className="text-sm">{user.username}</p>
                <p className="text-xs text-muted-foreground">{user.status}</p>
              </div>
            )}
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={viewUserProfile}>View user profile</DropdownMenuItem>
          <DropdownMenuItem onClick={sendPrivateMessage}>Send private message</DropdownMenuItem>
          <DropdownMenuItem onClick={blockUser}>Block all communication</DropdownMenuItem>
          <DropdownMenuItem onClick={removeFriend}>Remove friend</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </>
  );
};
