import { useState } from "react";
import { Modal } from "../../components/Modal";
import styles from "./MuteUser.module.scss";
import { notifySuccess } from "../../utils/notifications";
import { Channel } from "../../types/chat.interface";
import { User } from "../../types/user.interface";
import { useChatSocket } from "../../hooks/useChatSocket";

interface MuteUserProps {
  user: User;
  channel: Channel;
  closeModal: () => void;
  cb: () => void;
}

const MuteUser = ({ user, channel, closeModal, cb }: MuteUserProps) => {
  const [time, setTime] = useState<string>("");
  const socket = useChatSocket();

  const changeTime = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTime(e.target.value);
  };

  const submitData = (e: React.FormEvent) => {
    e.preventDefault();
    cb();
    notifySuccess("Mute");
    closeModal();
    setTime("");
  };

  return (
    <Modal>
      <form className={styles.form} onSubmit={submitData}>
        <h1>Mute {user.username}</h1>
        <div className={styles.input}>
          <label>Mute time (in minutes)</label>
          <input
            type="text"
            value={time}
            onChange={changeTime}
            placeholder="Mute time"
            required
          />
        </div>
        <div className={styles.buttons}>
          <button type="button" onClick={() => closeModal()}>
            Cancel
          </button>
          <button type="submit">Join</button>
        </div>
      </form>
    </Modal>
  );
};

export { MuteUser };
