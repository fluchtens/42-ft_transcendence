import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GiPingPongBat } from "react-icons/gi";
import styles from "./Auth.module.scss";
import { registerUser } from "../../services/auth.api";
import { getUserProfile } from "../../services/user.api";

function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const navigate = useNavigate();

  const changeUsername = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const changePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const submitData = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = { username, password };
    const data = await registerUser(user);
    if (data.success) {
      navigate("/login");
    } else {
      setErrorMessage(data.message);
    }
  };

  useEffect(() => {
    const checkAuth = async () => {
      const data = await getUserProfile();
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
        <h1>Register a new account</h1>

        {errorMessage && (
          <div className={styles.error}>
            <p>
              {Array.isArray(errorMessage) ? errorMessage[0] : errorMessage}
            </p>
          </div>
        )}

        <div className={styles.input}>
          <label htmlFor="username">Username :</label>
          <input
            type="text"
            id="username"
            value={username}
            onChange={changeUsername}
            placeholder="Enter a username"
            required
          />
        </div>

        <div className={styles.input}>
          <label htmlFor="password">Password :</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={changePassword}
            placeholder="Enter a password"
            required
          />
        </div>

        <div className={styles.submitBtn}>
          <button type="submit">Sign up</button>
        </div>

        <p className={styles.help}>
          <span>Have an account?</span>
          <Link to={"/login"} className={styles.link}>
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Register;
