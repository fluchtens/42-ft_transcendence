import { Outlet, useLocation } from "react-router-dom";
import Home from "../../pages/home/Home";
import Header from "../header/Header";
import Friends from "../friends/Friends";
import Channels from "../channels/Channels";
import { Notify } from "../../utils/notifications";
import styles from "./Layout.module.scss";

function Layout() {
  const { pathname } = useLocation();

  const isHomePage = (path: string) => {
    return path === "/";
  };

  const isAuthPage = (path: string) => {
    const authPages = ["/login", "/register"];

    return authPages.some((authPage) => path.startsWith(authPage));
  };

  return (
    <div className={styles.container}>
      {!isAuthPage(pathname) && <Header />}
      <div className={styles.main}>
        {!isAuthPage(pathname) && <Channels />}
        <main>{isHomePage(pathname) ? <Home /> : <Outlet />}</main>
        {!isAuthPage(pathname) && <Friends />}
      </div>
      <Notify />
    </div>
  );
}

export default Layout;
