import { Notify, notifyError } from "@/utils/notifications";
import { useEffect } from "react";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../../hooks/useAuth";
import Home from "../../../pages/home/Home";
import { Footer } from "../footer/Footer";
import Header from "../header/Header";

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
    <>
      {!isAuthPage() ? (
        <div className="min-h-screen flex flex-col">
          <Header />
          <main className="flex-1 p-4 md:p-6">{isHomePage() ? <Home /> : <Outlet />}</main>
          <Footer />
        </div>
      ) : (
        <main className="min-h-screen flex flex-col justify-center items-center">
          <Outlet />
        </main>
      )}
      <Notify />
    </>
  );
}

export default Layout;
