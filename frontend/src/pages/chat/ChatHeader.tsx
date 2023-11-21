import { IoSettings } from "react-icons/io5";
import { HiUsers } from "react-icons/hi2";
import styles from "./ChatHeader.module.scss";

interface ChatHeaderProps {
  title: string;
}

const ChatHeader = ({ title }: ChatHeaderProps) => (
  <div className={styles.header}>
    <button type="submit">
      <IoSettings className={styles.icon} />
    </button>
    <h1>{title}</h1>
    <button type="submit">
      <HiUsers className={styles.icon} />
    </button>
  </div>
);

export { ChatHeader };
