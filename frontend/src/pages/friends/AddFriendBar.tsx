import { IoPersonAddSharp } from "react-icons/io5";
import styles from "./AddFriendBar.module.scss";

interface AddFriendBarProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const AddFriendBar = ({ value, onChange, onSubmit }: AddFriendBarProps) => (
  <form className={styles.addFriend} onSubmit={onSubmit}>
    <input type="text" value={value} onChange={onChange} required />
    <button type="submit">
      <IoPersonAddSharp className={styles.icon} />
    </button>
  </form>
);

export { AddFriendBar };
