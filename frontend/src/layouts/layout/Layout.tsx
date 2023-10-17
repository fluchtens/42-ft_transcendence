import { Outlet, useLocation } from "react-router-dom";
import Home from "../../pages/Home";
import Footer from "../footer/Footer";
import Header from "../header/Header";
import styles from "./Layout.module.scss";

function Layout() {
  const { pathname } = useLocation();

  const isHomePage = (path: string) => {
    return path === "/";
  };

  const isAuthPage = (path: string) => {
    return ["/login", "/register", "/setup"].includes(path);
  };

  return (
    <div className={styles.container}>
      <header>{!isAuthPage(pathname) && <Header />}</header>
      <main>{isHomePage(pathname) ? <Home /> : <Outlet />}</main>
      <footer>{!isAuthPage(pathname) && <Footer />}</footer>
    </div>
  );
}

export default Layout;
