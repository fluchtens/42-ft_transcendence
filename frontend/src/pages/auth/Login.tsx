import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GiPingPongBat } from "react-icons/gi";
import styles from "./Auth.module.scss";
import { loginUser } from "../../services/auth.api";
import { getUserProfile } from "../../services/user.api";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const changeUsername = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const changePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const changeRememberStatus = () => {
    setRememberMe(!rememberMe);
  };

  const submitData = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = { username, password };
    const data = await loginUser(user);
    if (data.success) {
      navigate("/");
    } else {
      setErrorMessage(data.message);
    }
  };

  const fortyTwoAuth = async () => {
    try {
      window.location.href = `${import.meta.env.VITE_BACK_URL}/api/auth/42Auth`;
    } catch (error) {
      console.error(error);
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
        <h1>Sign in to your account</h1>

        {errorMessage && (
          <div className={styles.error}>
            <p>{errorMessage}</p>
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

        <div className={styles.checkbox}>
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={changeRememberStatus}
          />
          <label htmlFor="rememberMe">Remember me </label>
        </div>

        <div className={styles.submitBtn}>
          <button type="submit">Sign in</button>
        </div>

        <div className={styles.fortyTwoBtn}>
          <button type="button" onClick={fortyTwoAuth}>
            Sign in with 42
          </button>
        </div>

        <p className={styles.help}>
          <span>Don’t have an account yet?</span>
          <Link to={"/register"} className={styles.link}>
            Sign up
          </Link>
        </p>
      </form>
    </div>
  );
}

export default Login;
