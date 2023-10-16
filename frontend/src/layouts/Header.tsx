import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AiFillHome } from "react-icons/ai";
import { IoGameController } from "react-icons/io5";
import { GiPingPongBat } from "react-icons/gi";
import { BsFillChatDotsFill } from "react-icons/bs";
import styles from "./Header.module.scss";
import { getUserProfile } from "../services/user.api";
import { NavLink } from "../components/NavLink";
import { User } from "../types/user.interface";
import { logoutUser } from "../services/auth.api";

function Header() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);

  const handleLogout = async () => {
    logoutUser();
    setIsAuthenticated(false);
  };

  useEffect(() => {
    const handleLogin = async () => {
      const data = await getUserProfile();
      if (data) {
        setIsAuthenticated(true);
        setUserData(data);
      }
    };
    handleLogin();
  }, []);

  return (
    <>
      <nav className={styles.nav}>
        <Link to="/" className={styles.mainLink}>
          <GiPingPongBat className={styles.mainIcon} />
          ft_transcendence
        </Link>

        <ul className={styles.navList}>
          <NavLink path="/" text="Home" icon={<AiFillHome />} />
          <NavLink path="/game" text="Game" icon={<IoGameController />} />
          <NavLink path="/chat" text="Chat" icon={<BsFillChatDotsFill />} />
          <li>
            {isAuthenticated && userData ? (
              <button onClick={handleLogout} className={styles.logoutButton}>
                {/* Sign out */}
                {userData.username}
              </button>
            ) : (
              <Link to="/login" className={styles.loginButton}>
                Sign in
              </Link>
            )}
          </li>
        </ul>
      </nav>
    </>
  );
}

export default Header;
