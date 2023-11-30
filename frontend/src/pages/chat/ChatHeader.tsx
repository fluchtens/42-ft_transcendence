import { IoSettings } from "react-icons/io5";
import { HiUsers } from "react-icons/hi2";
import styles from "./ChatHeader.module.scss";
import { useState } from "react";
import { EditChannel } from "./EditChannel";

interface ChatHeaderProps {
  title: string;
  toggleMembersMenu: () => void;
}

const ChatHeader = ({ title, toggleMembersMenu }: ChatHeaderProps) => {
  const [modal, setModal] = useState<boolean>(false);
  const [editChannel, setEditChannel] = useState({
    name: "",
    isPublic: true,
    password: "",
  });

  const openEditMenuModal = () => {
    setModal(true);
  };

  const closeModal = () => {
    setModal(false);
  };

  return (
    <>
      <div className={styles.header}>
        <button onClick={openEditMenuModal}>
          <IoSettings className={styles.icon} />
        </button>
        <h1>{title}</h1>
        <button onClick={toggleMembersMenu}>
          <HiUsers className={styles.icon} />
        </button>
      </div>
      {modal && (
        <EditChannel
          editChannel={editChannel}
          setEditChannel={setEditChannel}
          closeModal={closeModal}
        />
      )}
    </>
  );
};

export { ChatHeader };
