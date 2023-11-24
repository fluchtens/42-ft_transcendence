// import { useContext, useEffect, useState } from "react"
// import { WebsocketContext } from "../services/chat.socket";
// import ChannelComponent from "./Channel";
// import { User } from "../types/user.interface";
// import { getUserApi } from "../services/user.api";

// export const  Websocket = () => {

//   const [channelIds, setChannelIds] = useState<string[]>([]);
//   const [channelsData, setChannelsData] = useState<ChannelData[]>([]);
//   const [channelName, setChannelName] = useState('');
//   const [userData, setUserData] = useState<User>({} as User);

//   const socket : any = useContext(WebsocketContext);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const user = await getUserApi();
//         if (user)
//          setUserData(user);
//       } catch (error) {
//         console.error("Error when getUserData:", error);
//       }
//     };

//     fetchData();

//     socket.on('connect', () => {
//       console.log('Connected!');
//     });
//     socket.on('newChannel', (channelId: string) => {
//       setChannelIds((prevChannelsIds) => [...prevChannelsIds, channelId]);
//     });
//     socket.on('channelDeleted', (deletedChannelId: string) => {
//       setChannelIds((prevChannels) => prevChannels.filter((channelId) => channelId !== deletedChannelId));
//     });
//     return () => {
//       console.log('Unregistering Events...');
//       socket.off('connect');
//       socket.off('newChannel');
//       socket.off('channelDeleted');
//     };
//   }, []);

//   useEffect(() => {
//     socket.on('allChannels', (channelIds: string[]) => {
//       setChannelIds(channelIds);
//     });
//     socket.emit('getAllChannels');
//     return () => {
//       socket.off('allChannels');
//     };
//   }, []);

//   const onCreateChannel = () => {
//     socket.emit('createChannel', {channelName: channelName});
//     setChannelName('');
//   };

//   useEffect(() => {
//     if (channelIds) {
//       channelIds.forEach((channelId) => {
//         socket.emit('joinRoom', {channelId: channelId});
//       });

//       channelIds.forEach((channelId) => {
//         socket.on(`channelData:${channelId}`, (channelData: ChannelData) => {
//           setChannelsData((prevChannelsData) => {
//               const updatedChannels = [...prevChannelsData];
//               const channelIndex = updatedChannels.findIndex(
//                 (channel) => channel.channelId === channelId
//               );
//               if (channelIndex !== -1) {
//                 updatedChannels[channelIndex] = channelData;
//               } else {
//                 updatedChannels.push(channelData);
//               }
//               return updatedChannels;
//           });
//         });
//       });
//       setChannelsData((prevChannelsData) => {
//         const updatedChannels = [...prevChannelsData];
//         const channelsToRemove = updatedChannels.filter(
//           (channel => !channelIds.includes(channel.channelId))
//         );
//         channelsToRemove.forEach((channelToRemove) => {
//           const removeIndex = updatedChannels.findIndex(
//             (channel) => channel.channelId === channelToRemove.channelId
//             );
//           if (removeIndex !== -1) {
//             updatedChannels.splice(removeIndex, 1);
//           }
//         });
//         return updatedChannels;
//       })
//     }
//     return () => {
//       if (channelIds) {
//         channelIds.forEach((channelId) => {
//           socket.off(`channelData:${channelId}`);
//         });
//       }
//     };
//   }, [channelIds]);

//   return (
//     <div>
//       <div>
//         <input type="text" placeholder="Name your channel" value={channelName} onChange={(e) => setChannelName(e.target.value)} />
//         <button onClick={onCreateChannel}>
//           CreateNewChannel
//         </button>
//       </div>
//       <div>
//         {channelsData &&
//             channelsData.map((channel) => {
//               return (
//                 <ChannelComponent key={channel.channelId} channel={channel} socket={socket} user={userData}/>
//               )
//             })}
//       </div>
//     </div>
//   )
// }
