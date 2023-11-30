import { createContext, useContext, ReactNode } from "react";
import { Socket, io } from "socket.io-client";

const socketInstance = io(`${import.meta.env.VITE_BACK_URL}/friendship`, {
  withCredentials: true,
});

const FriendshipSocketContext = createContext<Socket>(socketInstance);

interface FriendshipSocketProviderProps {
  children: ReactNode;
}

export const FriendshipSocketProvider = ({
  children,
}: FriendshipSocketProviderProps) => (
  <FriendshipSocketContext.Provider value={socketInstance}>
    {children}
  </FriendshipSocketContext.Provider>
);

export const useFriendshipSocket = () => {
  const context = useContext(FriendshipSocketContext);
  if (!context) {
    throw new Error(
      "useFriendshipSocket must be used within a FriendshipSocketProvider"
    );
  }
  return context;
};
