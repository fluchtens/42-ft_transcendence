import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./layouts/layout/Layout";
import Error from "./components/Error";
import Register from "./pages/auth/Register";
import Setup from "./pages/auth/Setup";
import Login from "./pages/auth/Login";
import TwoFaAuth from "./pages/auth/TwoFaAuth";
import Profile from "./pages/user/Profile";
import GameElement from "./components/GameElement";
import Chat from "./pages/chat/Chat";
import Friends from "./pages/friends/Friends";
import FriendStyles from "./pages/friends/Friends.module.scss";
import Settings from "./pages/settings/Settings";
import { AuthProvider } from "./hooks/useAuth";
import { ChatSocketProvider } from "./hooks/useChatSocket";
import { FriendshipSocketProvider } from "./hooks/useFriendshipSocket";

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
          path: "/game",
          element: <GameElement />,
        },
        {
          path: "/chat/:id",
          element: <Chat />,
        },
        {
          path: "/friends",
          element: <Friends styles={FriendStyles} />,
        },
        {
          path: "/settings",
          element: <Settings />,
        },
      ],
    },
  ]);

  return (
    <>
      <AuthProvider>
        <ChatSocketProvider>
          <FriendshipSocketProvider>
            <RouterProvider router={router} />
          </FriendshipSocketProvider>
        </ChatSocketProvider>
      </AuthProvider>
    </>
  );
}

export default App;
