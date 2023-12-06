import { useState } from "react";
import { Modal } from "../../../components/Modal";
import styles from "./Moderation.module.scss";
import { notifyError, notifySuccess } from "../../../utils/notifications";
import { Channel } from "../../../types/chat.interface";
import { useChatSocket } from "../../../hooks/useChatSocket";

interface UnbanUserProps {
  channel: Channel;
  closeModal: () => void;
}

const UnbanUser = ({ channel, closeModal }: UnbanUserProps) => {
  const [unbanUser, setUnbanUser] = useState<string>("");
  const chatSocket = useChatSocket();

  const changeUnbanUser = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUnbanUser(e.target.value);
  };

  const submitData = (e: React.FormEvent) => {
    e.preventDefault();
    chatSocket.emit(
      "unbanUser",
      { channelId: channel.id, userToUnban: unbanUser },
      (result: string) => {
        if (!result) {
          notifySuccess(unbanUser + " has been unban");
        } else if (result === "Permission denied") {
          notifyError("Permission denied");
        } else {
          notifyError("fail to unban the user");
        }
      }
    );
    closeModal();
    setUnbanUser("");
  };

  return (
    <Modal>
      <form className={styles.form} onSubmit={submitData}>
        <h1>Unban a user</h1>
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
