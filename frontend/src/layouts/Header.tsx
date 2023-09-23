import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom'
import { AiFillHome, AiOutlineMenu } from 'react-icons/ai';
import { IoGameController } from 'react-icons/io5';
import { GiPingPongBat } from 'react-icons/gi';
import { MdLeaderboard, MdOutlineDarkMode, MdDarkMode } from 'react-icons/md';
import { BsFillChatDotsFill } from 'react-icons/bs';
import PageButton from '../components/PageButton'

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [theme, setTheme] = useState("light");

  const toggleMenu = () => {
    setIsMenuOpen(isMenuOpen == false);
  };

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark")
  };

  useEffect(() => {
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  return (
    <>
      <header className="bg-lsecondary dark:bg-dsecondary border-b border-gray-200 dark:border-gray-700">
        <nav className="flex flex-wrap items-center justify-between px-6 py-3">

          <div className="flex items-center">
            <GiPingPongBat className="w-8 h-8 mr-2.5"/>
            <Link to={'/'} className="text-lg font-semibold lg:text-xl">ft_transcendence</Link>
          </div>

          <button className="hover:text-white lg:hidden"onClick={toggleMenu}>
            <AiOutlineMenu className="w-6 h-6"/>
          </button>

          <ul className={`${!isMenuOpen ? "hidden" : "flex flex-col w-full py-3 gap-2"} items-center lg:flex lg:flex-row lg:w-max lg:py-0 lg:gap-4`}>
            <PageButton path="/" text="Home" icon={<AiFillHome className="w-5 h-5 mr-1.5 mb-0.5"/>}/>
            <PageButton path="/game" text="Game" icon={<IoGameController className="w-5 h-5 mr-1.5 mb-0.5"/>}/>
            <PageButton path="/chat" text="Chat" icon={<BsFillChatDotsFill className="w-5 h-5 mr-1.5 mb-0.5"/>}/>
            <PageButton path="/leaderboard" text="Leaderboard" icon={<MdLeaderboard className="w-5 h-5 mr-1.5 mb-0.5"/>}/>
          </ul>

          <ul className={`${!isMenuOpen ? "hidden" : "flex flex-col w-full py-3 gap-2"} items-center lg:flex lg:flex-row lg:w-max lg:py-0 lg:gap-3`}>
            <li>
              <button onClick={toggleTheme} className="flex items-center px-1.5 py-1.5">
                {theme === "light" ? <MdDarkMode className="w-5 h-5"/> : <MdOutlineDarkMode className="w-5 h-5"/>}
              </button>
            </li>

            <li className="text-white font-medium mt-1 lg:mt-0">
              <Link to={'/signin'}>
                <button className="uppercase bg-ltertiary hover:bg-lquaternary rounded-md px-2.5 py-1.5">Sign in</button>
              </Link>
            </li>
          </ul>

        </nav>
      </header>
    </>
  );
}

export default Header
