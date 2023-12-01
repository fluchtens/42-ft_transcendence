import { createContext, useContext, ReactNode } from "react";
import { Socket, io } from "socket.io-client";

const socketInstance = io(`${import.meta.env.VITE_BACK_URL}/chatSocket`, {
  withCredentials: true,
});

const ChatSocketContext = createContext<Socket>(socketInstance);

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
    throw new Error("useChatSocket must be used within a ChatSocketProvider");
  }
  return context;
};
