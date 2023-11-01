import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { getUser, putUserPassword } from "../../services/user.api";
import { User } from "../../types/user.interface";
import { notifyError, notifySuccess } from "../../utils/notifications";
import styles from "./AuthSettings.module.scss";
import {
  disableUserTwoFa,
  generateUserTwoFaQrCode,
} from "../../services/auth.api";
import { Separator } from "../../components/Separator";

interface InputTextProps {
  label: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const TextInput = ({ label, value, onChange }: InputTextProps) => (
  <div className={styles.inputText}>
    <label>{label}</label>
    <input
      type="password"
      value={value}
      onChange={onChange}
      placeholder=""
      required
    />
  </div>
);

function AuthSettings() {
  const [user, setUser] = useState<User | null>(null);
  const [actualPwd, setActualPwd] = useState<string>("");
  const [newPwd, setNewPwd] = useState<string>("");
  const [confirmNewPwd, setConfirmNewPwd] = useState<string>("");
  const navigate = useNavigate();

  const changeActualPwd = (e: React.ChangeEvent<HTMLInputElement>) => {
    setActualPwd(e.target.value);
  };

  const changeNewPwd = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewPwd(e.target.value);
  };

  const changeConfirmNewPwd = (e: React.ChangeEvent<HTMLInputElement>) => {
    setConfirmNewPwd(e.target.value);
  };

  const submitData = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPwd === confirmNewPwd) {
      const { success, message } = await putUserPassword(actualPwd, newPwd);
      const formatMessage = Array.isArray(message) ? message[0] : message;
      success ? notifySuccess(message) : notifyError(formatMessage);
    } else {
      notifyError("Password confirmation doesn't match the password");
    }

    setActualPwd("");
    setNewPwd("");
    setConfirmNewPwd("");
    getUserData();
  };

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
        <div className={styles.authSettings}>
          <form className={styles.changePassword} onSubmit={submitData}>
            <h1>Change password</h1>
            <Separator />
            <TextInput
              label="Old password"
              value={actualPwd}
              onChange={changeActualPwd}
            />
            <TextInput
              label="New password"
              value={newPwd}
              onChange={changeNewPwd}
            />
            <TextInput
              label="Confirm new password"
              value={confirmNewPwd}
              onChange={changeConfirmNewPwd}
            />
            <button type="submit">Update password</button>
          </form>
          <div className={styles.toggleTwoFa}>
            <h1>Two-factor authentication</h1>
            <Separator />
            {user.twoFa ? (
              <>
                <h2>Two-factor authentication is enabled.</h2>
                <p>
                  Two-factor authentication adds an additional layer of security
                  to your account by requiring more than just a password to sign
                  in.
                </p>
                <button className={styles.disableBtm} onClick={disableTwoFa}>
                  Disable two-factor authentication
                </button>
              </>
            ) : (
              <>
                <h2>Two-factor authentication is not enabled yet.</h2>
                <p>
                  Two-factor authentication adds an additional layer of security
                  to your account by requiring more than just a password to sign
                  in.
                </p>
                <button className={styles.enableBtn} onClick={enableTwoFa}>
                  Enable two-factor authentication
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default AuthSettings;
