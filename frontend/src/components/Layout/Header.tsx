import { useLocation, Link } from "react-router-dom"
import pongLogo from '/pong_logo.png'

function Header() {
  const { pathname } = useLocation()

  return (
    <>
      <header className="bg-secondary border-b border-quaternary">
        <nav className="px-6 py-3 flex items-center justify-between max-w-screen-xl mx-auto">
          <div>
            <img src={pongLogo} className="hidden md:w-10 md:h-10 md:inline md:mr-4"/>
            <Link to={'/'} className="text-lg font-medium">ft_transcendence</Link>
          </div>
          <ul className="hidden md:flex md:items-center md:gap-4">
            <li className={pathname === "/" ? "text-quaternary" : ""}>
              <Link to={'/'} className="hover:text-quaternary">Home</Link>
            </li>
            <li className={pathname === "/game" ? "text-quaternary" : ""}>
              <Link to={'/game'} className="hover:text-quaternary">Game</Link>
            </li>
            <li className={pathname === "/leaderboard" ? "text-quaternary" : ""}>
              <Link to={'/leaderboard'} className="hover:text-quaternary">Leaderboard</Link>
            </li>
            <li className="text-white font-medium">
              <Link to={'/login'}>
                <button className="px-2.5 py-1.5 rounded-md bg-quinary hover:bg-quaternary">Sign in</button>
              </Link>
            </li>
          </ul>
        </nav>
      </header>
    </>
  )
}

export default Header
