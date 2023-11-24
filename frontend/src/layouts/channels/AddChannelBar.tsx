import { FaPlus } from "react-icons/fa6";
import styles from "./AddChannelBar.module.scss";
import { useState } from "react";
import { CreateChannel } from "./CreateChannel";

interface AddChannelBarProps {
  name: string;
  changeName: (e: React.ChangeEvent<HTMLInputElement>) => void;
  createChannel: () => void;
}

const AddChannelBar = ({
  name,
  changeName,
  createChannel,
}: AddChannelBarProps) => {
  const [modal, setModal] = useState<boolean>(false);

  const openModal = (e: React.FormEvent) => {
    e.preventDefault();
    setModal(true);
  };

  const closeModal = () => {
    setModal(false);
  };

  return (
    <>
      <form className={styles.addFriend} onSubmit={openModal}>
        <input type="text" value={name} onChange={changeName} required />
        <button type="submit">
          <FaPlus className={styles.icon} />
        </button>
      </form>
      {modal && (
        <CreateChannel
          name={name}
          changeName={changeName}
          createChannel={createChannel}
          closeModal={closeModal}
        />
      )}
    </>
  );
};

export { AddChannelBar };
