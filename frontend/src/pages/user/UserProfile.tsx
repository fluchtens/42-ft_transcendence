import { useEffect, useState } from "react";
import { getUserByUsername } from "../../services/user.api";
import { useNavigate, useParams } from "react-router-dom";
import { User } from "../../types/user.interface";
import { FaUser, FaUserPlus, FaUserPen } from "react-icons/fa6";
import { PiFootprintsFill } from "react-icons/pi";
import { convertDate } from "../../utils/date";
import defaultAvatar from "/default_avatar.png";
import styles from "./UserProfile.module.scss";

export default function UserProfile() {
  const [user, setUser] = useState<User | null>(null);
  const [file, setFile] = useState(null);
  const avatarUrl = `${import.meta.env.VITE_BACK_URL}/user/avatar`;
  const { username } = useParams();
  const navigate = useNavigate();

  const handleFileChange = (event: any) => {
    setFile(event.target.files[0]);
  };

  const handleUpload = async () => {
    try {
      if (!file) return;
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await fetch("http://localhost:3000/user/avatar", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      const data = await response.json();

      if (response.ok) {
        console.log("Fichier téléchargé avec succès !", data.message);
      } else {
        console.error("Erreur lors du téléchargement du fichier", data.message);
      }
    } catch (error) {
      console.error("Erreur lors du téléchargement du fichier : ", error);
    }
  };

  useEffect(() => {
    const getUser = async () => {
      if (!username) {
        return;
      }
      const data = await getUserByUsername(username);
      if (!data) {
        navigate("/");
        return;
      }
      setUser(data);
    };
    getUser();
  }, []);

  return (
    <div className={styles.container}>
      <div className={styles.user}>
        <div className={styles.header}>
          <FaUser className={styles.icon} />
          <h1>
            [{user?.id}] {user?.username}
          </h1>
        </div>
        <div className={styles.details}>
          {user?.avatar ? (
            <img src={`${avatarUrl}/${user.avatar}`} />
          ) : (
            <img src={defaultAvatar} />
          )}
          <input type="file" onChange={handleFileChange} />
          <button onClick={handleUpload}>Télécharger</button>
          <ul className={styles.dataList}>
            <li className={styles.data}>
              <PiFootprintsFill className={styles.dataIcon} />
              <p className={styles.dataType}>ID</p>
              <p className={styles.dataValue}>{user?.id}</p>
            </li>
            <li className={styles.data}>
              <FaUser className={styles.dataIcon} />
              <p className={styles.dataType}>Username</p>
              <p className={styles.dataValue}>{user?.username}</p>
            </li>
            <li className={styles.data}>
              <FaUserPlus className={styles.dataIcon} />
              <p className={styles.dataType}>Registered</p>
              <p className={styles.dataValue}>{convertDate(user?.createdAt)}</p>
            </li>
            <li className={styles.data}>
              <FaUserPen className={styles.dataIcon} />
              <p className={styles.dataType}>Updated</p>
              <p className={styles.dataValue}>{convertDate(user?.updatedAt)}</p>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
