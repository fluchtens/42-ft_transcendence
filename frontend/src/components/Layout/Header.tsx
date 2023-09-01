import { useLocation, Link } from "react-router-dom";

function Header() {
  const { pathname } = useLocation()

  return (
    <>
      <header className="bg-secondary border-b border-quaternary text-white">
        <nav className="p-6 flex items-center justify-between">
          <div className="flex gap-3">
            <a href="/" className="font-semibold">ft_transcendence</a>
          </div>
          <div className="flex gap-4">
            <div className={pathname === "/" ? "text-quaternary" : "text-white"}>
              <Link to={'/'}>Home</Link>
            </div>
            <div className={pathname === "/about" ? "text-quaternary" : "text-white"}>
              <Link to={'/about'}>About</Link>
            </div>
            <div className={pathname === "/login" ? "text-quaternary" : "text-white"}>
              <Link to={'/login'}>Login</Link>
            </div>
          </div>
        </nav>
      </header>
    </>
  )
}

export default Header
