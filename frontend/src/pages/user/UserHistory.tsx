import { GiPingPongBat } from "react-icons/gi";
import styles from "./UserHistory.module.scss";
import { Game } from "../../types/game.interface";
import { Separator } from "../../components/Separator";

interface UserHistoryProps {
  history: Game[];
}

const UserHistory = ({ history }: UserHistoryProps) => {
  return (
    <div className={styles.container}>
      <h1>Match history</h1>
      <Separator />
      <div className={styles.details}>
        <ul>
          {history?.map((match) => (
            <li className={styles.match} key={match.id}>
              <div className={`${styles.userStats} ${styles.left}`}>
                <p className={styles.player}>{match.winner.username}</p>
                <div className={styles.rating}>
                  <p className={styles.ratingNow}>{match.winnerRatingAfter}</p>
                  <p className={styles.ratingIncrease}>
                    +{match.winnerRatingAfter - match.winnerRatingBefore}
                  </p>
                </div>
              </div>
              <GiPingPongBat className={styles.matchIcon} />
              <div className={`${styles.userStats} ${styles.right}`}>
                <p className={styles.player}>{match.loser.username}</p>
                <div className={styles.rating}>
                  <p className={styles.ratingNow}>{match.loserRatingAfter}</p>
                  <p className={`${styles.ratingDecrease}`}>
                    {match.loserRatingAfter - match.loserRatingBefore}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
};

export { UserHistory };
