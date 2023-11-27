import styles from "./Loading.module.scss";

const Loading = () => (
  <div className={styles.board}>
    <div className={styles.bat}></div>
    <div className={styles.ball}></div>
    <div className={styles.ball}></div>
    <div className={styles.ball}></div>
    <div className={styles.ball}></div>
    <div className={styles.back}></div>
  </div>
);

export { Loading };
