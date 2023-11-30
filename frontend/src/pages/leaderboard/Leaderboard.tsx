import { useEffect, useState } from "react";
import styles from "./Leaderboard.module.scss";
import { useAuth } from "../../hooks/useAuth";
import { User } from "../../types/user.interface";

function Leaderboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[] | null>(null);

  useEffect(() => {}, [user]);

  return (
    <>
      {user && (
        <div className={styles.container}>
          <ul></ul>
        </div>
      )}
    </>
  );
}

export default Leaderboard;
