import { useEffect, useState } from "react";
import { getUserList, User } from "../api/getUserList";

function UserList() {
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
    <div className="flex items-center justify-center">
      <div className="bg-secondary shadow-lg rounded-lg p-[3rem]">
        <h1 className="text-2xl font-medium" >Data response from API</h1><br/>
        <ul className="text-lg">
          {userList ? (
            userList.map((user) => (
              <li>{user.id}. {user.userName}</li>
            ))
          ) : (
            <li>Data recovery error...</li>
          )}
        </ul>
      </div>
    </div>
  );
}

export default UserList
