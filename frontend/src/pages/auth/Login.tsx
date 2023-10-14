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
    const data = await loginUser(username, password);
    if (data.success) {
      navigate("/");
      if (rememberMe) {
        localStorage.setItem("access_token", data.token);
      } else {
        sessionStorage.setItem("access_token", data.token);
      }
    } else {
      setErrorMessage(data.message);
      console.error("Error:", data.message);
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
        <GiPingPongBat className={styles.mainIcon} />
        ft_transcendence
      </Link>
      <form className={styles.form} onSubmit={handleSubmit}>
        <h1 className={styles.title}>Sign in to your account</h1>
        {errorMessage && (
          <div className={styles.errorMessage}>{errorMessage}</div>
        )}
        <div>
          <label htmlFor="username" className={styles.label}>
            Username :
          </label>
          <input
            type="text"
            id="username"
            className={styles.textInput}
            value={username}
            onChange={handleUsernameChange}
            placeholder="Username"
            required
          />
        </div>
        <div>
          <label htmlFor="password" className={styles.label}>
            Password :
          </label>
          <input
            type="password"
            id="password"
            className={styles.textInput}
            value={password}
            onChange={handlePasswordChange}
            placeholder="••••••••"
            required
          />
        </div>
        <div>
          <input
            type="checkbox"
            id="rememberMe"
            className={styles.checkboxInput}
            checked={rememberMe}
            onChange={handleRememberMeChange}
          />
          <label htmlFor="rememberMe">Remember me </label>
        </div>
        <button type="submit" className={styles.button}>
          Sign in
        </button>
        <button
          type="button"
          onClick={handleFortyTwoLogin}
          className={styles.fortyTwoLoginBtn}
        >
          Sign in with 42
        </button>
        <div className={styles.helpContainer}>
          <p className={styles.helpText}>Don’t have an account yet?</p>
          <Link to={"/register"} className={styles.helpRedirect}>
            Sign up
          </Link>
        </div>
      </form>
    </div>
  );
}

export default Login;
