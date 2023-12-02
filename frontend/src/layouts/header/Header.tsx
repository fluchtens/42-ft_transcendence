import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { MainNavLink } from "./MainNavLink";
import { NavLink } from "./NavLink";
import { ProfileBtn } from "./ProfileBtn";
import { AiFillHome } from "react-icons/ai";
import { IoGameController } from "react-icons/io5";
import { BsFillChatDotsFill } from "react-icons/bs";
import styles from "./Header.module.scss";
import { useAuth } from "../../hooks/useAuth";
import { FaUserGroup } from "react-icons/fa6";
import { useFriendshipSocket } from "../../hooks/useFriendshipSocket";
import { MdLeaderboard } from "react-icons/md";

export default function Header() {
  const { user, refreshUser } = useAuth();
  const [navMenu, setNavMenu] = useState<boolean>(false);
  const navMenuRef = useRef<HTMLUListElement>(null);
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(Boolean(user));
  const firendshipSocket = useFriendshipSocket();

  const closeNavMenu = () => {
    setNavMenu(false);
  };

  const toggleNavMenu = () => {
    setNavMenu(!navMenu);
  };

  const handleLogout = async () => {
    await refreshUser();
    setIsLoggedIn(false);
    firendshipSocket.disconnect();
    window.location.reload();
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (navMenuRef.current) {
        if (!navMenuRef.current.contains(e.target as Node)) {
          setNavMenu(false);
        }
      }
    };
    document.addEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    setIsLoggedIn(Boolean(user));
  }, [user]);

  return (
    <header>
      <nav className={styles.navBar}>
        <div className={styles.links}>
          <MainNavLink toggleNavMenu={toggleNavMenu} />
          <ul
            ref={navMenuRef}
            className={`${navMenu ? styles.navListMenu : styles.navList}`}
          >
            <li>
              <NavLink
                path="/"
                text="HOME"
                icon={<AiFillHome />}
                cb={closeNavMenu}
              />
            </li>
            <li>
              <NavLink
                path="/game"
                text="GAME"
                icon={<IoGameController />}
                cb={closeNavMenu}
              />
            </li>
            <li>
              <NavLink
                path="/chat"
                text="CHAT"
                icon={<BsFillChatDotsFill />}
                cb={closeNavMenu}
              />
            </li>
            <li>
              <NavLink
                path="/friends"
                text="FRIENDS"
                icon={<FaUserGroup />}
                cb={closeNavMenu}
              />
            </li>
            <li>
              <NavLink
                path="/leaderboard"
                text="LEADERBOARD"
                icon={<MdLeaderboard />}
                cb={closeNavMenu}
              />
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
