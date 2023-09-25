import { useEffect, useState } from "react";
import { getUserList } from "../services/user";
import { User } from "../utils/user.interface";
import noImageLogo from "/no_image.png";

function Leaderboard() {
  const [userList, setUserList] = useState<User[]>();

  useEffect(() => {
    async function fetchData() {
      try {
        const response: User[] = await getUserList();
        setUserList(response);
      } catch (error) {
        console.error("Data recovery error:", error);
      }
    }
    fetchData();
  }, []);

  return (
    <div className="p-[2rem]">
      <div className="bg-lsecondary dark:bg-dsecondary rounded-2xl shadow-lg pt-5 p-[2rem]">
        <h1 className="text-3xl font-medium text-center mb-5">Leaderboard</h1>
        <ul>
          {userList ? (
            userList.map((user) => (
              <li className="border-b flex items-center justify-between w-full h-[3rem] mb-3">
                <div className="flex items-center">
                  <div className="pl-5 text-3xl">{user.id}</div>
                  <img
                    src={noImageLogo}
                    className="rounded-full shadow-lg w-[2.5rem] h-[2.5rem] ml-5"
                  />
                </div>
                <div className="">{user.userName}</div>
                <div className="pr-5">42</div>
              </li>
            ))
          ) : (
            <li>Data recovery error...</li>
          )}
        </ul>
      </div>
    </div>
  );
}

export default Leaderboard;
