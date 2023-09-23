import { Link } from 'react-router-dom'
import { useState } from "react";
import { GiPingPongBat } from "react-icons/gi";
import { createUser } from "../../services/user";
import { User } from "../../utils/user.interface";

function SignIn() {
  const [username, setUsername] = useState('');

  const handleFormSubmit = async (e: any) => {
    e.preventDefault();

    const userData: User = {
      userName: username,
      imageUrl: "uneImageDeFou"
    };

    try {
      await createUser(userData);
    } catch (error) {
      console.error("Create user request error:", error);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center mx-auto p-5 md:h-screen">
      <div className="flex items-center mb-4">
        <GiPingPongBat className="w-8 h-8 mr-2.5 md:w-9 md:h-9"/>
        <Link to={'/'} className="text-2xl font-semibold md:text-3xl">ft_transcendence</Link>
      </div>

      <div className="bg-lsecondary dark:bg-dsecondary rounded-2xl shadow-lg w-full p-5 space-y-3 md:max-w-md md:p-8">
        <h1 className="text-xl font-bold md:text-2xl">Sign in to your account</h1>

        <form onSubmit={handleFormSubmit} className="space-y-3 md:space-y-6" action="#">
          <div>
            <label htmlFor="username" className="block mb-2 text-sm font-medium">Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="fluchten" className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg w-full p-2.5 md:text-sm" required/>
          </div>

          <div>
            <label htmlFor="password" className="block mb-2 text-sm font-medium">Password</label>
            <input type="password" placeholder="••••••••" className="bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg w-full p-2.5 md:text-sm" required/>
          </div>

          <button type="submit" className="text-white bg-ltertiary hover:bg-lquaternary rounded-lg text-sm font-medium w-full p-2.5">Sign in</button>
        </form>

        <button className="text-white bg-[#00babc] hover:bg-[#33c8c9] border border-gray-500 rounded-lg text-sm font-medium w-full p-2.5">Sign in with 42</button>

        <div className="flex text-sm">
          <p className="font-light text-gray-500 dark:text-gray-400 mr-1">Don’t have an account yet?</p>
          <Link to={'/signup'} className="font-medium text-gray-500 dark:text-gray-400 hover:underline">Sign up</Link>
        </div>
      </div>
    </div>
  );
}

export default SignIn
