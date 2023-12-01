import styles from "./UnlockUser.module.scss";
import { Separator } from "../../components/Separator";
import { useAuth } from "../../hooks/useAuth";
import { IoPersonRemoveSharp } from "react-icons/io5";
import { useState } from "react";
import { getUserByUsernameApi } from "../../services/user.api";
import { notifyError, notifySuccess } from "../../utils/notifications";
import { unlockUserApi } from "../../services/friendship.api";

interface UnlockUserBarProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const UnlockUserBar = ({ value, onChange, onSubmit }: UnlockUserBarProps) => (
  <form className={styles.unlockUserBar} onSubmit={onSubmit}>
    <input type="text" value={value} onChange={onChange} required />
    <button type="submit">
      <IoPersonRemoveSharp className={styles.icon} />
    </button>
  </form>
);

function UnlockUser() {
  const [target, setTarget] = useState<string>("");
  const { user } = useAuth();

  const changeTarget = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTarget(e.target.value);
  };

  const submitData = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!target) return;

    const userData = await getUserByUsernameApi(target);
    if (!userData) {
      notifyError("User not found");
      setTarget("");
      return;
    }

    const { success, message } = await unlockUserApi(userData.id);
    success ? notifySuccess(message) : notifyError(message);
    setTarget("");
  };

  return (
    <>
      {user && (
        <div className={styles.container}>
          <h1>Blocked users</h1>
          <Separator />
          <div className={styles.dataToSubmit}>
            <h2>Unlock a user.</h2>
            <p>
              By unblocking a user, you'll be able to communicate with them
              again.
            </p>
            <UnlockUserBar
              value={target}
              onChange={changeTarget}
              onSubmit={submitData}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default UnlockUser;
