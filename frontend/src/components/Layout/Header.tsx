import { useLocation, Link } from "react-router-dom"
import pongLogo from '/pong_logo.png'

function Header() {
  const { pathname } = useLocation()

  return (
    <>
      <header className="bg-secondary shadow-lg">
        <nav className="px-6 py-3 flex items-center justify-between">

          <div>
            <img src={pongLogo} className="hidden md:w-10 md:h-10 md:inline md:mr-4"/>
            <Link to={'/'} className="text-lg font-medium">ft_transcendence</Link>
          </div>

          <ul className="hidden md:font-medium md:flex md:items-center md:gap-4">
            <li className={pathname === "/" ? "text-tertiary" : ""}>
              <Link to={'/'} className="hover:text-tertiary">Home</Link>
            </li>
            <li className={pathname === "/game" ? "text-tertiary" : ""}>
              <Link to={'/game'} className="hover:text-tertiary">Game</Link>
            </li>
            <li className={pathname === "/leaderboard" ? "text-tertiary" : ""}>
              <Link to={'/leaderboard'} className="hover:text-tertiary">Leaderboard</Link>
            </li>
            <li className="text-white">
              <Link to={'/login'}>
                <button className="px-2.5 py-1.5 rounded-md bg-quaternary hover:bg-tertiary">Sign in</button>
              </Link>
            </li>
          </ul>

        </nav>
      </header>
    </>
  )
}

export default Header
