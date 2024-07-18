import { Notify, notifyError } from "@/utils/notifications";
import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import Home from "../../../pages/home/Home";
import Header from "../header/Header";
import { Footer } from "./Footer";

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

  const isChannelOrFriendsPage = () => {
    const allowedPages = ["/channels", "/friends"];
    return allowedPages.includes(pathname);
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
    <div className="min-h-screen flex flex-col">
      {!isAuthPage() && <Header />}
      <div className="flex flex-1">
        {/* {!isAuthPage() && !isChannelOrFriendsPage() && <Channels styles={channelStyles} />} */}
        <main className="flex-1">{isHomePage() ? <Home /> : <Outlet />}</main>
        {/* {!isAuthPage() && !isChannelOrFriendsPage() && <Friends styles={friendStyles} />} */}
      </div>
      {!isAuthPage() && <Footer />}
      <Notify />
    </div>
  );
}

export default Layout;
