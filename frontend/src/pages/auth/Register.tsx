import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { GiPingPongBat } from "react-icons/gi";
import styles from "./Auth.module.scss";
import { registerUser } from "../../services/auth.api";

function Register() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { success, message } = await registerUser(username, password);
    if (success) {
      navigate("/login");
    } else {
      console.error("Error:", message);
    }
  };

  return (
    <div className={styles.container}>
      <Link to="/" className={styles.mainLink}>
        <GiPingPongBat className={styles.mainIcon} />
        ft_transcendence
      </Link>

      <form className={styles.form} onSubmit={handleSubmit}>
        <h1 className={styles.title}>Register a new account</h1>
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
        <button type="submit" className={styles.button}>
          Sign up
        </button>

        <div className={styles.helpContainer}>
          <p className={styles.helpText}>Have an account?</p>
          <Link to={"/login"} className={styles.helpRedirect}>
            Sign in
          </Link>
        </div>
      </form>
    </div>
  );
}

export default Register;
