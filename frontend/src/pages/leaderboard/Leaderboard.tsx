import { useEffect, useState } from "react";
import styles from "./Leaderboard.module.scss";
import { useAuth } from "../../hooks/useAuth";
import { User } from "../../types/user.interface";
import { getLeaderboardApi, getUserStatsApi } from "../../services/user.api";
import defaultAvatar from "/default_avatar.png";
import { Link } from "react-router-dom";

function Leaderboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[] | null>(null);

  const winLossRatio = (wonMatches: number, lostMatches: number) => {
    if (lostMatches === 0) {
      return "...";
    }
    return wonMatches / lostMatches;
  };

  useEffect(() => {
    const fetchData = async () => {
      const usersData = await getLeaderboardApi();
      if (!usersData) return;

      const improvedUsersData = await Promise.all(
        usersData.map(async (user: User) => {
          const stats = await getUserStatsApi(user.id);
          if (stats) {
            user.lostMatches = stats.lostMatches;
            user.wonMatches = stats.wonMatches;
            return user;
          }
        })
      );
      setUsers(improvedUsersData as User[]);
    };

    if (user === null) return;
    fetchData();
  }, [user]);

  return (
    <>
      {user && (
        <div className={styles.container}>
          <div className={styles.tableContainer}>
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Player</th>
                  <th className={styles.responsiveStat}>Matches</th>
                  <th className={styles.responsiveStat}>Won</th>
                  <th className={styles.responsiveStat}>Lost</th>
                  <th className={styles.responsiveStat}>W/L Ratio</th>
                  <th>Rating</th>
                </tr>
              </thead>
              <tbody>
                {users?.map((user, index) => (
                  <tr key={user.id}>
                    <td>{index + 1}</td>
                    <td className={styles.avatarAndName}>
                      {user.avatar ? (
                        <img src={user.avatar} />
                      ) : (
                        <img src={defaultAvatar} />
                      )}
                      <Link
                        className={styles.link}
                        to={`/user/${user.username}`}
                      >
                        {user.username}
                      </Link>
                    </td>
                    <td className={styles.responsiveStat}>
                      {user.wonMatches + user.lostMatches}
                    </td>
                    <td className={styles.responsiveStat}>{user.wonMatches}</td>
                    <td className={styles.responsiveStat}>
                      {user.lostMatches}
                    </td>
                    <td className={styles.responsiveStat}>
                      {winLossRatio(user.wonMatches, user.lostMatches)}
                    </td>
                    <td>{user.rating}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

export default Leaderboard;
