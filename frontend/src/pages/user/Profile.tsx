import { useEffect, useState } from "react";
import {
  getUserByUsernameApi,
  getUserHistoryApi,
  getUserStatsApi,
} from "../../services/user.api";
import { useNavigate, useParams } from "react-router-dom";
import { User } from "../../types/user.interface";
import styles from "./Profile.module.scss";
import { UserDetails } from "./UserDetails";
import { UserStats } from "./UserStats";
import { Game, Stats } from "../../types/game.interface";
import { UserHistory } from "./UserHistory";

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [history, setHistory] = useState<Game[] | null>(null);
  const { username } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!username) return;

      const userData = await getUserByUsernameApi(username);
      if (!userData) {
        navigate("/");
        return;
      }
      setUser(userData);

      const userStats = await getUserStatsApi(userData.id);
      setStats(userStats);

      const userHistory = await getUserHistoryApi(userData.id);
      setHistory(userHistory);
    };

    fetchData();
  }, [username]);

  return (
    <>
      {user && stats && history && (
        <div className={styles.container}>
          <ul className={styles.profile}>
            <li>
              <UserDetails user={user} />{" "}
            </li>
            <li>
              <UserStats stats={stats} />
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
