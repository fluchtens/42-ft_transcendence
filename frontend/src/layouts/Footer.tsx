import { AiFillGithub } from "react-icons/ai";
import styles from "../styles/Footer.module.scss";

function Footer() {
  return (
    <div className={styles.container}>
      <p className={styles.text}>© 2023 All rights reserved</p>
      <a href="https://github.com/fluchtens/42-ft_transcendence">
        <button className={styles.gitHubButton}>
          <AiFillGithub className={styles.gitHubIcon} />
        </button>
      </a>
    </div>
  );
}

export default Footer;
