import { useLocation, Link } from "react-router-dom"
import pongLogo from '/pong_logo.png'

function Header() {
  const { pathname } = useLocation()

  return (
    <>
      <header className="bg-secondary border-b border-quaternary">
        <nav className="p-3 container mx-auto flex max-w-screen-xl justify-between">
          <div className="flex gap-3 items-center text-lg font-medium">
            <img src={pongLogo} className="h-10 w-10"/>
            <Link to={'/'}>ft_transcendence</Link>
          </div>
          <div className="flex gap-4 items-center">
            <div className={pathname === "/" ? "text-quaternary" : ""}>
              <Link to={'/'}>Home</Link>
            </div>
            <div className={pathname === "/game" ? "text-quaternary" : ""}>
              <Link to={'/game'}>Game</Link>
            </div>
            <div className={pathname === "/leaderboard" ? "text-quaternary" : ""}>
              <Link to={'/leaderboard'}>Leaderboard</Link>
            </div>
            <div className="text-white font-medium">
              <Link to={'/login'}>
               <button className="px-2.5 py-1.5 rounded-md bg-quinary hover:bg-quaternary">Sign in</button>
              </Link>
            </div>
          </div>
        </nav>
      </header>
    </>
  )
}

export default Header
