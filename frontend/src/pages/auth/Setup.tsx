import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GiPingPongBat } from "react-icons/gi";
import styles from "./Auth.module.scss";
import { setupUser } from "../../services/auth.api";
import { getUser } from "../../services/user.api";

function Setup() {
  const [username, setUsername] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const changeUsername = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const submitData = async (e: React.FormEvent) => {
    e.preventDefault();
    const data = await setupUser(username);
    if (data.success) {
      navigate("/");
    } else {
      setErrorMessage(data.message);
    }
  };

  useEffect(() => {
    const getUserData = async () => {
      const data = await getUser();
      if (!data || !data.fortyTwoId) {
        navigate("/");
      }
    };
    getUserData();
  }, []);

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.mainLink}>
        <GiPingPongBat className={styles.icon} />
        ft_transcendence
      </Link>

      <form className={styles.form} onSubmit={submitData}>
        <h1>Set up your new account</h1>
        <p>Before using our services, please choose a unique username :</p>

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

        <div className={styles.submitBtn}>
          <button type="submit">Continue</button>
        </div>
      </form>
    </div>
  );
}

export default Setup;
