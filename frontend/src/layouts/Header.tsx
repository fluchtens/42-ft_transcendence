import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MainNavLink } from "../components/MainNavLink";
import { NavLink } from "../components/NavLink";
import { ProfileBtn } from "../components/ProfileBtn";
import { User } from "../types/user.interface";
import { getUserApi } from "../services/user.api";
import { AiFillHome } from "react-icons/ai";
import { IoGameController } from "react-icons/io5";
import { BsFillChatDotsFill } from "react-icons/bs";
import styles from "./Header.module.scss";

export default function Header() {
  const [navMenu, setNavMenu] = useState<boolean>(false);
  const [user, setUser] = useState<User | null>(null);

  const toggleNavMenu = () => {
    setNavMenu(!navMenu);
  };

  const handleLogout = async () => {
    setUser(null);
  };

  useEffect(() => {
    const getUserData = async () => {
      const data = await getUserApi();
      if (data) {
        setUser(data);
      }
    };
    getUserData();
  }, []);

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
        {user ? (
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
