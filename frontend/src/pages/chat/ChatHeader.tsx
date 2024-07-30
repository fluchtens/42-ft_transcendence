import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import { FaBan } from "react-icons/fa";
import { FaDoorOpen } from "react-icons/fa6";
import { HiUsers } from "react-icons/hi2";
import { IoGameController, IoSettings } from "react-icons/io5";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useChatSocket } from "../../hooks/useChatSocket";
import { Channel, MemberUsers } from "../../types/chat.interface";
import { notifyError, notifySuccess } from "../../utils/notifications";
import { EditChannelDialog } from "./actions/EditChannelDialog";
import { UnbanUserDialog } from "./actions/UnbanUserDialog";
import { ChatMembers } from "./ChatMembers";

interface ChatHeaderProps {
  channel: Channel;
  members: MemberUsers[];
  toggleMembersMenu: () => void;
}

export const ChatHeader = ({ members, channel, toggleMembersMenu }: ChatHeaderProps) => {
  const { user } = useAuth();
  const [role, setRole] = useState<string>("");
  const [editChannelDialog, setEditChannelDialog] = useState<boolean>(false);
  const [unbanUserDialog, setUnbanUserDialog] = useState<boolean>(false);
  const navigate = useNavigate();
  const chatSocket = useChatSocket();
  const [editChannel, setEditChannel] = useState({
    name: "",
    isPublic: true,
    protected: false,
    password: "",
  });

  const leaveChannel = () => {
    chatSocket.emit("leaveChannel", channel.id, (result: string) => {
      if (result === "The owner cannot leave the channel") {
        notifyError("The owner cannot leave the channel");
      } else if (result) {
        notifyError("Fail to leave the channel");
      }
      if (!result) {
        notifySuccess("You left the channel successfully");
        navigate("/");
      }
    });
  };

  const createGameInvitation = async () => {
    chatSocket.emit("createGame", channel.id, (result: string) => {
      if (!result) notifySuccess("Game invitation has been sent successfully");
      else if (result === "New game request done") {
        notifySuccess(result);
      } else notifyError(result);
    });
  };

  useEffect(() => {
    setEditChannel({
      name: channel.name,
      isPublic: channel.public,
      protected: channel.protected,
      password: "",
    });
  }, [channel]);

  useEffect(() => {
    if (user) {
      members.map((member: MemberUsers) => {
        if (user.id === member.member.userId) {
          setRole(member.member.role);
          return;
        }
      });
    }
  }, [members]);

  const renderButtons = () => {
    switch (role) {
      case "OWNER":
        return (
          <>
            <Button onClick={() => setEditChannelDialog(true)} size="icon" variant="outline" className="bg-secondary hover:bg-secondary">
              <IoSettings className="w-[1rem] h-[1rem]" />
            </Button>
            <Button onClick={() => setUnbanUserDialog(true)} size="icon" variant="outline" className="bg-secondary hover:bg-secondary">
              <FaBan className="w-[1rem] h-[1rem]" />
            </Button>
          </>
        );
      case "ADMIN":
        return (
          <Button onClick={() => setUnbanUserDialog(true)} size="icon" variant="outline" className="bg-secondary hover:bg-secondary">
            <FaBan className="w-[1rem] h-[1rem]" />
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className="flex justify-between items-center gap-4">
        <div className="flex items-center gap-1">
          {renderButtons()}
          <Button onClick={leaveChannel} size="icon" variant="outline" className="bg-secondary hover:bg-secondary">
            <FaDoorOpen className="w-[1rem] h-[1rem]" />
          </Button>
        </div>
        <h1 className="text-xl font-semibold text-center text-ellipsis overflow-hidden whitespace-nowrap">{channel.name}</h1>
        <div className="flex items-center gap-1">
          <Button onClick={createGameInvitation} size="icon" variant="ghost" className="bg-secondary hover:bg-secondary">
            <IoGameController className="w-[1rem] h-[1rem]" />
          </Button>
          <Button onClick={toggleMembersMenu} size="icon" variant="outline" className="bg-secondary hover:bg-secondary">
            <HiUsers className="w-[1rem] h-[1rem]" />
          </Button>
          <ChatMembers />
        </div>
      </div>
      <EditChannelDialog
        editChannel={editChannel}
        setEditChannel={setEditChannel}
        channel={channel}
        dialog={editChannelDialog}
        setDialog={setEditChannelDialog}
      />
      <UnbanUserDialog channel={channel} dialog={unbanUserDialog} setDialog={setUnbanUserDialog} />
      <Separator className="bg-secondary" />
    </>
  );
};
