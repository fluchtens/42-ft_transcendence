import { Link } from "react-router-dom";
import { GiPingPongBat } from "react-icons/gi";
import styles from "./MainTitle.module.scss";

const MainTitle = () => (
  <Link to="/" className={styles.mainLink}>
    <GiPingPongBat className={styles.icon} />
    ft_transcendence
  </Link>
);

export { MainTitle };
