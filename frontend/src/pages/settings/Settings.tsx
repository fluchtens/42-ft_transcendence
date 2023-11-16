import { useEffect, useState } from "react";
import { getUserApi } from "../../services/user.api";
import { useNavigate } from "react-router-dom";
import styles from "./Settings.module.scss";
import { User } from "../../types/user.interface";
import AuthSettings from "./AuthSettings";
import ProfileSettings from "./ProfileSettings";

function Settings() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getUserData = async () => {
      const data = await getUserApi();
      if (!data) {
        navigate("/");
        return;
      }
      setUser(data);
    };

    getUserData();
  }, []);

  return (
    <>
      {user && (
        <div className={styles.container}>
          <ul className={styles.settings}>
            <li>
              <ProfileSettings />
            </li>
            <li>
              <AuthSettings />
            </li>
          </ul>
        </div>
      )}
    </>
  );
}

export default Settings;
