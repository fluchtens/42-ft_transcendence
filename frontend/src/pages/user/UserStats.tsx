import { User } from "../../types/user.interface";
import styles from "./UserStats.module.scss";
import { IoGameController } from "react-icons/io5";

interface UserStatsProps {
  user: User;
}

const UserStats = ({ user }: UserStatsProps) => {
  const won = 42;
  const lost = 100 - won;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <IoGameController className={styles.icon} />
        <h2>Stats</h2>
      </div>
      <div className={styles.details}>
        <div className={styles.percentages}>
          <p className={styles.wonPercentage}>{won}%</p>
          <p className={styles.lostPercentage}>{lost}%</p>
        </div>
        <div className={styles.statsBar}>
          <div className={styles.wonPart} style={{ width: `${won}%` }}></div>
          <div className={styles.lostPart} style={{ width: `${lost}%` }}></div>
        </div>
        <div className={styles.stats}>
          <p className={styles.win}>{won} Won</p>
          <p className={styles.lost}>{58} Lost</p>
        </div>
      </div>
    </div>
  );
};

export { UserStats };
