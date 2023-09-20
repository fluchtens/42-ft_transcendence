import { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom'
import { AiFillHome, AiOutlineMenu } from 'react-icons/ai';
import { IoGameController } from 'react-icons/io5';
import { GiPingPongBat } from "react-icons/gi";
import { MdLeaderboard, MdOutlineDarkMode, MdDarkMode } from "react-icons/md";

function Header() {
  const { pathname } = useLocation()
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState("light");

  const toggleMenu = () => {
    setIsMenuOpen(isMenuOpen == false);
  };

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  };

  const createLinkButton = (path: string, text: string, icon: any) => (
    <li className={`hover:text-tertiary ${pathname === path ? "text-tertiary" : ""}`}>
      <Link to={path} className="flex items-center">
        {icon}
        {text}
      </Link>
    </li>
  );

  return (
    <>
      <header className="bg-lsecondary dark:bg-dsecondary border-b border-gray-200 dark:border-gray-700">
        <nav className="w-full flex flex-wrap items-center justify-between px-6 py-3">
      
          <div className="flex items-center">
            <GiPingPongBat className="w-7 h-7 mr-2.5"/>
            <Link to={'/'} className="text-lg font-medium">ft_transcendence</Link>
          </div>

          <button className="hover:text-white md:hidden"onClick={toggleMenu}>
            <AiOutlineMenu className="w-6 h-6"/>
          </button>

          <ul className={`${!isMenuOpen ? "hidden" : "flex flex-col w-full py-3 gap-2"} uppercase font-medium items-center md:flex md:flex-row md:w-max md:py-0 md:gap-4`}>
            {createLinkButton("/", "Home", <AiFillHome className="w-5 h-5 mr-1.5 mb-0.5"/>)}
            {createLinkButton("/game", "Game", <IoGameController className="w-5 h-5 mr-1.5 mb-0.5"/>)}
            {createLinkButton("/leaderboard", "Leaderboard", <MdLeaderboard className="w-5 h-5 mr-1.5 mb-0.5"/>)}

            <li className="text-white mt-1 md:mt-0">
              <Link to={'/signin'}>
                <button className="uppercase rounded-md bg-quaternary hover:bg-tertiary px-2.5 py-1.5">Sign in</button>
              </Link>
            </li>

            <li>
              <button onClick={toggleTheme} className="flex items-center">
                {theme === "light" ? <MdDarkMode className="w-5 h-5 mb-0.5"/> : <MdOutlineDarkMode className="w-5 h-5 mb-0.5"/>}
              </button>
            </li>
          </ul>

        </nav>
      </header>
    </>
  )
}

export default Header
