import { Outlet, useLocation } from "react-router-dom";
import Home from "../pages/home/Home";
import Header from "./Header";
import styles from "./Layout.module.scss";
import { Notify } from "../utils/notifications";

function Layout() {
  const { pathname } = useLocation();

  const isHomePage = (path: string) => {
    return path === "/";
  };

  const isAuthPage = (path: string) => {
    return ["/login", "/login/twofa", "/register", "/register/setup"].includes(
      path
    );
  };

  return (
    <div className={styles.container}>
      {!isAuthPage(pathname) && <Header />}
      <main>{isHomePage(pathname) ? <Home /> : <Outlet />}</main>
      <Notify />
    </div>
  );
}

export default Layout;
