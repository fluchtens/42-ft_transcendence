import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MainNavLink } from "./MainNavLink";
import { NavLink } from "./NavLink";
import { ProfileBtn } from "./ProfileBtn";
import { AiFillHome } from "react-icons/ai";
import { IoGameController } from "react-icons/io5";
import { BsFillChatDotsFill } from "react-icons/bs";
import styles from "./Header.module.scss";
import { useAuth } from "../../utils/useAuth";

export default function Header() {
  const { user, refreshUser } = useAuth();
  const [navMenu, setNavMenu] = useState<boolean>(false);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(Boolean(user));

  const toggleNavMenu = () => {
    setNavMenu(!navMenu);
  };

  const handleLogout = async () => {
    await refreshUser();
    setIsLoggedIn(false);
    window.location.reload();
  };

  useEffect(() => {
    setIsLoggedIn(Boolean(user));
  }, [user]);

  return (
    <header>
      <nav className={styles.navBar}>
        <div className={styles.links}>
          <MainNavLink toggleNavMenu={toggleNavMenu} />
          <ul className={`${navMenu ? styles.navListMenu : styles.navList}`}>
            <li>
              <NavLink path="/" text="HOME" icon={<AiFillHome />} />
            </li>
            <li>
              <NavLink path="/game" text="GAME" icon={<IoGameController />} />
            </li>
            <li>
              <NavLink path="/chat" text="CHAT" icon={<BsFillChatDotsFill />} />
            </li>
          </ul>
        </div>
        {user && isLoggedIn ? (
          <ProfileBtn
            username={user.username}
            avatar={user.avatar}
            onLogout={handleLogout}
          />
        ) : (
          <Link to="/login" className={styles.loginButton}>
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
