import { useEffect, useState } from "react";
import { getUserByUsernameApi } from "../../services/user.api";
import { useNavigate, useParams } from "react-router-dom";
import { User } from "../../types/user.interface";
import styles from "./Profile.module.scss";
import { UserDetails } from "./UserDetails";
import { UserStats } from "./UserStats";

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const { username } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      if (!username) {
        return;
      }
      const data = await getUserByUsernameApi(username);
      if (!data) {
        navigate("/");
        return;
      }
      setUser(data);
    };
    getUser();
  }, [username]);

  return (
    <>
      {user && (
        <div className={styles.container}>
          <UserDetails user={user} />
          <UserStats user={user} />
        </div>
      )}
    </>
  );
}
