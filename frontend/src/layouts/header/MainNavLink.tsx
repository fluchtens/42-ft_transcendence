import { Link } from "react-router-dom";
import { GiPingPongBat } from "react-icons/gi";
import { AiOutlineMenu } from "react-icons/ai";
import styles from "./MainNavLink.module.scss";

interface MainNavLinkProps {
  toggleNavMenu: () => void;
}

const MainNavLink = ({ toggleNavMenu }: MainNavLinkProps) => (
  <div className={styles.container}>
    <Link to="/" className={styles.mainLink}>
      <GiPingPongBat className={styles.mainIcon} />
      ft_transcendence
    </Link>
    <button className={styles.navBtn} onClick={toggleNavMenu}>
      <AiOutlineMenu className={styles.navBtnIcon} />
    </button>
  </div>
);

export { MainNavLink };
