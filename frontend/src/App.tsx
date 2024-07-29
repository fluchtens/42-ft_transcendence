import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Error from "./components/Error";
import Layout from "./components/layouts/layout/Layout";
import { AuthProvider } from "./hooks/useAuth";
import { ChatSocketProvider } from "./hooks/useChatSocket";
import { FriendshipSocketProvider } from "./hooks/useFriendshipSocket";
import { GameSocketProvider } from "./hooks/useGameSocket";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Setup from "./pages/auth/Setup";
import TwoFaAuth from "./pages/auth/TwoFaAuth";
import Chat from "./pages/chat/Chat";
import PrivateChat from "./pages/chat/PrivateChat";
import Game from "./pages/game/Game";
import Leaderboard from "./pages/leaderboard/Leaderboard";
import Settings from "./pages/settings/Settings";
import Profile from "./pages/user/Profile";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      errorElement: <Error />,
      children: [
        { path: "/register", element: <Register /> },
        { path: "/register/setup", element: <Setup /> },
        { path: "/login", element: <Login /> },
        { path: "/login/twofa", element: <TwoFaAuth /> },
        { path: "/user/:username", element: <Profile /> },
        { path: "/game", element: <Game /> },
        { path: "/chat/:id", element: <Chat /> },
        { path: "/pm/:id", element: <PrivateChat /> },
        { path: "/settings", element: <Settings /> },
        { path: "/leaderboard", element: <Leaderboard /> },
      ],
    },
  ]);

  return (
    <>
      <AuthProvider>
        <FriendshipSocketProvider>
          <ChatSocketProvider>
            <GameSocketProvider>
              <RouterProvider router={router} />
            </GameSocketProvider>
          </ChatSocketProvider>
        </FriendshipSocketProvider>
      </AuthProvider>
    </>
  );
}

export default App;
