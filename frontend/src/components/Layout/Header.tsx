import { useLocation, Link } from 'react-router-dom'
import { AiFillHome } from 'react-icons/ai';
import { IoGameController } from 'react-icons/io5';
import { GiPingPongBat } from "react-icons/gi";
import { MdLeaderboard } from "react-icons/md";

function Header() {
  const { pathname } = useLocation()

  return (
    <>
      <header className="bg-secondary shadow-lg">
        <nav className="flex items-center justify-between px-6 py-3">
      
          <div className="flex items-center">
            <GiPingPongBat className="hidden md:w-7 md:h-7 md:inline md:mr-2.5"/>
            <Link to={'/'} className="text-lg font-medium">ft_transcendence</Link>
          </div>

          <ul className="hidden md:uppercase md:font-medium md:flex md:items-center md:gap-4">
            <li className={pathname === "/" ? "text-tertiary flex items-center" : "flex items-center"}>
              <AiFillHome className="w-5 h-5 mr-1.5 mb-0.5" />
              <Link to={'/'} className="hover:text-tertiary">Home</Link>
            </li>

            <li className={pathname === "/game" ? "text-tertiary flex items-center" : "flex items-center"}>
              <IoGameController className="w-5 h-5 mr-1.5 mb-0.5" />
              <Link to={'/game'} className="hover:text-tertiary">Game</Link>
            </li>

            <li className={pathname === "/leaderboard" ? "text-tertiary flex items-center" : "flex items-center"}>
              <MdLeaderboard className="w-5 h-5 mr-1.5 mb-0.5" />
              <Link to={'/leaderboard'} className="hover:text-tertiary">Leaderboard</Link>
            </li>

            <li className="text-white">
              <Link to={'/login'}>
                <button className="uppercase rounded-md bg-quaternary hover:bg-tertiary px-2.5 py-1.5">Sign in</button>
              </Link>
            </li>
          </ul>

        </nav>
      </header>
    </>
  )
}

export default Header
