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
import { useAuth } from "../../hooks/useAuth";

function Profile() {
  const [targetUser, setTargetUser] = useState<User | null | undefined>();
  const [stats, setStats] = useState<Stats | null>(null);
  const [history, setHistory] = useState<Game[] | null>(null);
  const { user } = useAuth();
  const { username } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      if (username) {
        const userData = await getUserByUsernameApi(username);
        if (!userData) {
          setTargetUser(null);
          return;
        }
        setTargetUser(userData);

        const userStats = await getUserStatsApi(userData.id);
        if (userStats) setStats(userStats);

        const userHistory = await getUserHistoryApi(userData.id);
        if (userHistory) setHistory(userHistory);
      }
    };

    if (user === null) return;
    fetchData();
  }, [user, username]);

  if (targetUser === null) {
    navigate("/");
  }

  return (
    <>
      {user && targetUser && stats && history && (
        <div className={styles.container}>
          <ul className={styles.profile}>
            <li>
              <UserDetails targetUser={targetUser} stats={stats} />
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

export default Profile;
