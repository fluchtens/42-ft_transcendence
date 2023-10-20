import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MainLink } from "../../components/MainLink";
import { NavLink } from "../../components/NavLink";
import { ProfileBtn } from "../../components/ProfileBtn";
import { User } from "../../types/user.interface";
import { getUserProfile } from "../../services/user.api";
import { AiFillHome } from "react-icons/ai";
import { IoGameController } from "react-icons/io5";
import { BsFillChatDotsFill } from "react-icons/bs";
import styles from "./Header.module.scss";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  const handleLogout = async () => {
    setUser(null);
  };

  useEffect(() => {
    const getUser = async () => {
      const data = await getUserProfile();
      if (data) {
        if (data.fortyTwoId) {
          navigate("/setup");
          return;
        }
        setUser(data);
        console.log(data);
      }
    };
    getUser();
  }, []);

  return (
    <nav className={styles.navBar}>
      <ul className={styles.navList}>
        <li>
          <MainLink />
        </li>
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
  );
}
