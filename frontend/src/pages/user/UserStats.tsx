import { Separator } from "../../components/Separator";
import { Stats } from "../../types/game.interface";
import styles from "./UserStats.module.scss";

interface UserStatsProps {
  stats: Stats;
}

const UserStats = ({ stats }: UserStatsProps) => {
  const totalMatches = stats.wonMatches + stats.lostMatches;
  const wonPercentage = (stats.wonMatches / totalMatches) * 100;
  const lostPercentage = 100 - wonPercentage;

  return (
    <div className={styles.container}>
      <h1>Stats</h1>
      <Separator />
      <div className={styles.details}>
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
    </div>
  );
};

export { UserStats };
