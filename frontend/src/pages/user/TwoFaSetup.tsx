import { useNavigate, useParams } from "react-router-dom";
import { Notify, notifyError } from "../../utils/notifications";
import { useState } from "react";
import { enableUserTwoFa } from "../../services/auth.api";
import { Separator } from "../../components/Separator";
import styles from "./TwoFaSetup.module.scss";

function TwoFaSetup() {
  const [token, setToken] = useState<string>("");
  const { qrcode } = useParams();
  const qrCodeData = qrcode ? atob(qrcode) : null;
  const navigate = useNavigate();

  const changeToken = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToken(e.target.value);
  };

  const cancel = () => {
    navigate("/settings");
  };

  const enableTwoFa = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = await enableUserTwoFa(token);
    if (!data.success) {
      notifyError(data.message);
      return;
    }

    navigate(`/settings`);
  };

  return (
    <>
      <div className={styles.container}>
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
          {qrCodeData && <img src={qrCodeData} alt="qrcode" />}
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
            <button className={styles.cancel} onClick={cancel}>
              Cancel
            </button>
            <button className={styles.continue} type="submit">
              Continue
            </button>
          </div>
        </form>
        <Notify />
      </div>
    </>
  );
}

export default TwoFaSetup;
