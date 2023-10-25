import { useEffect, useState } from "react";
import {
  getUserAvatar,
  getUser,
  postUserAvatar,
} from "../../services/user.api";
import { useNavigate } from "react-router-dom";
import { Notify, notifySuccess, notifyError } from "../../utils/notifications";
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
    if (data) {
      data.success ? notifySuccess(data.message) : notifyError(data.message);
    }
  };

  const generateTwoFa = async () => {
    try {
      const apiUrl: string = `${import.meta.env.VITE_BACK_URL}/auth`;
      const response = await fetch(`${apiUrl}/2fa/generate`, {
        method: "GET",
        credentials: "include",
      });

      const data = await response.json();
      if (!response.ok) {
        console.log(data.message);
        notifyError(data.message);
      }
      console.log("secret", data.secret);
      console.log("otpAuthUrl", data.otpAuthUrl);
      console.log("qrcode", data.qrcode);
      notifySuccess(data.message);
    } catch (error) {
      console.error(error);
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

      <span>Public profile</span>

      {avatar ? <img src={avatar} /> : <img src={defaultAvatar} />}
      <input type="file" onChange={avatarSelection} />

      <button className={styles.saveButton} onClick={submitChanges}>
        Save Changes
      </button>

      <span>Password and authentication</span>
      <button className={styles.saveButton} onClick={generateTwoFa}>
        Enable two-factor authentication
      </button>

      <Notify />
    </div>
  );
}
