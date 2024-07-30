import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useChatSocket } from "@/hooks/useChatSocket";
import { blockUserApi } from "@/services/friendship.api";
import { Channel } from "@/types/chat.interface";
import { User } from "@/types/user.interface";
import { notifyError, notifySuccess } from "@/utils/notifications";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MuteUserDialog } from "../actions/MuteUserDialog";

interface MemberElementProps {
  member: User;
  channel: Channel;
  role: string;
  userRole: string;
  setSheetOpen: (value: boolean) => void;
}

export const MemberElement = ({ member, userRole, channel, role, setSheetOpen }: MemberElementProps) => {
  const navigate = useNavigate();
  const chatSocket = useChatSocket();
  const [muteDialog, setMuteDialog] = useState<boolean>(false);

  const viewUserProfile = () => {
    navigate(`/user/${member.username}`);
    setSheetOpen(false);
  };

  const sendPrivateMessage = async () => {
    chatSocket.emit("privateMessage", member.id, (channelId: string) => {
      if (channelId) {
        navigate("/pm/" + channelId);
        notifySuccess("You has joined the private chat");
      }
    });
    setSheetOpen(false);
  };

  const blockUser = async () => {
    const { success, message } = await blockUserApi(member.id);
    success ? notifySuccess(message) : notifyError(message);
  };

  const renderRole = (role: string) => {
    switch (role) {
      case "OWNER":
        return "Owner";
      case "ADMIN":
        return "Administrator";
      case "GUEST":
        return "Member";
      default:
        return "Unknow";
    }
  };

  const promoteOwner = async () => {
    chatSocket.emit("changeRole", { channelId: channel.id, memberId: member.id, newRole: "OWNER" }, (result: string) => {
      if (!result) {
        notifySuccess("Successfully promoted to owner");
      } else {
        notifyError("Failed to promote to owner");
      }
    });
  };

  const promoteAdmin = async () => {
    chatSocket.emit("changeRole", { channelId: channel.id, memberId: member.id, newRole: "ADMIN" }, (result: string) => {
      if (!result) {
        notifySuccess("Successfully promoted to owner");
      } else {
        notifyError("Failed to promote to admin");
      }
    });
  };

  const demoteUser = async () => {
    chatSocket.emit("changeRole", { channelId: channel.id, memberId: member.id, newRole: "GUEST" }, (result: string) => {
      if (!result) {
        notifySuccess("Successfully demoted to member");
      } else {
        notifyError("Failed to demote member");
      }
    });
  };

  const kickUser = async () => {
    chatSocket.emit("kickUser", { channelId: channel.id, userIdKick: member.id }, (result: string) => {
      if (result) {
        notifyError("Failed to kick member");
      } else {
        notifySuccess("The member was successful kicked");
      }
    });
  };

  const banUser = async () => {
    chatSocket.emit("banUser", { channelId: channel.id, userIdToBan: member.id }, (result: string) => {
      if (result) {
        notifyError("Failed to ban member");
      } else {
        notifySuccess("The member was successful banned");
      }
    });
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="p-2 w-full flex items-center gap-3 rounded-md hover:bg-card">
            <Avatar className="w-10 h-10 rounded-full">
              <AvatarFallback>{member.username[0].toUpperCase()}</AvatarFallback>
              {member.avatar && <AvatarImage src={member.avatar} className="object-cover pointer-events-none" />}
            </Avatar>
            <div className="text-left">
              <p className="text-sm">{member.username}</p>
              {role && <p className="text-xs text-muted-foreground">{renderRole(role)}</p>}
            </div>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuLabel>{member.username}</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuGroup>
            <DropdownMenuItem onClick={viewUserProfile}>View member profile</DropdownMenuItem>
            <DropdownMenuItem onClick={sendPrivateMessage}>Send private message</DropdownMenuItem>
            <DropdownMenuItem onClick={blockUser}>Block all communication</DropdownMenuItem>
          </DropdownMenuGroup>
          {(userRole === "OWNER" || userRole === "ADMIN") && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={kickUser}>Kick member</DropdownMenuItem>
                <DropdownMenuItem onClick={banUser}>Ban member</DropdownMenuItem>
                <DropdownMenuItem onClick={() => setMuteDialog(true)}>Mute member</DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          )}
          {userRole === "OWNER" && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuItem onClick={promoteOwner}>Promote to owner rank</DropdownMenuItem>
                <DropdownMenuItem onClick={promoteAdmin}>Promote to admin rank</DropdownMenuItem>
                <DropdownMenuItem onClick={demoteUser}>Demote to member rank</DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      <MuteUserDialog memberId={member.id} member={member} channel={channel} dialog={muteDialog} setDialog={setMuteDialog} />
    </>
  );
};
