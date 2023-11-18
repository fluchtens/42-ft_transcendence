import styles from "./ChannelElement.module.scss";

interface ChannelElementProps {
  name: string;
  status: string;
}

const ChannelElement = ({ name, status }: ChannelElementProps) => {
  return (
    <div className={styles.container}>
      <button className={styles.channelBtn}>
        <div>
          <p className={styles.name}>{name}</p>
          <p className={styles.status}>{status}</p>
        </div>
      </button>
    </div>
  );
};

export { ChannelElement };
