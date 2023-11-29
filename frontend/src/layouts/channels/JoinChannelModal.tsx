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
    if (channel.public) {
      socket.emit(
        "joinPublicChannel",
        { channelId: channel.id, password: password },
        (result: boolean) => {
          if (result) {
            navigate("/chat/" + channel.id);
            notifySuccess("You have joined the channel");
          }
          else {
            notifyError("Error when try to join the channel");
          }
        }
      );
    }
    else {
      socket.emit("joinRoom", {channelId:channel.id, getMessages: false, password:password}, (result : boolean) => {
        if (result) {
          notifySuccess("You have joined the channel");
          navigate("/chat/" + channel.id);
        }
        else {
          notifyError("Wrong password");
        }
      });
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
              placeholder="Enter a channel password"
              required
            />
          </div>
        )}
        <button onClick={() => closeModal()}>Cancel</button>
        <button type="submit">Join</button>
      </form>
    </Modal>
  );
};

export { JoinChannelModal };
