import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./layouts/layout/Layout";
import Error from "./components/Error";
import Register from "./pages/auth/Register";
import Setup from "./pages/auth/Setup";
import Login from "./pages/auth/Login";
import TwoFaAuth from "./pages/auth/TwoFaAuth";
import Profile from "./pages/user/Profile";
import Game from "./pages/game/Game";
import Channels from "./pages/channels/Channels";
import channelStyles from "./pages/channels/Channels.module.scss";
import Chat from "./pages/chat/Chat";
import PrivateChat from "./pages/chat/PrivateChat";
import Friends from "./pages/friends/Friends";
import friendStyles from "./pages/friends/Friends.module.scss";
import Settings from "./pages/settings/Settings";
import Leaderboard from "./pages/leaderboard/Leaderboard";
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
          element: <Game />,
        },
        {
          path: "/channels",
          element: <Channels styles={channelStyles} />,
        },
        {
          path: "/chat/:id",
          element: <Chat />,
        },
        {
          path: "/pm/:id",
          element: <PrivateChat />,
        },
        {
          path: "/friends",
          element: <Friends styles={friendStyles} />,
        },
        {
          path: "/settings",
          element: <Settings />,
        },
        {
          path: "/leaderboard",
          element: <Leaderboard />,
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
