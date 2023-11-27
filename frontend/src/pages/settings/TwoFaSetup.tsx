import { notifyError, notifySuccess } from "../../utils/notifications";
import { useEffect, useState } from "react";
import { enableTwoFaApi } from "../../services/auth.api";
import { Separator } from "../../components/Separator";
import styles from "./TwoFaSetup.module.scss";
import { useAuth } from "../../hooks/useAuth";
import { Modal } from "../../components/Modal";

interface TwoFaSetupProps {
  qrcode: string;
  close: () => void;
}

const TwoFaSetup = ({ qrcode, close }: TwoFaSetupProps) => {
  const { refreshUser } = useAuth();
  const [token, setToken] = useState<string>("");
  const [qrcodeData, setQrcodeData] = useState<string>("");

  const changeToken = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToken(e.target.value);
  };

  const cancel = () => {
    close();
  };

  const enableTwoFa = async (e: React.FormEvent) => {
    e.preventDefault();

    const { success, message } = await enableTwoFaApi(token);
    if (!success) {
      notifyError(message);
      return;
    }

    await refreshUser();
    notifySuccess(message);
    close();
  };

  useEffect(() => {
    if (!qrcode) close();
    setQrcodeData(atob(qrcode));
  }, []);

  return (
    <Modal>
      <div className={styles.container}>
        {qrcodeData ? (
          <form onSubmit={enableTwoFa}>
            <h1>Enable two-factor authentication (2FA)</h1>
            <Separator />
            <h2>Setup authenticator app</h2>
            <p>
              Authenticator apps like Google Authenticator generate one-time
              passwords that are used as a second factor to verify your identity
              when prompted during sign-in.
            </p>
            <h3>Scan the QR code</h3>
            <p>Use an authenticator app to scan.</p>
            {qrcodeData && <img src={qrcodeData} alt="qrcode" />}
            <div className={styles.input}>
              <label>Verify the code from the app</label>
              <input
                type="text"
                value={token}
                onChange={changeToken}
                placeholder="XXXXXX"
                required
              />
            </div>
            <Separator />
            <div className={styles.buttons}>
              <button className={styles.cancel} type="button" onClick={cancel}>
                Cancel
              </button>
              <button className={styles.continue} type="submit">
                Continue
              </button>
            </div>
          </form>
        ) : (
          <span>Invalid QR Code</span>
        )}
      </div>
    </Modal>
  );
};

export default TwoFaSetup;
