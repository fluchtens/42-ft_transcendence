import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getUser,
  getUserAvatar,
  postUserAvatar,
  postUsername,
} from "../../services/user.api";
import { User } from "../../types/user.interface";
import { notifyError, notifySuccess } from "../../utils/notifications";
import { Separator } from "../../components/Separator";
import defaultAvatar from "/default_avatar.png";
import styles from "./SettingsCategory.module.scss";
import {
  disableUserTwoFa,
  generateUserTwoFaQrCode,
} from "../../services/auth.api";

const ProfileSettings = () => {
  const [user, setUser] = useState<User | null>(null);
  const [avatar, setAvatar] = useState<string>("");
  const [username, setUsername] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const navigate = useNavigate();

  const changeUsername = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUsername(e.target.value);
  };

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

  const submitData = async (e: React.FormEvent) => {
    e.preventDefault();

    if (username && user?.username !== username) {
      const { success, message } = await postUsername(username);
      const formatMessage = Array.isArray(message) ? message[0] : message;
      success ? notifySuccess(message) : notifyError(formatMessage);
    }

    if (file) {
      const { success, message } = await postUserAvatar(file);
      success ? notifySuccess(message) : notifyError(message);
    }

    getUserData();
  };

  const getUserData = async () => {
    const data = await getUser();
    if (!data) {
      navigate("/");
      return;
    }
    setUser(data);
    setUsername(data.username);
    setAvatar(getUserAvatar(data.avatar));
  };

  useEffect(() => {
    getUserData();
  }, []);

  return (
    <>
      {user && (
        <form className={styles.profileSettings}>
          <div className={styles.dataToSubmit}>
            <div className={styles.inputText}>
              <label>Username</label>
              <input
                type="text"
                value={username}
                onChange={changeUsername}
                placeholder="Enter a username"
                required
              />
            </div>
            <div className={styles.inputFile}>
              <label>Profile picture</label>
              {avatar ? <img src={avatar} /> : <img src={defaultAvatar} />}
              <label className={styles.chooseFile}>
                <input type="file" onChange={avatarSelection} />
                Edit
              </label>
            </div>
          </div>
          <Separator />
          <button onClick={submitData}>Update profile</button>
        </form>
      )}
    </>
  );
};

const AuthSettings = () => {
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  const submitData = async (e: React.FormEvent) => {
    e.preventDefault();

    getUserData();
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
  };

  useEffect(() => {
    getUserData();
  }, []);

  return (
    <>
      {user && (
        <form className={styles.authSettings}>
          <div className={styles.changePassword}>
            <h2>Change password</h2>
            {/* <Separator /> */}
            <div className={styles.inputText}>
              <label>Old password</label>
              <input
                type="text"
                // value={username}
                // onChange={changeUsername}
                placeholder=""
                required
              />
            </div>

            <div className={styles.inputText}>
              <label>New password</label>
              <input
                type="text"
                // value={username}
                // onChange={changeUsername}
                placeholder=""
                required
              />
            </div>

            <div className={styles.inputText}>
              <label>Confirm new password</label>
              <input
                type="text"
                // value={username}
                // onChange={changeUsername}
                placeholder=""
                required
              />
            </div>
            <button onClick={submitData}>Update password</button>
          </div>
          <div className={styles.twoFaAuth}>
            <h2>Two-factor authentication</h2>
            {user.twoFa ? (
              <>
                <button className={styles.saveButton} onClick={disableTwoFa}>
                  Disable two-factor authentication
                </button>
              </>
            ) : (
              <>
                <h3>Two-factor authentication is not enabled yet.</h3>
                <p>
                  Two-factor authentication adds an additional layer of security
                  to your account by requiring more than just a password to sign
                  in.
                </p>
                <button className={styles.saveButton} onClick={enableTwoFa}>
                  Enable two-factor authentication
                </button>
              </>
            )}
          </div>
        </form>
      )}
    </>
  );
};

export { ProfileSettings, AuthSettings };
