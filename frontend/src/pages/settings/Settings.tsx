import { useEffect, useState } from "react";
import { getUserApi } from "../../services/user.api";
import { useNavigate } from "react-router-dom";
import styles from "./Settings.module.scss";
import { User } from "../../types/user.interface";
import AuthSettings from "./AuthSettings";
import ProfileSettings from "./ProfileSettings";

interface CatBtnProps {
  name: string;
  current: number;
  cat: number;
  onClick: (current: number) => void;
}

const CatBtn = ({ name, current, cat, onClick }: CatBtnProps) => (
  <button
    className={current === cat ? styles.isActive : styles.notActive}
    onClick={() => onClick(cat)}
  >
    {name}
  </button>
);

function Settings() {
  const [category, setCategory] = useState<number>(0);
  const [user, setUser] = useState<User | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getUserData = async () => {
      const data = await getUserApi();
      if (!data) {
        navigate("/");
        return;
      }
      setUser(data);
    };

    getUserData();
  }, []);

  return (
    <>
      {user && (
        <div className={styles.container}>
          <div className={styles.settings}>
            <div className={styles.categories}>
              <CatBtn
                name="Public profile"
                current={category}
                cat={0}
                onClick={setCategory}
              />
              <CatBtn
                name="Password and authentication"
                current={category}
                cat={1}
                onClick={setCategory}
              />
            </div>
            {category === 0 && <ProfileSettings />}
            {category === 1 && <AuthSettings />}
          </div>
        </div>
      )}
    </>
  );
}

export default Settings;
