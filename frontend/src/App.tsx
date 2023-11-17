import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./layouts/layout/Layout";
import Error from "./components/Error";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Setup from "./pages/auth/Setup";
import Profile from "./pages/user/Profile";
import Chat from "./pages/chat/Chat";
import Settings from "./pages/settings/Settings";
import TwoFaSetup from "./pages/settings/TwoFaSetup";
import TwoFaAuth from "./pages/auth/TwoFaAuth";
import { AuthProvider } from "./utils/useAuth";
import GameElement from "./components/GameElement";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      errorElement: <Error />,
      children: [
        {
          path: "/register",
          element: <Register />,
        },
        {
          path: "/register/setup",
          element: <Setup />,
        },
        {
          path: "/login",
          element: <Login />,
        },
        {
          path: "/login/twofa",
          element: <TwoFaAuth />,
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
          path: "/settings/twofa/:qrcode",
          element: <TwoFaSetup />,
        },
        {
          path: "/game",
          element: <GameElement />,
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
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </>
  );
}

export default App;
