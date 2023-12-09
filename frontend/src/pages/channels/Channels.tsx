import { useAuth } from "../../hooks/useAuth";
import { ChannelElement } from "./ChannelElement";
import { AddChannelBar } from "../../components/AddingBar";
import { useEffect, useState } from "react";
import { Channel } from "../../types/chat.interface";
import { useChatSocket } from "../../hooks/useChatSocket";

interface ChannelsProps {
  styles: CSSModuleClasses;
}

function Channels({ styles }: ChannelsProps) {
  const [channelIds, setChannelIds] = useState<string[]>([]);
  const [channelsDataRaw, setChannelsDataRaw] = useState<Channel[]>([]);
  const [channelsData, setChannelsData] = useState<Channel[]>([]);
  const socket = useChatSocket();
  const { user } = useAuth();

  useEffect(() => {
    socket.on("newChannel", (channelId: string) => {
      setChannelIds((prevChannelsIds) => [...prevChannelsIds, channelId]);
    });

    socket.on("channelDeleted", (deletedChannelId: string) => {
      setChannelIds((prevChannels) =>
        prevChannels.filter((channelId) => channelId !== deletedChannelId)
      );
    });

    socket.on("resetChannel", (channelId: string) => {
      socket.emit("getChannelStatus", channelId, (channel: Channel) => {
        setChannelsDataRaw((prevChannelsData) => {
          const updatedChannels = [...prevChannelsData];
          if (!channel.isMember && !channel.public) {
            const updatedChannels = prevChannelsData.filter(
              (channelData) => channelData.id !== channel.id
            );
            return updatedChannels;
          }
          const channelIndex = updatedChannels.findIndex(
            (channel) => channel.id === channelId
          );
          if (channelIndex !== -1) {
            if (channel.isMember || channel.public) {
              updatedChannels[channelIndex] = channel;
            } else {
              const filteredChannels = updatedChannels.filter(
                (channel) => channel.id !== channelId
              );
              return filteredChannels;
            }
          } else {
            updatedChannels.push(channel);
          }
          return updatedChannels;
        });
      });
    });

    return () => {
      socket.off("newChannel");
      socket.off("channelDeleted");
      socket.off("resetChannel");
    };
  }, [socket]);

  useEffect(() => {
    socket.on("allChannels", (InitialchannelIds: string[]) => {
      setChannelIds(InitialchannelIds);
    });
    socket.emit("getAllChannels");
    return () => {
      socket.off("allChannels");
    };
  }, [socket]);

  useEffect(() => {
    const uniqueChannelIds = new Set();
    const filteredChannels = channelsDataRaw.filter((channel) => {
      if (!uniqueChannelIds.has(channel.id)) {
        uniqueChannelIds.add(channel.id);
        return true;
      }
      return false;
    });
    setChannelsData(filteredChannels);
  return () => {};
  }, [channelsDataRaw])

  useEffect(() => {
      socket.emit("getChannelInitialData", channelIds, (channels: Channel[]) => {
        setChannelsDataRaw(channels);
    });
    return () => {
    };
  }, [channelIds]);

  return (
    <>
      {user && (
        <div className={styles.container}>
          <AddChannelBar />
          <ul>
            {channelsData.map((channel) => {
              return (
                <li key={channel.id}>
                  <ChannelElement channel={channel} />
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}

export default Channels;
