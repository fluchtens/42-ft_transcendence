import styles from "./ChannelElement.module.scss";
import { Channel } from "../../types/chat.interface";
import { useState } from "react";
import { JoinChannelModal } from "./JoinChannelModal";
import { useNavigate } from "react-router-dom";

interface ChannelElementProps {
  channel: Channel;
}

const ChannelElement = ({ channel }: ChannelElementProps) => {
  const [modal, setModal] = useState<boolean>(false);
  const navigate = useNavigate();

  const closeModal = () => {
    setModal(false);
  };

  const joinChannel = () => {
    console.log(channel.isMember);
    if (!channel.isMember) {
      setModal(true);
    } else {
      navigate("/chat/" + channel.id);
    }
  };

  return (
    <>
      {channel.public && (
        <div className={styles.container}>
          <button className={styles.channelBtn} onClick={joinChannel}>
            <div>
              <p className={styles.name}>{channel.name}</p>
              {channel.protected ? (
                <p className={styles.status}>Public with password</p>
              ) : (
                <p className={styles.status}>Public</p>
              )}
            </div>
          </button>
        </div>
      )}
      {!channel.public && (
        <div className={styles.container}>
          <button className={styles.channelBtn} onClick={joinChannel}>
            <div>
              <p className={styles.name}>{channel.name}</p>
              {channel.protected ? (
                <p className={styles.status}>Private with password</p>
              ) : (
                <p className={styles.status}>Private</p>
              )}
            </div>
          </button>
        </div>
      )}
      {modal && !channel.isMember && !channel.isConnected && (
        <JoinChannelModal channel={channel} closeModal={closeModal} />
      )}
    </>
  );
};

export { ChannelElement };
