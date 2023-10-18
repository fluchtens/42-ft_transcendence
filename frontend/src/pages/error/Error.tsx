import { Link } from "react-router-dom";
import styles from "./Error.module.scss";
import errorLogo from "/cry.png";

export default function Error() {
  return (
    <div className={styles.container}>
      <div className={styles.error}>
        <p className={styles.title}>
          <span>4</span>
          <img src={errorLogo} />
          <span>4</span>
        </p>
        <h2>Oops! Page Not Be Found</h2>
        <p>
          Sorry but the page you are looking for does not exist, have been
          removed. name changed or is temporarily unavailable
        </p>
        <Link to="/" className={styles.homeLink}>
          Back to home
        </Link>
      </div>
    </div>
  );
}
