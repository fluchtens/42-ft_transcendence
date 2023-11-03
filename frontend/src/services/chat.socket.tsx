import { createContext } from "react";
import { Socket, io } from "socket.io-client";

async function getToken() {
  const response = await fetch('http://localhost:3000/chat', {
    method: 'GET', 
    credentials: 'include',
  });
  const data = await response.json();
  const token = data['access_token'];
  return token;
}
const token = await getToken();
console.log(token)
console.log('cookie');
export const socket = io("http://localhost:3000/socket", {
  // auth: {
  //   token: token
  // },
  withCredentials: true
});
export const WebsocketContext = createContext<Socket>(socket);
export const WebsocketPovider = WebsocketContext.Provider;