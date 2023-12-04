import { useEffect, useState } from "react";
import { useAuth } from "../../hooks/useAuth";
import { useNavigate, useParams } from "react-router-dom";
import styles from "./Chat.module.scss";
import { ChatHeader } from "./ChatHeader";
import { MessageElement } from "./MessageElement";
import { MessageInput } from "./MessageInput";
import { UserElement } from "../../components/UserElement";
import { ContextMenuType } from "../../components/UserContextMenu";
import { useChatSocket } from "../../hooks/useChatSocket";
import { Channel, MemberUsers, Message } from "../../types/chat.interface";
import { Loading } from "../../components/Loading";
import { notifyError } from "../../utils/notifications";
import { AddUserBar } from "../../components/AddingBar";

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
  const navigate = useNavigate();

  const getMyRole = () => {
    let role = undefined;
    if (user) {
      members.map((member: MemberUsers) => {
        if (user.id === member.member.userId) {
          role = member.member.role;
          return;
        }
      });
    }
    return role;
  };

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
    socket.emit(
      "addMember",
      {
        channelId: id,
        memberUsername: addedMember,
      },
      (result: string) => {
        if (result) {
          notifyError(result);
        }
      }
    );
    setAddedMember("");
  };

  useEffect(() => {
    socket.on(`channelData:${id}`, (channelData: Channel) => {
      if (channelData.messages && channelData.members) {
        setMessages(channelData.messages);
        setMembers(channelData.members);
        setChannel(channelData);
      }
      setLoading(false);
    });

    socket.on('refreshPage', () => {
      socket.emit("joinRoom", { channelId: id, getMessages: true });
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

    socket.on(`${id}/channelDeleted`, () => {
      navigate("/");
    });

    socket.on(`${id}/memberDeleted`, (deletedMemberId: Number) => {
      setMembers((prevMembers) =>
        prevMembers.filter((member) => member.member.userId !== deletedMemberId)
      );
    });
    socket.emit("joinRoom", { channelId: id, getMessages: true });

    return () => {
      socket.off(`channelData:${id}`);
      socket.off(`${id}/messageDeleted`);
      socket.off(`${id}/message`);
      socket.off(`${id}/member`);
      socket.off(`${id}/channelDeleted`);
    };
  }, [id, socket]);

  return (
    <>
      {loading && <Loading />}
      {!loading && user && channel && (
        <div className={styles.container}>
          <div className={styles.chat}>
            <ChatHeader
              channel={channel}
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
                <AddUserBar
                  value={addedMember}
                  onChange={changeAddedMember}
                  onSubmit={addMember}
                />
                <ul>
                  {members?.map((member: MemberUsers) => (
                    <li key={member.user.id}>
                      <UserElement
                        user={member.user}
                        userRole={getMyRole()}
                        channel={channel}
                        role={member.member.role}
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
