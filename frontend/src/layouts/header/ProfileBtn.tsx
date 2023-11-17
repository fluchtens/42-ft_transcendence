import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { userLogoutApi } from "../../services/auth.api";
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

const ProfileBtn = ({ username, avatar, onLogout }: ProfileBtnProps) => {
  const [menu, setMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const handleMenu = () => {
    setMenu(!menu);
  };

  const handleLogout = async () => {
    await userLogoutApi();
    setMenu(false);
    onLogout();
    navigate("/");
  };

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current) {
        if (!menuRef.current.contains(e.target as Node)) {
          setMenu(false);
        }
      }
    };
    document.addEventListener("mousedown", handler);
  }, []);

  return (
    <div className={styles.container} ref={menuRef}>
      <button className={styles.userBtn} onClick={handleMenu}>
        <p>{username}</p>
        <div className={styles.avatar}>
          {avatar ? <img src={avatar} /> : <img src={defaultAvatar} />}
        </div>
      </button>
      {menu && (
        <div className={styles.menu}>
          <Link
            to={`/user/${username}`}
            onClick={handleMenu}
            className={styles.link}
          >
            <FaUser className={styles.icon}></FaUser>
            Profile
          </Link>
          <Link to="/settings" onClick={handleMenu} className={styles.link}>
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
};

export { ProfileBtn };
