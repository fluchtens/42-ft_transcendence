import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./layouts/Layout";
import Game from "./pages/Game";
import Chat from "./pages/Chat";
import Leaderboard from "./pages/Leaderboard";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";

function App() {
  const router = createBrowserRouter([
    {
      path: "/",
      element: <Layout />,
      // errorElement: <Error />,
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
          path: "/game",
          element: <Game />,
        },
        {
          path: "/chat",
          element: <Chat />,
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
      <RouterProvider router={router} />
    </>
  );
}

export default App;
