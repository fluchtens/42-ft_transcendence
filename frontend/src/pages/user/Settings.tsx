import { useEffect, useState } from "react";
import {
  getUserAvatar,
  getUser,
  postUserAvatar,
} from "../../services/user.api";
import { useNavigate } from "react-router-dom";
import { notifySuccess, notifyError } from "../../utils/notifications";
import defaultAvatar from "/default_avatar.png";
import styles from "./Settings.module.scss";
import { User } from "../../types/user.interface";
import {
  disableUserTwoFa,
  generateUserTwoFaQrCode,
} from "../../services/auth.api";

export default function Settings() {
  const [user, setUser] = useState<User | null>(null);
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

  const submitChanges = async () => {
    uploadAvatar();
  };

  const enableTwoFa = async () => {
    const data = await generateUserTwoFaQrCode();
    if (!data.success) {
      notifyError(data.message);
      return;
    }

    if (data.qrcode) {
      const qrCodeBase64 = btoa(data.qrcode);
      navigate(`/settings/twofa/${qrCodeBase64}`);
    }
  };

  const disableTwoFa = async () => {
    const data = await disableUserTwoFa();
    if (!data.success) {
      notifyError(data.message);
      return;
    }

    getUserData();
    notifySuccess(data.message);
  };

  const getUserData = async () => {
    const data = await getUser();
    if (!data) {
      navigate("/");
      return;
    }
    setUser(data);
    setAvatar(getUserAvatar(data.avatar));
  };

  useEffect(() => {
    getUserData();
  }, []);

  return (
    <>
      {user && (
        <div className={styles.container}>
          <h1>User settings</h1>
          <span>Public profile</span>
          {avatar ? <img src={avatar} /> : <img src={defaultAvatar} />}
          <input type="file" onChange={avatarSelection} />
          <button className={styles.saveButton} onClick={submitChanges}>
            Save Changes
          </button>
          <span>Password and authentication</span>
          {user.twoFa ? (
            <button className={styles.saveButton} onClick={disableTwoFa}>
              Disable two-factor authentication
            </button>
          ) : (
            <button className={styles.saveButton} onClick={enableTwoFa}>
              Enable two-factor authentication
            </button>
          )}
        </div>
      )}
    </>
  );
}
