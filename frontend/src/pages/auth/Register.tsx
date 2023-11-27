import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import styles from "./Auth.module.scss";
import { userRegistrationApi } from "../../services/auth.api";
import { MainTitle } from "../../components/MainTitle";
import { notifySuccess } from "../../utils/notifications";
import { useAuth } from "../../hooks/useAuth";

function Register() {
  const { user } = useAuth();
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
    const data = await userRegistrationApi(user);
    if (!data.success) {
      setErrorMessage(data.message);
      return;
    }

    navigate("/login");
    notifySuccess(data.message);
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
        <h1>Register a new account</h1>
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
        <div className={styles.buttons}>
          <button className={styles.submitBtn} type="submit">
            Sign up
          </button>
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
