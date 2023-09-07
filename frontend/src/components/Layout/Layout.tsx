import { Outlet, useLocation } from "react-router-dom";
import Home from '../../pages/Home'
import Footer from './Footer'
import Header from './Header'

function Layout() {
  const { pathname } = useLocation()
  console.log(pathname);

  return (
    <>
      {pathname !== "/login" && <Header />}
      {pathname === "/" ? <Home /> : <Outlet />}
      {pathname !== "/login" && <Footer />}
    </>
  )
}

export default Layout
