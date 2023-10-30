import { useEffect, useState } from "react";
import { getUser } from "../../services/user.api";
import { useNavigate } from "react-router-dom";
import { notifySuccess, notifyError } from "../../utils/notifications";
import styles from "./Settings.module.scss";
import { User } from "../../types/user.interface";
import {
  disableUserTwoFa,
  generateUserTwoFaQrCode,
} from "../../services/auth.api";
import { Separator } from "../../components/Separator";
import { AuthSettings, ProfileSettings } from "./SettingsCategory";

function Settings() {
  const [category, setCategory] = useState<number>(0);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  const enableTwoFa = async () => {
    const data = await generateUserTwoFaQrCode();
    if (!data.success) {
      notifyError(data.message);
      return;
    }

    if (data.qrcode) {
      const qrCodeBase64 = btoa(data.qrcode);
      navigate(`/settings/twofa/${qrCodeBase64}`);
    }
  };

  const disableTwoFa = async () => {
    const data = await disableUserTwoFa();
    if (!data.success) {
      notifyError(data.message);
      return;
    }

    getUserData();
    notifySuccess(data.message);
  };

  const getUserData = async () => {
    const data = await getUser();
    if (!data) {
      navigate("/");
      return;
    }
    setUser(data);
  };

  useEffect(() => {
    getUserData();
  }, []);

  return (
    <>
      {user && (
        <div className={styles.container}>
          <h1>User settings</h1>
          <Separator />
          <div className={styles.catButtons}>
            <button
              className={category === 0 ? styles.isActive : styles.notActive}
              onClick={() => setCategory(0)}
            >
              Public profile
            </button>

            <button
              className={category === 1 ? styles.isActive : styles.notActive}
              onClick={() => setCategory(1)}
            >
              Password and authentication
            </button>
          </div>
          <Separator />
          {category === 0 && <ProfileSettings />}
          {category === 1 && <AuthSettings />}
        </div>
      )}
    </>
  );
}

export default Settings;
