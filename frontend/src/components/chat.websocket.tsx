import { useContext, useEffect, useState } from "react"
import { WebsocketContext } from "../services/chat.socket";
import ChannelComponent from "./Channel";


export const  Websocket = () => {

  const [channelIds, setChannelIds] = useState<string[]>();
  const [channelsData, setChannelsData] = useState<ChannelData[]>();
  const socket : any = useContext(WebsocketContext);
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected!');
    });
    socket.on('channels', () => {
      console.log("channels Connection");
    })
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

      // Écouter l'événement pour chaque channelId
      channelIds.forEach((channelId) => {
        socket.on(`channelData:${channelId}`, (channelData: ChannelData) => {
          // Mettez à jour l'état local avec les données du canal
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
          });
        });
      });
    }
  
    // Nettoyer les écouteurs d'événements lorsque le composant est démonté
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
    <ul>
     
    </ul>
  </div>
      {/* <div>
        <h1> Websocket </h1>
        <input type="text" value={value} onChange={(e) => setValue(e.target.value)}/>
        <button onClick={onSubmit}>Submit</button>
      </div> */}
      <div>
        {channelsData &&
            channelsData.map((channel) => (
              <ChannelComponent key={channel.channelId} channel={channel} />
              ))}
      </div>
    </div>
  )
}
