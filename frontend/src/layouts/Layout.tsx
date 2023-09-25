import { Outlet, useLocation } from "react-router-dom";
import Home from "../pages/Home";
import Footer from "./Footer";
import Header from "./Header";

function Layout() {
  const { pathname } = useLocation();
  console.log(pathname);

  return (
    <>
      <div className="flex flex-col min-h-screen">
        {pathname !== "/signin" && pathname !== "/signup" && <Header />}
        <main className="flex-grow">
          {pathname === "/" ? <Home /> : <Outlet />}
        </main>
        {pathname !== "/signin" && pathname !== "/signup" && <Footer />}
      </div>
    </>
  );
}

export default Layout;
