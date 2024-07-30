import { useEffect, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { Loading } from "../../components/Loading";
import { useAuth } from "../../hooks/useAuth";
import { useChatSocket } from "../../hooks/useChatSocket";
import { getBlockedUsersApi } from "../../services/friendship.api";
import { Message, PrivateChannelData } from "../../types/chat.interface";
import { notifyError } from "../../utils/notifications";

function PrivateChat() {
  const [loading, setLoading] = useState<boolean>(true);
  const [channel, setChannel] = useState<PrivateChannelData>();
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState<string>("");
  const { user } = useAuth();
  const { id } = useParams();
  const socket = useChatSocket();

  const changeNewMessage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage) return;

    socket.emit(
      "sendPrivateMessage",
      {
        channelId: id,
        message: newMessage,
      },
      (result: string) => {
        if (result === "invalid input") {
          notifyError(result);
        }
      }
    );

    setNewMessage("");
  };

  useEffect(() => {
    socket.emit("getPrivateChannelData", id, (channelData: PrivateChannelData) => {
      if (channelData) {
        setMessages(channelData.messages);
        setChannel(channelData);
      }
      setLoading(false);
    });

    socket.on(`${id}/message`, (message: Message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });
    socket.on(`${id}/messageDeleted`, (deletedMessageId: string) => {
      setMessages((prevMessages) => prevMessages.filter((message) => message.id !== deletedMessageId));
    });

    return () => {
      socket.off(`${id}/message`);
      socket.off(`${id}/messageDeleted`);
    };
  }, [id, socket]);

  useEffect(() => {
    const hideBlockedUsers = async () => {
      const blockedUsers = await getBlockedUsersApi();
      if (!blockedUsers) return;

      setMessages((prevMessages) =>
        prevMessages.map((message) => {
          const isUserBlocked = blockedUsers.some((user) => message.userId === user.id);
          if (isUserBlocked) {
            return {
              ...message,
              content: "Blocked message",
            };
          }
          return message;
        })
      );
    };
    hideBlockedUsers();
  }, [messages]);

  useEffect(() => {
    if (messages.length) {
      messagesRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "end",
      });
    }
  }, [messages.length]);

  return (
    <>
      {loading && <Loading />}
      {!loading && user && channel && (
        <div className="">
          {/* <div className={styles.chat}>
            <h1>{channel.name}</h1>
            <ul>
              {messages?.map(
                (message: Message) =>
                  message.user && (
                    <li key={message.id}>
                      <MessageElement
                        avatar={message.user.avatar}
                        username={message.user.username}
                        content={message.content}
                        userId={message.user.id}
                        gameInvit={message.gameInvit}
                      />
                    </li>
                  )
              )}
              <div ref={messagesRef} />
            </ul>
            <MessageInput
              content={newMessage}
              onChange={changeNewMessage}
              onSubmit={sendMessage}
            />
          </div> */}
        </div>
      )}
    </>
  );
}

export default PrivateChat;
