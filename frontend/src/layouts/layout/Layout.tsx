import { Outlet, useLocation, useNavigate } from "react-router-dom";
import Home from "../../pages/home/Home";
import Header from "../header/Header";
import Friends from "../../pages/friends/Friends";
import Channels from "../channels/Channels";
import { Notify, notifyError } from "../../utils/notifications";
import styles from "./Layout.module.scss";
import FriendStyles from "../friends/Friends.module.scss";
import { useAuth } from "../../hooks/useAuth";
import { useEffect } from "react";

function Layout() {
  const { user } = useAuth();
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const isHomePage = () => {
    return pathname === "/";
  };

  const isAuthPage = () => {
    const authPages = ["/login", "/register"];
    return authPages.some((authPage) => pathname.startsWith(authPage));
  };

  useEffect(() => {
    if (user === null && !isAuthPage() && !isHomePage()) {
      navigate("/login");
      notifyError("You must be logged in to access this page.");
      return;
    }
    if (user && isAuthPage()) {
      navigate("/");
      notifyError("You are already logged in");
      return;
    }
  }, [user, pathname]);

  return (
    <div className={styles.container}>
      {!isAuthPage() && <Header />}
      <div className={styles.main}>
        {!isAuthPage() && <Channels />}
        <main>{isHomePage() ? <Home /> : <Outlet />}</main>
        {!isAuthPage() && <Friends styles={FriendStyles} />}
      </div>
      <Notify />
    </div>
  );
}

export default Layout;
