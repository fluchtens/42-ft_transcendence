import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getUserByUsernameApi, getUserHistoryApi, getUserStatsApi } from "../../services/user.api";
import { Game, Stats } from "../../types/game.interface";
import { User } from "../../types/user.interface";
import { UserDetails } from "./UserDetails";
import { UserHistory } from "./UserHistory";

function Profile() {
  const { user } = useAuth();
  const { username } = useParams();
  const navigate = useNavigate();
  const [targetUser, setTargetUser] = useState<User | null | undefined>();
  const [stats, setStats] = useState<Stats | null>(null);
  const [history, setHistory] = useState<Game[] | null>(null);

  const fetchData = async () => {
    if (!username) {
      return;
    }

    const userData = await getUserByUsernameApi(username);
    if (!userData) {
      setTargetUser(null);
      return;
    }
    setTargetUser(userData);

    const userStats = await getUserStatsApi(userData.id);
    if (userStats) {
      setStats(userStats);
    }

    const userHistory = await getUserHistoryApi(userData.id);
    if (userHistory) {
      setHistory(userHistory);
    }
  };

  useEffect(() => {
    if (user === null) {
      return;
    }

    fetchData();
  }, [user, username]);

  if (targetUser === null) {
    navigate("/");
  }

  return (
    <>
      {user && targetUser && stats && history && (
        <div className="m-auto max-w-screen-lg">
          <UserDetails targetUser={targetUser} stats={stats} />
          <UserHistory history={history} />
        </div>
      )}
    </>
  );
}

export default Profile;
