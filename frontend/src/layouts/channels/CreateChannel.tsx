import { FaPlus } from "react-icons/fa6";
import styles from "./CreateChannel.module.scss";

interface CreateChannelProps {
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit?: (e: React.FormEvent) => void;
}

const CreateChannel = ({ value, onChange, onSubmit }: CreateChannelProps) => (
  <form className={styles.addFriend} onSubmit={onSubmit}>
    <input type="text" value={value} onChange={onChange} required />
    <button type="submit">
      <FaPlus className={styles.icon} />
    </button>
  </form>
);

export { CreateChannel };
