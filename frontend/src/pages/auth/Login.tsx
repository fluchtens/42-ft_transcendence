import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GiPingPongBat } from "react-icons/gi";
import styles from "./Auth.module.scss";
import { loginUser } from "../../services/auth.api";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const navigate = useNavigate();

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleRememberMeChange = () => {
    setRememberMe(!rememberMe);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const user = { username, password };
    const data = await loginUser(user);
    if (data.success) {
      navigate("/");
    } else {
      setErrorMessage(data.message);
    }
  };

  const handleFortyTwoLogin = async () => {
    try {
      window.location.href = `${import.meta.env.VITE_BACK_URL}/api/auth/42`;
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.mainLink}>
        <GiPingPongBat className={styles.icon} />
        ft_transcendence
      </Link>

      <form className={styles.form} onSubmit={handleSubmit}>
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
            onChange={handleUsernameChange}
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
            onChange={handlePasswordChange}
            placeholder="Enter a password"
            required
          />
        </div>

        <div className={styles.checkbox}>
          <input
            type="checkbox"
            id="rememberMe"
            checked={rememberMe}
            onChange={handleRememberMeChange}
          />
          <label htmlFor="rememberMe">Remember me </label>
        </div>

        <div className={styles.submitBtn}>
          <button type="submit">Sign in</button>
        </div>

        <div className={styles.fortyTwoBtn}>
          <button type="button" onClick={handleFortyTwoLogin}>
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
