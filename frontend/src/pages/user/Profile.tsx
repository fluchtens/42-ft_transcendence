import { useEffect, useState } from "react";
import { getUserByUsernameApi } from "../../services/user.api";
import { useNavigate, useParams } from "react-router-dom";
import { User } from "../../types/user.interface";
import { FaUser, FaUserPlus, FaUserPen } from "react-icons/fa6";
import { PiFootprintsFill } from "react-icons/pi";
import { convertDate } from "../../utils/date";
import defaultAvatar from "/default_avatar.png";
import styles from "./Profile.module.scss";

export default function Profile() {
  const [user, setUser] = useState<User | null>(null);
  const { username } = useParams();
  const navigate = useNavigate();

  useEffect(() => {
    const getUser = async () => {
      if (!username) {
        return;
      }
      const data = await getUserByUsernameApi(username);
      if (!data) {
        navigate("/");
        return;
      }
      setUser(data);
    };
    getUser();
  }, [username]);

  return (
    <>
      {user && (
        <div className={styles.container}>
          <div className={styles.user}>
            <div className={styles.header}>
              <FaUser className={styles.icon} />
              <h1>Profile</h1>
            </div>
            <div className={styles.details}>
              {user.avatar ? (
                <img src={user.avatar} />
              ) : (
                <img src={defaultAvatar} />
              )}
              <ul className={styles.dataList}>
                <li className={styles.data}>
                  <PiFootprintsFill className={styles.dataIcon} />
                  <p className={styles.dataType}>ID</p>
                  <p className={styles.dataValue}>{user.id}</p>
                </li>
                <li className={styles.data}>
                  <FaUser className={styles.dataIcon} />
                  <p className={styles.dataType}>Username</p>
                  <p className={styles.dataValue}>{user.username}</p>
                </li>
                <li className={styles.data}>
                  <FaUserPlus className={styles.dataIcon} />
                  <p className={styles.dataType}>Registered</p>
                  <p className={styles.dataValue}>
                    {convertDate(user.createdAt)}
                  </p>
                </li>
                <li className={styles.data}>
                  <FaUserPen className={styles.dataIcon} />
                  <p className={styles.dataType}>Updated</p>
                  <p className={styles.dataValue}>
                    {convertDate(user.updatedAt)}
                  </p>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
