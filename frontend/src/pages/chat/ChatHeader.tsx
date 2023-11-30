import { IoSettings } from "react-icons/io5";
import { HiUsers } from "react-icons/hi2";
import styles from "./ChatHeader.module.scss";
import { useEffect, useState } from "react";
import { EditChannel } from "./EditChannel";
import { Channel } from "../../types/chat.interface";

interface ChatHeaderProps {
  channel: Channel;
  toggleMembersMenu: () => void;
}

const ChatHeader = ({ channel, toggleMembersMenu }: ChatHeaderProps) => {
  const [modal, setModal] = useState<boolean>(false);
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
        <button onClick={openEditMenuModal}>
          <IoSettings className={styles.icon} />
        </button>
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
