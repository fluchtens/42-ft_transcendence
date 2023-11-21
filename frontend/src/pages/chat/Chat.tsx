import { useEffect, useState } from "react";
import { useAuth } from "../../utils/useAuth";
import { useParams } from "react-router-dom";
import styles from "./Chat.module.scss";
import {
  channelsData,
  messagesData,
} from "../../layouts/channels/_chat.dummy.data";
import { getUserByIdApi } from "../../services/user.api";
import { Message } from "../../types/message.interface";
import { ChatHeader } from "./ChatHeader";
import { MessageElement } from "./MessageElement";
import { MessageInput } from "./MessageInput";
// import { Websocket } from "../../components/chat.websocket";
// import { socket, WebsocketPovider } from "../../services/chat.socket";

function Chat() {
  const [channel, setChannel] = useState<any | null>(null);
  const [messages, setMessages] = useState<any | null>(null);
  const [newMessage, setNewMessage] = useState<string>("");
  const { user } = useAuth();
  const { id } = useParams();

  const changeNewMessage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage) return;

    const newMessageObject: Message = {
      id: "24533452345",
      content: newMessage,
      userId: user.id,
      user: user,
    };

    setMessages((prevMessages: Message[]) =>
      prevMessages ? [...prevMessages, newMessageObject] : [newMessageObject]
    );
    setNewMessage("");
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !id) return;

      const channelData = channelsData.find((c) => c.id === parseInt(id, 10));
      if (!channelData) return;
      setChannel(channelData);

      const messages: Message[] = messagesData;
      if (!messages || !messages.length) return;

      const messagesWithUsers = await Promise.all(
        messages.map(async (message: Message) => {
          const user = await getUserByIdApi(message.userId);
          return { ...message, user };
        })
      );
      setMessages(messagesWithUsers);
    };

    fetchData();
  }, [user]);

  return (
    <>
      {user && channel && (
        // <WebsocketPovider value={socket}>
        //   <Websocket />
        // </WebsocketPovider>
        <div className={styles.container}>
          <div className={styles.chat}>
            <ChatHeader title={channel.name} />
            <ul>
              {messages &&
                messages.map(
                  (message: Message) =>
                    message.user && (
                      <li key={message.id}>
                        <MessageElement
                          avatar={message.user.avatar}
                          username={message.user.username}
                          content={message.content}
                        />
                      </li>
                    )
                )}
            </ul>
            <MessageInput
              content={newMessage}
              onChange={changeNewMessage}
              onSubmit={sendMessage}
            />
          </div>
        </div>
      )}
    </>
  );
}

export default Chat;
