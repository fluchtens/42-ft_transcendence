import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { logoutUser } from "../services/auth.api";
import { IoSettings } from "react-icons/io5";
import { FaUser } from "react-icons/fa6";
import { FaSignOutAlt } from "react-icons/fa";
import styles from "./ProfileBtn.module.scss";
import defaultAvatar from "/default_avatar.png";

interface ProfileBtnProps {
  username: string;
  avatar: string;
  onLogout: () => void;
}

export function ProfileBtn({ username, avatar, onLogout }: ProfileBtnProps) {
  const [menu, setMenu] = useState(false);
  const navigate = useNavigate();

  const handleMenu = () => {
    setMenu(!menu);
  };

  const closeMenu = () => {
    setMenu(false);
  };

  const handleLogout = async () => {
    await logoutUser();
    setMenu(false);
    onLogout();
    navigate("/");
  };

  return (
    <div className={styles.container}>
      <button className={styles.button} onClick={handleMenu}>
        {avatar ? <img src={avatar} /> : <img src={defaultAvatar} />}
      </button>
      {menu && (
        <div className={styles.menu}>
          <Link
            to={`/user/${username}`}
            onClick={closeMenu}
            className={styles.link}
          >
            <FaUser className={styles.icon}></FaUser>
            Profile
          </Link>
          <Link to="/" onClick={closeMenu} className={styles.link}>
            <IoSettings className={styles.icon}></IoSettings>
            Settings
          </Link>
          <button className={styles.logoutBtn} onClick={handleLogout}>
            <FaSignOutAlt className={styles.icon}></FaSignOutAlt>
            Sign out
          </button>
        </div>
      )}
    </div>
  );
}
