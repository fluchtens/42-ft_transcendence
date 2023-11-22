import { useNavigate } from "react-router-dom";
import styles from "./ChannelElement.module.scss";

interface ChannelElementProps {
  name: string;
  status: string;
}

const ChannelElement = ({ name, status }: ChannelElementProps) => {
  const navigate = useNavigate();

  const navigateToChannel = () => {
    navigate("/chat/1");
  };

  return (
    <div className={styles.container}>
      <button className={styles.channelBtn} onClick={navigateToChannel}>
        <div>
          <p className={styles.name}>{name}</p>
          <p className={styles.status}>{status}</p>
        </div>
      </button>
    </div>
  );
};

export { ChannelElement };
