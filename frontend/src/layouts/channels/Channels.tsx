import { useAuth } from "../../utils/useAuth";
import styles from "./Channels.module.scss";

function Channels() {
  const { user } = useAuth();
  const channels = Array.from(
    { length: 100 },
    (_, index) => `Channel #${index + 1}`
  );

  return (
    <div className={styles.container}>
      <h1>Channels</h1>
      <ul>
        {channels.map((channel, index) => (
          <li key={index}>{channel}</li>
        ))}
      </ul>
    </div>
  );
}

export default Channels;
