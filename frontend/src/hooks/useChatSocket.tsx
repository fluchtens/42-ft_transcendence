import { createContext, useContext, ReactNode, useEffect, useRef } from "react";
import { Socket, io } from "socket.io-client";

const socketInstance = io(`${import.meta.env.VITE_BACK_URL}/chatSocket`, {
  withCredentials: true,
  // autoConnect:false,
});

const ChatSocketContext = createContext<Socket>(socketInstance);

interface ChatSocketProviderProps {
  children: ReactNode;
}
// useEffect(() => {
//   socketInstance.connect();
// }, [ChatSocketContext]);

export const ChatSocketProvider = ({ children }: ChatSocketProviderProps) => (
  <ChatSocketContext.Provider value={socketInstance}>
    {children}
  </ChatSocketContext.Provider>
);

export const useChatSocket = () => {
  // const socket = useRef(socketInstance.connect());
  const context = useContext(ChatSocketContext);
  if (!context) {
    throw new Error("useSocket must be used within a WebsocketProvider");
  }
  return context;
};
