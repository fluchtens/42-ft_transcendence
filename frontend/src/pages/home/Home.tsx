import { Link } from "react-router-dom";
import styles from "./Home.module.scss";

function Home() {
  return (
    <div className={styles.container}>
      <div className={styles.title}>
        <h1>Welcome to ft_transcendence</h1>
        <h2>Final project of the common core curriculum at 42</h2>
      </div>
      <Link to="/game" className={styles.playButton}>
        Play Now
      </Link>
    </div>
  );
}

export default Home;
