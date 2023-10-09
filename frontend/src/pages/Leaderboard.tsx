import { useEffect, useState } from "react";
import { getUserList } from "../services/user";
import { User } from "../utils/user.interface";
import styles from "../styles/Leaderboard.module.scss";

function Leaderboard() {
  const [userList, setUserList] = useState<User[]>();

  useEffect(() => {
    async function fetchData() {
      try {
        const response: User[] = await getUserList();
        setUserList(response);
      } catch (error) {
        console.error("Data recovery error:", error);
      }
    }
    fetchData();
  }, []);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Top 30 players ranking</h1>
      <ul className={styles.playerList}>
        {userList ? (
          userList.map((user) => (
            <li className={styles.playerElement}>
              <p className={styles.userRankPos}>{user.id}</p>
              <p className={styles.userName}>{user.userName}</p>
              <p className={styles.userStat}>42</p>
            </li>
          ))
        ) : (
          <li>Data recovery error...</li>
        )}
      </ul>
    </div>
  );
}

export default Leaderboard;
