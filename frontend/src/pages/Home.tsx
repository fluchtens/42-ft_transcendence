import { Link } from "react-router-dom";
import styles from "./Home.module.scss";

function Home() {
  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Welcome to ft_transcendence</h1>
      <h2 className={styles.subtitle}>
        Final project of the common core curriculum at 42
      </h2>
      <Link to="/game" className={styles.playButton}>
        Play Now
      </Link>
    </div>
  );
}

export default Home;
