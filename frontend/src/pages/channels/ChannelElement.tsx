import styles from "./ChannelElement.module.scss";
import { Channel } from "../../types/chat.interface";
import { useState } from "react";
import { JoinChannelModal } from "./actions/JoinChannelModal";
import { useNavigate } from "react-router-dom";
import { RiGitRepositoryPrivateFill } from "react-icons/ri";

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
    if ((!channel.isConnected && channel.protected) || !channel.isMember) {
      setModal(true);
    } else {
      navigate("/chat/" + channel.id);
    }
  };

  return (
    <>
      <button className={styles.button} onClick={joinChannel}>
        <p className={styles.name}>{channel.name}</p>
        <div className={styles.infos}>
          {channel.public ? (
            <p className={styles.status}>Public</p>
          ) : (
            <p className={styles.status}>Private</p>
          )}
          {channel.protected && (
            <RiGitRepositoryPrivateFill className={styles.icon} />
          )}
        </div>
      </button>
      {modal && <JoinChannelModal channel={channel} closeModal={closeModal} />}
    </>
  );
};

export { ChannelElement };
