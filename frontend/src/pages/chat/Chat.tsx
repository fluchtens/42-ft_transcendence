import { useEffect, useState } from "react";
// import { Websocket } from "../../components/chat.websocket";
// import { socket, WebsocketPovider } from "../../services/chat.socket";
import { useAuth } from "../../utils/useAuth";
import { useParams } from "react-router-dom";
import styles from "./Chat.module.scss";
import {
  channelsData,
  messagesData,
} from "../../layouts/channels/_chat.dummy.data";
import { IoSettings } from "react-icons/io5";
import { HiUsers } from "react-icons/hi2";
import { getUserByIdApi } from "../../services/user.api";
import { Message } from "../../types/message.interface";
import defaultAvatar from "/default_avatar.png";
import { ChatHeader } from "./ChatHeader";

function Chat() {
  const [channel, setChannel] = useState<any | null>(null);
  const [messages, setMessages] = useState<any | null>(null);
  const { user } = useAuth();
  const { id } = useParams();

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !id) return;

      const channelData = channelsData.find((c) => c.id === parseInt(id, 10));
      if (!channelData) return;
      setChannel(channelData);

      const messages: Message[] = messagesData;
      if (!messages) return;

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

            <ul className={styles.test}>
              {messages &&
                messages.map((message: Message) => (
                  <li>
                    <div className={styles.avatar}>
                      {message.user && message.user.avatar ? (
                        <img src={message.user.avatar} />
                      ) : (
                        <img src={defaultAvatar} />
                      )}
                    </div>
                    <div className={styles.texts}>
                      {message.user && (
                        <p className={styles.user}>{message.user.username}</p>
                      )}
                      <p className={styles.content}>{message.content}</p>
                    </div>
                  </li>
                ))}
            </ul>
          </div>
        </div>
      )}
    </>
  );
}

export default Chat;
