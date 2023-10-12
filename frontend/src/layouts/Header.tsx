import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AiFillHome } from "react-icons/ai";
import { IoGameController } from "react-icons/io5";
import { GiPingPongBat } from "react-icons/gi";
import { MdLeaderboard } from "react-icons/md";
import { BsFillChatDotsFill } from "react-icons/bs";
import styles from "./Header.module.scss";
import { getUserProfile } from "../services/user.api";
import { NavLink } from "../components/NavLink";
import { getAccessToken } from "../utils/getAccessToken";
import { User } from "../types/user.interface";

function Header() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userData, setUserData] = useState<User | null>(null);

  const handleLogin = async () => {
    const accessToken = getAccessToken();
    if (!accessToken) {
      return;
    }

    const data = await getUserProfile(accessToken);
    if (data) {
      setIsAuthenticated(true);
      setUserData(data);
    }
  };

  const handleLogout = () => {
    sessionStorage.removeItem("access_token");
    localStorage.removeItem("access_token");
    setIsAuthenticated(false);
  };

  useEffect(() => {
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
          <NavLink
            path="/leaderboard"
            text="Leaderboard"
            icon={<MdLeaderboard />}
          />
          <li>
            {isAuthenticated && userData ? (
              <button onClick={handleLogout} className={styles.logoutButton}>
                Sign out
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
