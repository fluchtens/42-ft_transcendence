import { Modal } from "../../components/Modal";
import styles from "./JoinChannelModal.module.scss";
import { notifyError, notifySuccess } from "../../utils/notifications";
import { Channel } from "../../types/chat.interface";
import { useState } from "react";
import { useChatSocket } from "../../hooks/useChatSocket";
import { useNavigate } from "react-router-dom";

interface JoinChannelModalProps {
  channel: Channel;
  closeModal: () => void;
}

const JoinChannelModal = ({ channel, closeModal }: JoinChannelModalProps) => {
  const [password, setPassword] = useState<string>("");
  const navigate = useNavigate();
  const socket = useChatSocket();

  const changePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const submitData = (e: React.FormEvent) => {
    e.preventDefault();
    if (channel.public && !channel.isMember) {
      socket.emit(
        "joinPublicChannel",
        { channelId: channel.id, password: password },
        (result: string) => {
          if (!result) {
            navigate("/chat/" + channel.id);
            notifySuccess("You has joined the channel");
          } else if (result === "this user is banned") {
            notifyError("You are banned");
          }
        }
      );
    } else {
      socket.emit(
        "connectToProtectedChannel",
        { channelId: channel.id, password: password },
        (result: boolean) => {
          if (result) {
            notifySuccess("You has joined the channel password");
            navigate("/chat/" + channel.id);
          } else {
            notifyError("Wrong password");
          }
        }
      );
    }
    closeModal();
    setPassword("");
  };

  return (
    <Modal>
      <form className={styles.form} onSubmit={submitData}>
        <h1>Join {channel.name}</h1>
        {channel.protected && (
          <div className={styles.input}>
            <label>Channel Password</label>
            <input
              type="password"
              value={password}
              onChange={changePassword}
              placeholder="Channel password"
              required
            />
          </div>
        )}
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

export { JoinChannelModal };
