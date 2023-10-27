import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GiPingPongBat } from "react-icons/gi";
import styles from "./Auth.module.scss";
import { authUserTwoFa } from "../../services/auth.api";
import { getUser } from "../../services/user.api";

function TwoFaAuth() {
  const [token, setToken] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const changeToken = (e: React.ChangeEvent<HTMLInputElement>) => {
    setToken(e.target.value);
  };

  const submitData = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = await authUserTwoFa(token);
    if (!data.success) {
      setErrorMessage(data.message);
      return;
    }

    navigate("/");
  };

  useEffect(() => {
    const checkAuth = async () => {
      const data = await getUser();
      if (data) {
        navigate("/");
      }
    };
    checkAuth();
  }, []);

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.mainLink}>
        <GiPingPongBat className={styles.icon} />
        ft_transcendence
      </Link>

      <form className={styles.form} onSubmit={submitData}>
        <h1>Two-factor authentication</h1>
        <p>Authentication code :</p>

        {errorMessage && (
          <div className={styles.error}>
            <p>
              {Array.isArray(errorMessage) ? errorMessage[0] : errorMessage}
            </p>
          </div>
        )}

        <div className={styles.input}>
          <input
            type="text"
            value={token}
            onChange={changeToken}
            placeholder="XXXXXX"
            required
          />
        </div>

        <div className={styles.submitBtn}>
          <button type="submit">Continue</button>
        </div>
      </form>
    </div>
  );
}

export default TwoFaAuth;
