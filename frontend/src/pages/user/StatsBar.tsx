import { Stats } from "../../types/game.interface";
import styles from "./StatsBar.module.scss";

interface StatsBarProps {
  stats: Stats;
}

const StatsBar = ({ stats }: StatsBarProps) => {
  const totalMatches = stats.wonMatches + stats.lostMatches;
  const wonPercentage = (stats.wonMatches / totalMatches) * 100;
  const lostPercentage = 100 - wonPercentage;

  return (
    <div className={styles.container}>
      <div className={styles.percentages}>
        <p className={styles.wonPercentage}>{wonPercentage.toFixed(2)}%</p>
        <p className={styles.lostPercentage}>{lostPercentage.toFixed(2)}%</p>
      </div>
      <div className={styles.statsBar}>
        <div
          className={styles.wonPart}
          style={{ width: `${wonPercentage}%` }}
        ></div>
        <div
          className={styles.lostPart}
          style={{ width: `${lostPercentage}%` }}
        ></div>
      </div>
      <div className={styles.stats}>
        <p className={styles.win}>{stats.wonMatches} Won</p>
        <p className={styles.lost}>{stats.lostMatches} Lost</p>
      </div>
    </div>
  );
};

export { StatsBar };
