import { Outlet, useLocation } from "react-router-dom";
import Home from '../../pages/Home/Home'
import Footer from './Footer/Footer'
import Header from './Header/Header'

function Layout() {
  const { pathname } = useLocation()
  console.log(pathname);

  return (
    <>
      <Header />
      {pathname === "/" ? <Home /> : <Outlet />}
      <Footer />
    </>
  )
}

export default Layout
