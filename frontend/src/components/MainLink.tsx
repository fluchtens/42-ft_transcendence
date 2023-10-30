import { Link } from "react-router-dom";
import { GiPingPongBat } from "react-icons/gi";
import styles from "./MainLink.module.scss";

export function MainLink() {
  return (
    <Link to="/" className={styles.link}>
      <GiPingPongBat className={styles.icon} />
      ft_transcendence
    </Link>
  );
}
