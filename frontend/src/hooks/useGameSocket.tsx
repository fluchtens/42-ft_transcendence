import { ReactNode, createContext, useContext } from "react";
import { Socket, io } from "socket.io-client";

const socketInstance = io(`${import.meta.env.VITE_BACK_URL}/gamesocket`, {
  withCredentials: true,
});

const GameSocketContext = createContext<Socket>(socketInstance);

export const GameSocketProvider = ({ children }: { children: ReactNode }) => (
  <GameSocketContext.Provider value={socketInstance}>{children}</GameSocketContext.Provider>
);

export const useGameSocket = () => {
  const context = useContext(GameSocketContext);
  if (!context) {
    throw new Error("useGameSocket must be used within a GameSocketProvider");
  }
  return context;
};
