import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AiFillHome, AiOutlineMenu } from "react-icons/ai";
import { IoGameController } from "react-icons/io5";
import { GiPingPongBat } from "react-icons/gi";
import { MdLeaderboard } from "react-icons/md";
import { BsFillChatDotsFill } from "react-icons/bs";
import styles from "../styles/Header.module.scss";
import { getUserProfile } from "../services/user";

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(isMenuOpen == false);
  };

  useEffect(() => {
    const handleLogin = async () => {
      const accessToken = localStorage.getItem("access_token");
      if (!accessToken) {
        return;
      }
      const data = await getUserProfile(accessToken);
      if (data) {
        setIsAuthenticated(true);
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

        <button className={styles.pagesButton} onClick={toggleMenu}>
          <AiOutlineMenu className={styles.pagesButtonIcon} />
        </button>

        <ul className={!isMenuOpen ? styles.navListClose : styles.navListOpen}>
          <li>
            <Link to="/" className={styles.linkButton}>
              <AiFillHome className={styles.linkButtonIcon} />
              Home
            </Link>
          </li>
          <li>
            <Link to="/game" className={styles.linkButton}>
              <IoGameController className={styles.linkButtonIcon} />
              Game
            </Link>
          </li>
          <li>
            <Link to="/chat" className={styles.linkButton}>
              <BsFillChatDotsFill className={styles.linkButtonIcon} />
              Chat
            </Link>
          </li>
          <li>
            <Link to="/leaderboard" className={styles.linkButton}>
              <MdLeaderboard className={styles.linkButtonIcon} />
              Leaderboard
            </Link>
          </li>
          {!isAuthenticated && (
            <li>
              <Link to="/login" className={styles.loginButton}>
                Sign in
              </Link>
            </li>
          )}
        </ul>
      </nav>
    </>
  );
}

export default Header;
