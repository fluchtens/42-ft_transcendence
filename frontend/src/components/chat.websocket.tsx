import { useContext, useEffect, useState } from "react"
import { WebsocketContext } from "../services/chat.socket";
import ChannelComponent from "./Channel";


export const  Websocket = () => {

  const [channelIds, setChannelIds] = useState<string[]>([]);
  const [channelsData, setChannelsData] = useState<ChannelData[]>([]);
  const [channelName, setChannelName] = useState('');

  const socket : any = useContext(WebsocketContext);socket.on(`messages`)
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected!');
    });
    socket.on('newChannel', (channelId: string) => {
      setChannelIds((prevChannelsIds) => [...prevChannelsIds, channelId]);
    });
    return () => {
      console.log('Unregistering Events...');
      socket.off('connect');
      socket.off('newChannel');
    };
  }, []);

  useEffect(() => {
    socket.on('allChannels', (channelIds: string[]) => {
      setChannelIds(channelIds);
    });
    socket.emit('getAllChannels');
    // Nettoyer les écouteurs d'événements lorsque le composant est démonté
    return () => {
      socket.off('allChannels');
    };
  }, []);

  const onCreateChannel = () => {
    socket.emit('createChannel', channelName);
    setChannelName('');
  };

  useEffect(() => {
    if (channelIds) {
      channelIds.forEach((channelId) => {
        socket.emit('joinChannel', channelId);
      });

      channelIds.forEach((channelId) => {
        socket.on(`channelData:${channelId}`, (channelData: ChannelData) => {
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

  return (
    <div>
      <div>
        <input type="text" placeholder="Name your channel" value={channelName} onChange={(e) => setChannelName(e.target.value)} />
        <button onClick={onCreateChannel}>
          CreateNewChannel
        </button>
      </div>
      <div>
        {channelsData &&
            channelsData.map((channel) => {
              return (
                <ChannelComponent key={channel.channelId} channel={channel} socket={socket}/>
              )
            })}
      </div>
    </div>
  )
}
