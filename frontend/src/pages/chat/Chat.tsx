import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetClose, SheetContent } from "@/components/ui/sheet";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { Loading } from "../../components/Loading";
import { useAuth } from "../../hooks/useAuth";
import { useChatSocket } from "../../hooks/useChatSocket";
import { getBlockedUsersApi } from "../../services/friendship.api";
import { Channel, MemberUsers, Message } from "../../types/chat.interface";
import { notifyError } from "../../utils/notifications";
import { ChatHeader } from "./ChatHeader";
import { AddMemberBar } from "./members/AddMemberBar";
import { MemberElement } from "./members/MemberElement";
import { MessageElement } from "./MessageElement";
import { MessageInput } from "./MessageInput";

export default function Chat() {
  const [membersSheet, setMembersSheet] = useState(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [channel, setChannel] = useState<Channel>();
  const [messages, setMessages] = useState<Message[]>([]);
  const messagesRef = useRef<HTMLDivElement>(null);
  const [newMessage, setNewMessage] = useState<string>("");
  const [members, setMembers] = useState<MemberUsers[]>([]);
  const [addedMember, setAddedMember] = useState<string>("");
  const { user } = useAuth();
  const { id } = useParams();
  const socket = useChatSocket();
  const navigate = useNavigate();

  const getMyRole = () => {
    let role = "";
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

  const changeNewMessage = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewMessage(e.target.value);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newMessage) return;

    socket.emit(
      "sendMessage",
      {
        channelId: id,
        message: newMessage,
      },
      (result: string) => {
        if (result === "You are muted!") {
          notifyError(result);
        } else if (result === "invalid input") {
          notifyError(result);
        }
      }
    );

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

    socket.on("refreshPage", () => {
      socket.emit("joinRoom", { channelId: id, getMessages: true });
    });

    socket.on(`${id}/messageDeleted`, (deletedMessageId: string) => {
      setMessages((prevMessages) => prevMessages.filter((message) => message.id !== deletedMessageId));
    });

    socket.on(`${id}/message`, (message: Message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    socket.on("joinGame", () => {
      navigate("/game");
    });

    socket.on(`${id}/member`, (member: MemberUsers) => {
      setMembers((prevMembers) => [...prevMembers, member]);
    });

    socket.on(`${id}/channelDeleted`, () => {
      navigate("/");
    });

    socket.on(`${id}/memberDeleted`, (deletedMemberId: Number) => {
      setMembers((prevMembers) => prevMembers.filter((member) => member.member.userId !== deletedMemberId));
    });
    socket.emit("joinRoom", { channelId: id, getMessages: true });

    socket.on("joinGame", () => {
      navigate("/game");
    });

    return () => {
      socket.off(`channelData:${id}`);
      socket.off(`${id}/messageDeleted`);
      socket.off(`${id}/message`);
      socket.off(`${id}/member`);
      socket.off(`${id}/channelDeleted`);
      socket.off("joinGame");
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
        <div className="m-auto p-4 max-w-screen-lg h-[calc(100vh-10rem)] md:h-[calc(100vh-11.5rem)] bg-card rounded-xl">
          <div className="h-full flex flex-col gap-4">
            <ChatHeader members={members} channel={channel} setMembersSheet={setMembersSheet} />
            <ul className="overflow-y-scroll flex-1 flex flex-col break">
              {messages?.map(
                (message: Message) =>
                  message.user && (
                    <li key={message.id} className="p-2 pr-4 flex items-center gap-3 rounded-md transition-colors break-all">
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
            <MessageInput content={newMessage} onChange={changeNewMessage} onSubmit={sendMessage} />
          </div>
          <Sheet open={membersSheet} onOpenChange={setMembersSheet}>
            <SheetContent side="right">
              <SheetClose asChild>
                <Link to="/" className="text-xl font-semibold text-left">
                  <DialogTitle>ft_transcendence</DialogTitle>
                  <DialogDescription className="text-sm font-light text-muted-foreground">Multiplayer pong game</DialogDescription>
                </Link>
              </SheetClose>
              <div className="mt-2 max-h-[61rem] flex flex-col">
                <AddMemberBar value={addedMember} onChange={changeAddedMember} onSubmit={addMember} />
                <ul className="mt-2 overflow-y-scroll flex flex-col">
                  {members?.map((member: MemberUsers, index) => (
                    <li key={index}>
                      <MemberElement
                        member={member.user}
                        channel={channel}
                        role={member.member.role}
                        userRole={getMyRole()}
                        setSheetOpen={setMembersSheet}
                      />
                      <Separator className={`${index !== members.length - 1 ? "my-1" : "hidden"}`} />
                    </li>
                  ))}
                </ul>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      )}
    </>
  );
}
