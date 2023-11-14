import styles from "./UserContextMenu.module.scss";
import { Link } from "react-router-dom";

interface UserContextMenuProps {
  username: string;
  cb: () => void;
}

const UserContextMenu = ({ username, cb }: UserContextMenuProps) => {
  return (
    <div className={styles.container}>
      <Link className={styles.link} to={`/user/${username}`} onClick={cb}>
        View user profile
      </Link>
      <button onClick={cb}>Block all communication</button>
      <button onClick={cb}>Unfriend</button>
    </div>
  );
};

export { UserContextMenu };
