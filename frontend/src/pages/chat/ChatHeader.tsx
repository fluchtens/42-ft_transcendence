import { IoGameController, IoSettings } from "react-icons/io5";
import { HiUsers } from "react-icons/hi2";
import styles from "./ChatHeader.module.scss";
import { useEffect, useState } from "react";
import { EditChannel } from "./actions/EditChannel";
import { Channel, MemberUsers, Message } from "../../types/chat.interface";
import { FaDoorOpen } from "react-icons/fa6";
import { notifyError, notifySuccess } from "../../utils/notifications";
import { useChatSocket } from "../../hooks/useChatSocket";
import { useNavigate } from "react-router-dom";
import { UnbanUser } from "./actions/UnbanUser";
import { FaBan } from "react-icons/fa";
import { useAuth } from "../../hooks/useAuth";
import { getUserByIdApi } from "../../services/user.api";

interface ChatHeaderProps {
  channel: Channel;
  members: MemberUsers[];
  addNewMessage: (message: Message) => void;
  toggleMembersMenu: () => void;
}

const ChatHeader = ({
  members,
  channel,
  addNewMessage,
  toggleMembersMenu,
}: ChatHeaderProps) => {
  const { user } = useAuth();
  const [role, setRole] = useState<string>("");
  const [editChannelModal, setEditChannelModal] = useState<boolean>(false);
  const [unbanUserModal, setUnbanUserModal] = useState<boolean>(false);
  const navigate = useNavigate();
  const chatSocket = useChatSocket();
  const [editChannel, setEditChannel] = useState({
    name: "",
    isPublic: true,
    protected: false,
    password: "",
  });

  const openEditMenuModal = () => {
    setEditChannelModal(true);
  };

  const closeEditMenuModal = () => {
    setEditChannelModal(false);
  };

  const openUnbanUserModal = () => {
    setUnbanUserModal(true);
  };

  const closeUnbanUserModal = () => {
    setUnbanUserModal(false);
  };

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
    // const user = await getUserByIdApi(1);
    // if (!user) return;

    // const newMessage = {
    //   id: "qwertyuiop",
    //   content: "Can you beat me?",
    //   gameInvit: true,
    //   userId: user.id,
    //   user: user,
    // };
    // addNewMessage(newMessage);
    chatSocket.emit('createGame', channel.id, (result: string) => {
      if (!result)
        notifySuccess("Game invitation has been sent successfully");
      else if (result === "New game request done") {
        notifySuccess(result);
      }
      else 
        notifyError(result);
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
            <button onClick={openEditMenuModal}>
              <IoSettings className={styles.icon} />
            </button>
            <button onClick={openUnbanUserModal}>
              <FaBan className={styles.icon} />
            </button>
          </>
        );
      case "ADMIN":
        return (
          <button onClick={openUnbanUserModal}>
            <FaBan className={styles.icon} />
          </button>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <div className={styles.header}>
        <div className={styles.leftBtns}>
          {renderButtons()}
          <button onClick={leaveChannel}>
            <FaDoorOpen className={styles.icon} />
          </button>
        </div>
        <h1>{channel.name}</h1>
        <div className={styles.rightBtns}>
          <button onClick={createGameInvitation}>
            <IoGameController className={styles.icon} />
          </button>
          <button onClick={toggleMembersMenu}>
            <HiUsers className={styles.icon} />
          </button>
        </div>
      </div>
      {editChannelModal && (
        <EditChannel
          editChannel={editChannel}
          setEditChannel={setEditChannel}
          closeModal={closeEditMenuModal}
          channel={channel}
        />
      )}
      {unbanUserModal && (
        <UnbanUser channel={channel} closeModal={closeUnbanUserModal} />
      )}
    </>
  );
};

export { ChatHeader };
