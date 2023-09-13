import { Outlet, useLocation } from "react-router-dom";
import Home from "../../pages/Home";
import Footer from "./Footer";
import Header from "./Header";

function Layout() {
  const { pathname } = useLocation()
  console.log(pathname);

  return (
    <>
      {pathname !== "/signin" && pathname !== "/signup" && <Header/>}
      {pathname === "/" ? <Home/> : <Outlet/>}
      {pathname !== "/signin" && pathname !== "/signup" && <Footer/>}
    </>
  )
}

export default Layout
