import { useEffect, useState } from "react";
import {
  getUserByUsernameApi,
  getUserHistoryApi,
  getUserStatsApi,
} from "../../services/user.api";
import { useParams } from "react-router-dom";
import { User } from "../../types/user.interface";
import styles from "./Profile.module.scss";
import { UserDetails } from "./UserDetails";
import { Game, Stats } from "../../types/game.interface";
import { UserHistory } from "./UserHistory";

export default function Profile() {
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [history, setHistory] = useState<Game[] | null>(null);
  const { username } = useParams();

  useEffect(() => {
    const fetchData = async () => {
      if (!username) return;

      const userData = await getUserByUsernameApi(username);
      if (!userData) return;
      setTargetUser(userData);

      const userStats = await getUserStatsApi(userData.id);
      if (userStats) setStats(userStats);

      const userHistory = await getUserHistoryApi(userData.id);
      if (userHistory) setHistory(userHistory);
    };

    fetchData();
  }, [username]);

  return (
    <>
      {targetUser && stats && history && (
        <div className={styles.container}>
          <ul className={styles.profile}>
            <li>
              <UserDetails user={targetUser} stats={stats} />{" "}
            </li>
            <li>
              <UserHistory history={history} />
            </li>
          </ul>
        </div>
      )}
    </>
  );
}
