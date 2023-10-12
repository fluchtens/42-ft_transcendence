import { Outlet, useLocation } from "react-router-dom";
import Home from "../pages/Home";
import Footer from "./Footer";
import Header from "./Header";
import styles from "./Layout.module.scss";

function Layout() {
  const { pathname } = useLocation();

  return (
    <div className={styles.container}>
      <header>
        {pathname !== "/login" && pathname !== "/register" && <Header />}
      </header>
      <main>{pathname === "/" ? <Home /> : <Outlet />}</main>
      <footer>
        {pathname !== "/login" && pathname !== "/register" && <Footer />}
      </footer>
    </div>
  );
}

export default Layout;
