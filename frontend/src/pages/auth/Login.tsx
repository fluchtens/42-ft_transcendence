import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./Auth.module.scss";
import { userLoginApi } from "../../services/auth.api";
import { MainTitle } from "../../components/MainTitle";
import { notifySuccess } from "../../utils/notifications";
import { useAuth } from "../../utils/useAuth";

function Login() {
  const { user, refreshUser } = useAuth();
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
    const data = await userLoginApi(user);
    if (!data.success) {
      setErrorMessage(data.message);
      return;
    }

    if (data.twoFa) {
      navigate("/login/twofa");
    } else {
      navigate("/");
      notifySuccess(data.message);
    }

    await refreshUser();
  };

  const fortyTwoAuth = async () => {
    try {
      window.location.href = `${import.meta.env.VITE_BACK_URL}/auth/42`;
    } catch (error) {
      console.error(error);
    }
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
        <h1>Sign in to your account</h1>
        {errorMessage && (
          <div className={styles.error}>
            <p>
              {Array.isArray(errorMessage) ? errorMessage[0] : errorMessage}
            </p>
          </div>
        )}
        <div className={styles.input}>
          <label>Username :</label>
          <input
            type="text"
            value={username}
            onChange={changeUsername}
            placeholder="Enter a username"
            required
          />
        </div>
        <div className={styles.input}>
          <label>Password :</label>
          <input
            type="password"
            value={password}
            onChange={changePassword}
            placeholder="Enter a password"
            required
          />
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
