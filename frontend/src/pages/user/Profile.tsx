import { useEffect, useState } from "react";
import { getUserByUsernameApi, getUserStatsApi } from "../../services/user.api";
import { useNavigate, useParams } from "react-router-dom";
import { User } from "../../types/user.interface";
import styles from "./Profile.module.scss";
import { UserDetails } from "./UserDetails";
import { UserStats } from "./UserStats";
import { Stats } from "../../types/game.interface";

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<Stats | null>(null);
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
    };

    fetchData();
  }, [username]);

  return (
    <>
      {user && stats && (
        <div className={styles.container}>
          <UserDetails user={user} />
          <UserStats stats={stats} />
        </div>
      )}
    </>
  );
}
