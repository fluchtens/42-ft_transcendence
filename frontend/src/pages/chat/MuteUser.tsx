import { useState } from "react";
import { Modal } from "../../components/Modal";
import styles from "./MuteUser.module.scss";
import { notifyError, notifySuccess } from "../../utils/notifications";
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
  const [time, setTime] = useState<number>(0);
  const socket = useChatSocket();

  const changeTime = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTime(e.target.valueAsNumber);
  };

  const submitData = (e: React.FormEvent) => {
    e.preventDefault();
    cb();
    socket.emit('muteUser', {
      channelId: channel.id, userIdToMute:user.id, timeToMute: time
    }, (result:string) => {
      if (!result) {
        notifySuccess('muteUser');
      }
      else {
        notifyError(result);
      }
    })
    closeModal();
    setTime(0);
  };

  return (
    <Modal>
      <form className={styles.form} onSubmit={submitData}>
        <h1>Mute {user.username}</h1>
        <div className={styles.input}>
          <label>Mute time (in minutes)</label>
          <input
            type="number"
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
          <button type="submit">Mute</button>
        </div>
      </form>
    </Modal>
  );
};

export { MuteUser };
