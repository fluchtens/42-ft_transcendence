import { IoSettings } from "react-icons/io5";
import { HiUsers } from "react-icons/hi2";
import styles from "./ChatHeader.module.scss";
import { useEffect, useState } from "react";
import { EditChannel } from "./EditChannel";
import { Channel } from "../../types/chat.interface";
import { FaDoorOpen } from "react-icons/fa6";
import { notifyError, notifySuccess } from "../../utils/notifications";
import { useChatSocket } from "../../hooks/useChatSocket";
import { useNavigate } from "react-router-dom";

interface ChatHeaderProps {
  channel: Channel;
  toggleMembersMenu: () => void;
}


const ChatHeader = ({ channel, toggleMembersMenu }: ChatHeaderProps) => {
  const [modal, setModal] = useState<boolean>(false);
  const navigate = useNavigate();
  const chatSocket = useChatSocket();
  const [editChannel, setEditChannel] = useState({
    name: "",
    isPublic: true,
    protected: false,
    password: "",
  });
  
  const openEditMenuModal = () => {
    setModal(true);
  };
  
  const closeModal = () => {
    setModal(false);
  };
  
  const leaveChannel = () => {
    
    chatSocket.emit("leaveChannel", channel.id, (result:string) => {
        if (result === "The owner cannot leave the channel") {
            notifyError("The owner cannot leave the channel");
          }
        else if (result){
            notifyError("Fail to leave the channel");
          }
        if (!result) {
            notifySuccess("You left the channel successfully");
            navigate("/");
          }
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

  return (
    <>
      <div className={styles.header}>
        <div className={styles.leftBtns}>
          <button onClick={openEditMenuModal}>
            <IoSettings className={styles.icon} />
          </button>
          <button onClick={leaveChannel}>
            <FaDoorOpen className={styles.icon} />
          </button>
        </div>
        <h1>{channel.name}</h1>
        <button onClick={toggleMembersMenu}>
          <HiUsers className={styles.icon} />
        </button>
      </div>
      {modal && (
        <EditChannel
          editChannel={editChannel}
          setEditChannel={setEditChannel}
          closeModal={closeModal}
          channel={channel}
        />
      )}
    </>
  );
};

export { ChatHeader };
