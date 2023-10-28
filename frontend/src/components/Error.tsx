import { Link } from "react-router-dom";
import styles from "./Error.module.scss";
import errorLogo from "/cry.png";

function Error() {
  return (
    <div className={styles.container}>
      <div className={styles.error}>
        <h1>
          <span>4</span>
          <img src={errorLogo} />
          <span>4</span>
        </h1>
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

export default Error;
