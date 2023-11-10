import { Websocket } from "../../components/chat.websocket";
import { socket, WebsocketPovider } from "../../services/chat.socket";

function Chat() {
  return (
    <div>
      <h1>Chat</h1>
      <WebsocketPovider value={socket}>
        <Websocket />
      </WebsocketPovider>
    </div>
  );
}

export default Chat;