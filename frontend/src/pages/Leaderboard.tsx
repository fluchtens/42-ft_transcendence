import { useEffect, useState } from "react";
import { getUserList } from "../api/user";
import { User } from "../interfaces/user";
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
		<>
			<div className="py-[2rem] flex items-center justify-center">
				<h1 className="text-5xl font-medium">Leaderboard</h1>
			</div>

      <div className="bg-primary px-[5rem]">
        <div className="bg-secondary rounded-lg shadow-lg p-[3rem]">
          <ul>
            {userList ? (
              userList.map((user) => (
                <li className="bg-primary rounded-lg shadow-lg flex items-center justify-between w-full h-[4rem] mb-3">
                  <div className="flex items-center">
                    <div className="pl-5 text-3xl">{user.id}</div>
                    <img src={noImageLogo} className="rounded-full shadow-lg w-[2.5rem] h-[2.5rem] ml-5"/>
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
		</>
	)
}

export default Leaderboard
