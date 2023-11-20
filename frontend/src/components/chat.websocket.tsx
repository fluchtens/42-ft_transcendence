import { useContext, useEffect, useState } from "react"
import { WebsocketContext } from "../services/chat.socket";
import ChannelComponent from "./Channel";


export const  Websocket = () => {

  const [channelIds, setChannelIds] = useState<string[]>();
  const [channelsData, setChannelsData] = useState<ChannelData[]>([]);

  const socket : any = useContext(WebsocketContext);socket.on(`messages`)
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected!');
    });
    socket.on('channels', () => {
      console.log("channels Connection");
    });
    return () => {
      console.log('Unregistering Events...');
      socket.off('connect');
      socket.off('allChannels');
    };
  }, []);

  useEffect(() => {
    socket.on('allChannels', (channelIds: string[]) => {
      setChannelIds(channelIds);
      console.log(channelIds);
    });
    socket.emit('getAllChannels');
    // Nettoyer les écouteurs d'événements lorsque le composant est démonté
    return () => {
      socket.off('allChannels');
    };
  }, []);

  useEffect(() => {
    if (channelIds) {
      channelIds.forEach((channelId) => {
        socket.emit('joinChannel', channelId);
      });

      channelIds.forEach((channelId) => {
        socket.on(`channelData:${channelId}`, (channelData: ChannelData) => {
          console.log(`Received channelData for channelId ${channelId}`);
          setChannelsData((prevChannelsData) => {
            if (prevChannelsData) {
              const updatedChannels = [...prevChannelsData];
              const channelIndex = updatedChannels.findIndex(
                (channel) => channel.channelId === channelId
              );
  
              if (channelIndex !== -1) {
                updatedChannels[channelIndex] = channelData;
              } else {
                updatedChannels.push(channelData);
              }
  
              console.log("Updated channelsData:", updatedChannels);
              return updatedChannels;
            }
            return [];
          });
        });
      });
    }
    return () => {
      if (channelIds) {
        channelIds.forEach((channelId) => {
          socket.off(`channelData:${channelId}`);
        });
      }
    };
  }, [channelIds]);

  useEffect(() => {
    console.log(channelsData);
  }, [channelsData]);

  return (
    <div>
      <div>
        {channelsData &&
            channelsData.map((channel) => {
              console.log("Calling ChannelComponent for channel:", channel);
              return (
                <ChannelComponent key={channel.channelId} channel={channel} socket={socket}/>
              )
            })}
      </div>
    </div>
  )
}
