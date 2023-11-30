import { FaPlus } from "react-icons/fa6";
import styles from "./AddChannelBar.module.scss";
import { useState } from "react";
import { CreateChannel } from "./CreateChannel";

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
      <form className={styles.addFriend} onSubmit={openModal}>
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

export { AddChannelBar };
