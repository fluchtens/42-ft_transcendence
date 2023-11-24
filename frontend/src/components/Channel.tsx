// import { useEffect, useState } from "react";
// import { Socket } from "socket.io-client";
// import { User } from "../types/user.interface";

// interface ChannelComponentProps {
//   channel: ChannelData;
//   socket: Socket;
//   user: User;
// }

// const ChannelComponent: React.FC<ChannelComponentProps> = ({
//   channel,
//   socket,
//   user,
// }) => {
//   const [messageInput, setMessageInput] = useState("");
//   const [messages, setMessages] = useState<Messages[]>([]);
//   const [newMembers, setNewMembers] = useState<any[]>([]);
//   const [addMemberInput, setAddMemberInput] = useState("");

//   const onSendMessage = () => {
//     if (channel.channelId) {
//       socket.emit("sendMessage", {
//         channelId: channel.channelId,
//         message: messageInput,
//       });
//       setMessageInput("");
//     }
//   };

//   const handleDeleteMessage = (messageId: string) => {
//     if (messageId) {
//       socket.emit("deleteMessage", {
//         messageId: messageId,
//         channelId: channel.channelId,
//       });
//       setMessages((prevMessages) =>
//         prevMessages.filter((message) => message.id !== messageId)
//       );
//     }
//   };

//   const handleAddMember = () => {
//     if (addMemberInput) {
//       socket.emit("addMember", {
//         channelId: channel.channelId,
//         memberId: addMemberInput,
//       });
//     }
//     setAddMemberInput("");
//   };
//   const onDeleteChannel = () => {
//     socket.emit("deleteChannel", channel.channelId);
//   };
//   useEffect(() => {
//     setMessages(channel.messages);
//     socket.on(
//       `${channel.channelId}/messageDeleted`,
//       (deletedMessageId: string) => {
//         setMessages((prevMessages) =>
//           prevMessages.filter((message) => message.id !== deletedMessageId)
//         );
//       }
//     );
//     socket.on(`${channel.channelId}/message`, (message: Messages) => {
//       setMessages((prevMessages) => [...prevMessages, message]);
//     });
//     socket.on(`${channel.channelId}/members`, (members: any) => {
//       setNewMembers((prevMembers) => [...prevMembers, members]);
//     });
//     return () => {
//       socket.off(`${channel.channelId}/message`);
//       socket.off(`${channel.channelId}/messageDeleted`);
//       socket.off(`${channel.channelId}/members`);
//     };
//   }, [channel]);

//   return (
//     <div className="channel-container">
//       <div className="channel-header">{channel.channelName}</div>
//       <button onClick={onDeleteChannel}>DeleteChannel</button>
//       <div className="message-list">
//         {messages.map((message, index) => (
//           <div key={index} className="message">
//             {message.userId}: {message.content}
//             {message.userId === user.id && (
//               <button onClick={() => handleDeleteMessage(message.id)}>
//                 Supprimer
//               </button>
//             )}
//           </div>
//         ))}
//       </div>
//       <div className="message-input">
//         <input
//           type="text"
//           placeholder="Type your message"
//           value={messageInput}
//           onChange={(e) => setMessageInput(e.target.value)}
//         />
//         <button onClick={onSendMessage}>Send</button>
//       </div>
//       <div className="message-input">
//         <input
//           type="text"
//           placeholder="add Your member"
//           value={addMemberInput}
//           onChange={(e) => setAddMemberInput(e.target.value)}
//         />
//         <button onClick={handleAddMember}>Send</button>
//       </div>
//     </div>
//   );
// };

// export default ChannelComponent;
