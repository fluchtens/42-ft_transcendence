import { useEffect } from "react";
import styles from "./Settings.module.scss";
import AuthSettings from "./AuthSettings";
import ProfileSettings from "./ProfileSettings";
import { useAuth } from "../../hooks/useAuth";

function Settings() {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
  }, [user]);

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
