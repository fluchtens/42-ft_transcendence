import { useEffect, useState } from "react";
import styles from "./Leaderboard.module.scss";
import { useAuth } from "../../hooks/useAuth";
import { User } from "../../types/user.interface";
import { getLeaderboardApi } from "../../services/user.api";

function Leaderboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[] | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      const usersData = await getLeaderboardApi();
      if (!usersData) return;
      setUsers(usersData);
    };
    fetchData();
  }, [user]);

  return (
    <>
      {user && (
        <div className={styles.container}>
          <ul>
            {users?.map((user, index) => (
              <li key={user.id}>
                <p>#{index + 1}</p>
                <p>{user.username}</p>
                <p>{user.rating}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

export default Leaderboard;
