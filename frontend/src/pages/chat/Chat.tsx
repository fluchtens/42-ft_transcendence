import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useParams } from "react-router-dom";
import styles from "./Chat.module.scss";
import { ChatHeader } from "./ChatHeader";
import { MessageElement } from "./MessageElement";
import { MessageInput } from "./MessageInput";
import { User } from "../../types/user.interface";
import { UserElement } from "../../layouts/friends/UserElement";
import { ContextMenuType } from "../../layouts/friends/UserContextMenu";
import { AddFriendBar } from "../../layouts/friends/AddFriendBar";
import { notifySuccess } from "../../utils/notifications";
import { useChatSocket } from "../../hooks/useChatSocket";
import {
  Channel,
  Member,
  MemberUsers,
  Message,
} from "../../types/chat.interface";
import { getAllUsersApi } from "../../services/user.api";
import { Loading } from "../../components/Loading";

function Chat() {
  const [loading, setLoading] = useState<boolean>(true);
  const [channel, setChannel] = useState<Channel>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState<string>("");
  const [members, setMembers] = useState<MemberUsers[]>([]);
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

    socket.emit("sendMessage", {
      channelId: id,
      message: newMessage,
    });

    setNewMessage("");
  };

  const changeAddedMember = (e: React.ChangeEvent<HTMLInputElement>) => {
    setAddedMember(e.target.value);
  };

  const addMember = async (e: React.FormEvent) => {
    e.preventDefault();
    socket.emit("addMember", {
      channelId: id,
      memberUsername: addedMember,
    });
    setAddedMember("");
  };

  useEffect(() => {
    socket.on(`channelData:${id}`, (channelData: Channel) => {
      setChannel(channelData);
      setMessages(channelData.messages);
      setMembers(channelData.members);
      setLoading(false);
    });

    socket.on(`${id}/messageDeleted`, (deletedMessageId: string) => {
      setMessages((prevMessages) =>
        prevMessages.filter((message) => message.id !== deletedMessageId)
      );
    });

    socket.on(`${id}/message`, (message: Message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socket.on(`${id}/member`, (member: MemberUsers) => {
      setMembers((prevMembers) => [...prevMembers, member]);
    });

    socket.emit("joinRoom", { channelId: id, getMessages: true });

    return () => {
      socket.off(`channelData:${id}`);
      socket.off(`${id}/messageDeleted`);
      socket.off(`${id}/message`);
      socket.off(`${id}/member`);
    };
  }, [id]);

  return (
    <>
      {loading && <Loading />}
      {!loading && user && channel && (
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
                  {members?.map((member) => (
                    <li key={member.user.id}>
                      <UserElement
                        user={member.user}
                        contextMenu={contextMenu === member.user.id}
                        contextMenuType={ContextMenuType.MEMBER}
                        toggleContextMenu={() =>
                          toggleContextMenu(member.user.id)
                        }
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
