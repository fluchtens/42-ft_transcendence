import { useEffect, useState } from "react";
import {
  getUserAvatar,
  getUser,
  postUserAvatar,
} from "../../services/user.api";
import { useNavigate } from "react-router-dom";
import defaultAvatar from "/default_avatar.png";
import styles from "./Settings.module.scss";

export default function Settings() {
  const [avatar, setAvatar] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const navigate = useNavigate();

  const avatarSelection = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files && e.target.files[0];

    if (selectedFile) {
      setFile(selectedFile);
      const reader = new FileReader();
      reader.onloadend = () => {
        if (reader.result) {
          setAvatar(reader.result as string);
        }
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const uploadAvatar = async () => {
    const data = await postUserAvatar(file);
    if (!data) {
      console.log("error");
    }
  };

  const submitChanges = async () => {
    uploadAvatar();
  };

  useEffect(() => {
    const getUserData = async () => {
      const data = await getUser();
      if (!data) {
        navigate("/");
        return;
      }
      setAvatar(getUserAvatar(data.avatar));
    };
    getUserData();
  }, []);

  return (
    <div className={styles.container}>
      <h1>User settings</h1>

      {avatar ? <img src={avatar} /> : <img src={defaultAvatar} />}
      <input type="file" onChange={avatarSelection} />

      <button className={styles.saveButton} onClick={submitChanges}>
        Save Changes
      </button>
    </div>
  );
}
