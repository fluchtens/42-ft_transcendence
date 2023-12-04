import { useState } from "react";
import { Modal } from "../../components/Modal";
import styles from "./UnbanUser.module.scss";
import { notifySuccess } from "../../utils/notifications";
import { Channel } from "../../types/chat.interface";

interface UnbanUserProps {
  channel: Channel;
  closeModal: () => void;
}

const UnbanUser = ({ channel, closeModal }: UnbanUserProps) => {
  const [unbanUser, setUnbanUser] = useState<string>("");

  const changeUnbanUser = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUnbanUser(e.target.value);
  };

  const submitData = (e: React.FormEvent) => {
    e.preventDefault();
    notifySuccess("Unban");
    closeModal();
    setUnbanUser("");
  };

  return (
    <Modal>
      <form className={styles.form} onSubmit={submitData}>
        <h1>Unban a user of {channel.name}</h1>
        <div className={styles.input}>
          <label>Username</label>
          <input
            type="text"
            value={unbanUser}
            onChange={changeUnbanUser}
            placeholder="Username"
            required
          />
        </div>
        <div className={styles.buttons}>
          <button type="button" onClick={() => closeModal()}>
            Cancel
          </button>
          <button type="submit">Unban</button>
        </div>
      </form>
    </Modal>
  );
};

export { UnbanUser };
