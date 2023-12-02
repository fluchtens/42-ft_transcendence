import { Socket } from "socket.io-client";
import { useChatSocket } from "../hooks/useChatSocket";
import { blockUserApi, removeFriendApi } from "../services/friendship.api";
import { Channel } from "../types/chat.interface";
import { User } from "../types/user.interface";
import { notifyError, notifySuccess } from "../utils/notifications";
import styles from "./UserContextMenu.module.scss";
import { Link, useNavigate } from "react-router-dom";

export enum ContextMenuType {
  FRIEND = "FRIEND",
  REQUEST = "REQUEST",
  MEMBER = "MEMBER",
}

interface UserContextMenuProps {
  user: User;
  type: ContextMenuType;
  channel: Channel;
  cb: () => void;
}

const UserContextMenu = ({ user, type, channel, cb }: UserContextMenuProps) => {
  const navigate = useNavigate();
  const chatSocket = useChatSocket();

  const removeFriend = async () => {
    cb();
    const { success, message } = await removeFriendApi(user.id);
    success ? notifySuccess(message) : notifyError(message);
  };

  const blockUser = async () => {
    cb();
    const { success, message } = await blockUserApi(user.id);
    success ? notifySuccess(message) : notifyError(message);
  };

  const sendPrivateMessage = async () => {
    cb();
    navigate("/chat/1");
  };

  const promoteOwner = async () => {
    cb();
    chatSocket.emit('changeRole', {channelId: channel.id, memberId:user.id, newRole: "OWNER"}, (result: string) => {
      if (!result) {
        notifySuccess("promote owner");
      }
      else {
        console.log(result);
        notifyError("failed to promote to owner");
      }
    });
  };

  const promoteAdmin = async () => {
    cb();
    // console.log(channel);
    // console.log(user.username);
    chatSocket.emit('changeRole', {channelId: channel.id, memberId:user.id, newRole: "ADMIN"}, (result: string) => {
      if (!result) {
        notifySuccess("promote admin");
      }
      else {
        console.log(result);
        notifyError("failed to promote to admin");
      }
    });
  };

  const demoteUser = async () => {
    cb();
    chatSocket.emit('changeRole', {channelId: channel.id, memberId:user.id, newRole: "GUEST"}, (result: string) => {
      if (!result) {
        notifySuccess("demote user");
      }
      else {
        console.log(result);
        notifyError("failed to demote user");
      }
    });
  };

  const renderButtons = () => {
    switch (type) {
      case ContextMenuType.FRIEND:
        return (
          <>
            <button onClick={removeFriend}>Remove friend</button>
          </>
        );
      case ContextMenuType.REQUEST:
        return null;
      case ContextMenuType.MEMBER:
        return (
          <>
            <button onClick={promoteOwner}>Promote to owner rank</button>
            <button onClick={promoteAdmin}>Promote to admin rank</button>
            <button onClick={demoteUser}>Demote to user rank</button>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <div className={styles.container}>
      <Link className={styles.link} to={`/user/${user.username}`} onClick={cb}>
        View user profile
      </Link>
      <button onClick={sendPrivateMessage}>Send private message</button>
      <button onClick={blockUser}>Block all communication</button>
      {renderButtons()}
    </div>
  );
};

export { UserContextMenu };
