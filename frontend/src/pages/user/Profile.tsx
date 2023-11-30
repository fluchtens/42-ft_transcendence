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
import { Game, Stats } from "../../types/game.interface";
import { UserHistory } from "./UserHistory";
import { Loading } from "../../components/Loading";

export default function Profile() {
  const [loading, setLoading] = useState<boolean>(true);
  const [targetUser, setTargetUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
  const [history, setHistory] = useState<Game[] | null>(null);
  const { username } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (!username) return;

      const userData = await getUserByUsernameApi(username);
      if (!userData || !userData.id) {
        navigate("/");
        return;
      }
      setTargetUser(userData);

      const userStats = await getUserStatsApi(userData.id);
      if (userStats) setStats(userStats);

      const userHistory = await getUserHistoryApi(userData.id);
      if (userHistory) setHistory(userHistory);

      setLoading(false);
    };

    fetchData();
  }, [username]);

  return (
    <>
      {loading && <Loading />}
      {!loading && targetUser && stats && history && (
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
