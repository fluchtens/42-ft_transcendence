import { useEffect, useState } from "react";
import { updatePasswordApi } from "../../services/user.api";
import { notifyError, notifySuccess } from "../../utils/notifications";
import styles from "./AuthSettings.module.scss";
import {
  disableTwoFaApi,
  generateTwoFaQrCodeApi,
} from "../../services/auth.api";
import { Separator } from "../../components/Separator";
import { useAuth } from "../../hooks/useAuth";
import TwoFaSetup from "./TwoFaSetup";

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
  const { user, refreshUser } = useAuth();
  const [actualPwd, setActualPwd] = useState<string>("");
  const [newPwd, setNewPwd] = useState<string>("");
  const [confirmNewPwd, setConfirmNewPwd] = useState<string>("");
  const [qrcode, setQrcode] = useState<string>("");
  const [twoFaModal, setTwoFaModal] = useState<boolean>(false);

  const closeTwoFaModal = () => {
    setTwoFaModal(false);
  };

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
      const { success, message } = await updatePasswordApi(actualPwd, newPwd);
      success ? notifySuccess(message) : notifyError(message);
    } else {
      notifyError("Password confirmation doesn't match the password");
    }

    setActualPwd("");
    setNewPwd("");
    setConfirmNewPwd("");
    await refreshUser();
  };

  const enableTwoFa = async () => {
    const data = await generateTwoFaQrCodeApi();
    if (!data.success) {
      notifyError(data.message);
      return;
    }

    if (data.qrcode) {
      const qrCodeBase64 = btoa(data.qrcode);
      setQrcode(qrCodeBase64);
      setTwoFaModal(true);
    }
  };

  const disableTwoFa = async () => {
    const data = await disableTwoFaApi();
    if (!data.success) {
      notifyError(data.message);
      return;
    }

    await refreshUser();
    notifySuccess(data.message);
  };

  useEffect(() => {
    if (!user) return;
  }, [user]);

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
      {twoFaModal && qrcode && (
        <TwoFaSetup qrcode={qrcode} close={closeTwoFaModal} />
      )}
    </>
  );
}

export default AuthSettings;
