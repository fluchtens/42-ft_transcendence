import { useNavigate, useParams } from "react-router-dom";
import { Notify, notifyError } from "../../utils/notifications";
import { useState } from "react";
import { enableUserTwoFa } from "../../services/auth.api";

function TwoFaSetup() {
  const [token, setToken] = useState<string>("");
  const { qrcode } = useParams();
  const qrCodeData = qrcode ? atob(qrcode) : null;
  const navigate = useNavigate();

  const changeToken = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToken(e.target.value);
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
    <div>
      {qrCodeData ? (
        <form onSubmit={enableTwoFa}>
          <img src={qrCodeData} alt="qrcode" />
          <div>
            <label>Token:</label>
            <input type="text" value={token} onChange={changeToken} required />
          </div>
          <button type="submit">Continue</button>
        </form>
      ) : (
        <span>Empty QRCode</span>
      )}
      <Notify />
    </div>
  );
}

export default TwoFaSetup;
