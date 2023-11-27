import { createContext, useContext, ReactNode } from "react";
import { Socket, io } from "socket.io-client";

const socketInstance = io(`${import.meta.env.VITE_BACK_URL}/chatSocket`, {
  withCredentials: true,
});

const ChatSocketContext = createContext<Socket | null>(null);

interface ChatSocketProviderProps {
  children: ReactNode;
}

export const ChatSocketProvider = ({ children }: ChatSocketProviderProps) => (
  <ChatSocketContext.Provider value={socketInstance}>
    {children}
  </ChatSocketContext.Provider>
);

export const useChatSocket = () => {
  const context = useContext(ChatSocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a WebsocketProvider");
  }
  return context;
};
