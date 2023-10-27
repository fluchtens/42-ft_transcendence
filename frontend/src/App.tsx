import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./layouts/Layout";
import Error from "./pages/error/Error";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Setup from "./pages/auth/Setup";
import Profile from "./pages/user/Profile";
import Game from "./pages/game/Game";
import Chat from "./pages/chat/Chat";
import Settings from "./pages/user/Settings";
import TwoFaSetup from "./pages/user/TwoFaSetup";
import TwoFaAuth from "./pages/auth/TwoFaAuth";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      errorElement: <Error />,
      children: [
        {
          path: "/login",
          element: <Login />,
        },
        {
          path: "/login/twofa",
          element: <TwoFaAuth />,
        },
        {
          path: "/register",
          element: <Register />,
        },
        {
          path: "/setup",
          element: <Setup />,
        },
        {
          path: "/user/:username",
          element: <Profile />,
        },
        {
          path: "/settings",
          element: <Settings />,
        },
        {
          path: "/twofa/:qrcode",
          element: <TwoFaSetup />,
        },
        {
          path: "/game",
          element: <Game />,
        },
        {
          path: "/chat",
          element: <Chat />,
        },
      ],
    },
  ]);
  return (
    <>
      <RouterProvider router={router} />
    </>
  );
}

export default App;
