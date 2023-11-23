import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./Auth.module.scss";
import { setupUserApi } from "../../services/auth.api";
import { MainTitle } from "../../components/MainTitle";
import { useAuth } from "../../utils/useAuth";

function Setup() {
  const { user, refreshUser } = useAuth();
  const [username, setUsername] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const changeUsername = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const submitData = async (e: React.FormEvent) => {
    e.preventDefault();

    const data = await setupUserApi(username);
    if (!data.success) {
      setErrorMessage(data.message);
      return;
    }

    await refreshUser();
    navigate("/");
    window.location.reload();
  };

  useEffect(() => {
    if (user) {
      navigate("/");
      return;
    }
  }, [user]);

  return (
    <div className={styles.container}>
      <MainTitle />
      <form className={styles.form} onSubmit={submitData}>
        <h1>Set up your new account</h1>
        <p>Choose a unique username :</p>
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
            value={username}
            onChange={changeUsername}
            placeholder="Enter a username"
            required
          />
        </div>
        <div className={styles.buttons}>
          <button className={styles.submitBtn} type="submit">
            Continue
          </button>
        </div>
      </form>
    </div>
  );
}

export default Setup;
