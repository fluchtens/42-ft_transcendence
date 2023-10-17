import { createBrowserRouter, RouterProvider } from "react-router-dom";
import Layout from "./layouts/Layout";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Setup from "./pages/auth/Setup";
import Game from "./pages/Game";
import Chat from "./pages/Chat";

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
          path: "/setup",
          element: <Setup />,
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
