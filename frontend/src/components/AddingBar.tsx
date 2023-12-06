import { IoPersonAddSharp } from "react-icons/io5";
import styles from "./AddingBar.module.scss";
import { FaPlus } from "react-icons/fa6";
import { CreateChannel } from "../pages/channels/actions/CreateChannel";
import { useState } from "react";

interface AddUserBarProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const AddUserBar = ({ value, onChange, onSubmit }: AddUserBarProps) => (
  <form className={styles.form} onSubmit={onSubmit}>
    <input type="text" value={value} onChange={onChange} required />
    <button type="submit">
      <IoPersonAddSharp className={styles.icon} />
    </button>
  </form>
);

const AddChannelBar = () => {
  const [modal, setModal] = useState<boolean>(false);
  const [newChannel, setNewChannel] = useState({
    name: "",
    isPublic: true,
    password: "",
  });

  const openModal = (e: React.FormEvent) => {
    e.preventDefault();
    setModal(true);
  };

  const closeModal = () => {
    setModal(false);
  };

  const changeName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewChannel((prevEditChannel) => ({
      ...prevEditChannel,
      name: e.target.value,
    }));
  };

  return (
    <>
      <form className={styles.form} onSubmit={openModal}>
        <input
          type="text"
          value={newChannel.name}
          onChange={changeName}
          required
        />
        <button type="submit">
          <FaPlus className={styles.icon} />
        </button>
      </form>
      {modal && (
        <CreateChannel
          newChannel={newChannel}
          setNewChannel={setNewChannel}
          closeModal={closeModal}
        />
      )}
    </>
  );
};

export { AddUserBar, AddChannelBar };
