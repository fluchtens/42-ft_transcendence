import { useEffect, useState } from "react";
import { useAuth } from "../../utils/useAuth";
import { useParams } from "react-router-dom";
import styles from "./Chat.module.scss";
import {
  channelsData,
  messagesData,
} from "../../layouts/channels/_chat.dummy.data";
import { getAllUsersApi, getUserByIdApi } from "../../services/user.api";
import { Message } from "../../types/message.interface";
import { ChatHeader } from "./ChatHeader";
import { MessageElement } from "./MessageElement";
import { MessageInput } from "./MessageInput";
import { User } from "../../types/user.interface";
import { UserElement } from "../../layouts/friends/UserElement";
import { ContextMenuType } from "../../layouts/friends/UserContextMenu";
import { AddFriendBar } from "../../layouts/friends/AddFriendBar";
import { notifySuccess } from "../../utils/notifications";
import { useChatSocket } from "../../utils/useChatSocket";
// import { Websocket } from "../../components/chat.websocket";
// import { socket, WebsocketPovider } from "../../services/chat.socket";

function Chat() {
  const [channel, setChannel] = useState<any | null>(null);
  const [messages, setMessages] = useState<any | null>(null);
  const [newMessage, setNewMessage] = useState<string>("");
  const [members, setMembers] = useState<User[] | null>(null);
  const [addedMember, setAddedMember] = useState<string>("");
  const [membersMenu, setMembersMenu] = useState<boolean>(true);
  const [contextMenu, setContextMenu] = useState<number | null>(null);
  const { user } = useAuth();
  const { id } = useParams();
  const socket = useChatSocket();

  const toggleMembersMenu = () => {
    setMembersMenu(!membersMenu);
  };

  const toggleContextMenu = (userId: number) => {
    setContextMenu(contextMenu === userId ? null : userId);
  };

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

  const changeAddedMember = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddedMember(e.target.value);
  };

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault();
    notifySuccess("In dev");
    setAddedMember("");
  };

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !id) return;

      const channelData = channelsData.find((c) => c.id === parseInt(id, 10));
      if (!channelData) return;
      setChannel(channelData);

      const membersData = await getAllUsersApi();
      if (membersData) {
        setMembers(membersData);
      }

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
            <ChatHeader
              title={channel.name}
              toggleMembersMenu={toggleMembersMenu}
            />
            <ul>
              {messages?.map(
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
          {membersMenu && (
            <>
              <div className={styles.line}></div>
              <div className={styles.members}>
                <AddFriendBar
                  value={addedMember}
                  onChange={changeAddedMember}
                  onSubmit={addMember}
                />
                <ul>
                  {members?.map((user) => (
                    <li key={user.id}>
                      <UserElement
                        user={user}
                        contextMenu={contextMenu === user.id}
                        contextMenuType={ContextMenuType.MEMBER}
                        toggleContextMenu={() => toggleContextMenu(user.id)}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      )}
    </>
  );
}

export default Chat;
