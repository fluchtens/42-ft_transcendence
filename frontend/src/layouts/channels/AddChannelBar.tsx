import { FaPlus } from "react-icons/fa6";
import styles from "./AddChannelBar.module.scss";
import { Dispatch, SetStateAction, useState } from "react";
import { CreateChannel } from "./CreateChannel";

interface AddChannelBarProps {
  name: string;
  changeName: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isPublic: boolean;
  setIsPublic: Dispatch<SetStateAction<boolean>>;
  password: string;
  setPassword: Dispatch<SetStateAction<string>>;
  createChannel: () => void;
}

const AddChannelBar = ({
  name,
  changeName,
  isPublic,
  setIsPublic,
  password,
  setPassword,
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
          isPublic={isPublic}
          setIsPublic={setIsPublic}
          password={password}
          setPassword={setPassword}
          createChannel={createChannel}
          closeModal={closeModal}
        />
      )}
    </>
  );
};

export { AddChannelBar };
