import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import winLossRatio from "@/utils/winLossRatio";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { getLeaderboardApi, getUserStatsApi } from "../../services/user.api";
import { User } from "../../types/user.interface";

function Leaderboard() {
  const { user } = useAuth();
  const [users, setUsers] = useState<User[] | null>(null);

  const fetchData = async () => {
    const usersData = await getLeaderboardApi();
    if (!usersData) return;

    const improvedUsersData = await Promise.all(
      usersData.map(async (user: User) => {
        const stats = await getUserStatsApi(user.id);
        if (stats) {
          user.lostMatches = stats.lostMatches;
          user.wonMatches = stats.wonMatches;
          return user;
        }
      })
    );
    setUsers(improvedUsersData as User[]);
    console.log(improvedUsersData);
  };

  useEffect(() => {
    if (user === null) {
      return;
    }
    fetchData();
  }, [user]);

  return (
    <>
      {user && (
        <div className="p-4 md:p-6">
          <div className="">
            <table className="w-full">
              <thead>
                <tr className="text-base font-semibold">
                  <th className="text-left">#</th>
                  <th className="text-left">Player</th>
                  <th className="hidden md:table-cell text-center">Matches</th>
                  <th className="hidden md:table-cell text-center">Won</th>
                  <th className="hidden md:table-cell text-center">Lost</th>
                  <th className="hidden md:table-cell text-center">W/L Ratio</th>
                  <th className="text-right md:text-center">Rating</th>
                </tr>
              </thead>
              <tbody>
                {users?.map((user, index) => (
                  <tr key={index} className={`${index !== users.length - 1 ? "border-b border-opacity-5" : ""} text-base font-normal`}>
                    <td className="py-4 text-left">{index + 1}</td>
                    <td className="py-4 flex items-center gap-1 text-left">
                      <Avatar className="w-16 h-16 rounded-full">
                        <AvatarFallback>{user.username[0].toUpperCase()}</AvatarFallback>
                        {user.avatar && <AvatarImage src={user.avatar} className="object-cover pointer-events-none" />}
                      </Avatar>
                      <Button variant="link" asChild>
                        <Link to={`/user/${user.username}`}>{user.username}</Link>
                      </Button>
                    </td>
                    <td className="hidden md:table-cell text-center">{user.wonMatches + user.lostMatches}</td>
                    <td className="hidden md:table-cell text-center">{user.wonMatches}</td>
                    <td className="hidden md:table-cell text-center">{user.lostMatches}</td>
                    <td className="hidden md:table-cell text-center">{winLossRatio(user.wonMatches, user.lostMatches)}</td>
                    <td className="text-right md:text-center">{user.rating}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}

export default Leaderboard;
