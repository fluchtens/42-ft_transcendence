import { IoSettings } from "react-icons/io5";
import { HiUsers } from "react-icons/hi2";
import styles from "./ChatHeader.module.scss";

interface ChatHeaderProps {
  title: string;
  toggleMembersMenu: () => void;
}

const ChatHeader = ({ title, toggleMembersMenu }: ChatHeaderProps) => (
  <div className={styles.header}>
    <button type="submit">
      <IoSettings className={styles.icon} />
    </button>
    <h1>{title}</h1>
    <button onClick={toggleMembersMenu}>
      <HiUsers className={styles.icon} />
    </button>
  </div>
);

export { ChatHeader };
