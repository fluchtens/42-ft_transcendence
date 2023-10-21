import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./layouts/layout/Layout";
import Error from "./pages/error/Error";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Setup from "./pages/auth/Setup";
import UserProfile from "./pages/user/UserProfile";
import Game from "./pages/game/Game";
import Chat from "./pages/chat/Chat";
import Settings from "./pages/user/Settings";

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
          path: "/register",
          element: <Register />,
        },
        {
          path: "/setup",
          element: <Setup />,
        },
        {
          path: "/user/:username",
          element: <UserProfile />,
        },
        {
          path: "/settings",
          element: <Settings />,
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
