import { FaPlus } from "react-icons/fa6";
import styles from "./AddChannelBar.module.scss";
import { useState } from "react";
import { CreateChannel } from "./CreateChannel";

interface AddChannelBarProps {
  value: string;
}

const AddChannelBar = ({ value }: AddChannelBarProps) => {
  const [modal, setModal] = useState<boolean>(false);

  const submitData = (e: React.FormEvent) => {
    e.preventDefault();

    setModal(true);
  };

  return (
    <>
      <form className={styles.addFriend} onSubmit={submitData}>
        <input type="text" value={value} required />
        <button type="submit">
          <FaPlus className={styles.icon} />
        </button>
      </form>
      {modal && <CreateChannel name={value} />}
    </>
  );
};

export { AddChannelBar };
