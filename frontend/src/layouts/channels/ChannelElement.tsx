import { useNavigate } from "react-router-dom";
import styles from "./ChannelElement.module.scss";
import { Channel } from "../../types/chat.interface";

interface ChannelElementProps {
  channel: Channel;
}

const ChannelElement = ({ channel }: ChannelElementProps) => {
  const navigate = useNavigate();

  const navigateToChannel = () => {
    navigate("/chat/1");
  };

  return (
    <div className={styles.container}>
      <button className={styles.channelBtn} onClick={navigateToChannel}>
        <div>
          <p className={styles.name}>{channel.name}</p>
          <p className={styles.status}>Public</p>
        </div>
      </button>
    </div>
  );
};

export { ChannelElement };
