import { useAuth } from "../../hooks/useAuth";
import { ChannelElement } from "./ChannelElement";
import { AddChannelBar } from "./AddChannelBar";
import styles from "./Channels.module.scss";
import { useEffect, useState } from "react";
import { Channel } from "../../types/chat.interface";
import { useChatSocket } from "../../hooks/useChatSocket";

function Channels() {
  const [channelIds, setChannelIds] = useState<string[]>([]);
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
      socket.emit('getChannelStatus', channelId, (channel: Channel) => {
          setChannelsData((prevChannelsData) => {
            const updatedChannels = [...prevChannelsData];
            if (!channel.isMember && !channel.public) {
              const updatedChannels = prevChannelsData.filter((channelData) => channelData.id !== channel.id);
              return updatedChannels;
            }
            const channelIndex = updatedChannels.findIndex(
              (channel) => channel.id === channelId
            );
            if (channelIndex !== -1) {
              if (channel.isMember || channel.public) {
                updatedChannels[channelIndex] = channel;
              }
              else {
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
      })
    });

    return () => {
      socket.off("newChannel");
      socket.off("channelDeleted");
      socket.off("resetChannel");
    };
  }, [socket]);

  useEffect(() => {
    socket.on("allChannels", (channelIds: string[]) => {
      setChannelIds(channelIds);
    });
    socket.emit("getAllChannels");
    return () => {
      socket.off("allChannels");
    };
  }, [socket]);

  useEffect(() => {
    channelIds.forEach((channelId) => {
      socket.emit("joinRoom", { channelId: channelId, getMessages: false });
      socket.on(`channelData:${channelId}`, (channelData: Channel) => {
        setChannelsData((prevChannelsData) => {
          const updatedChannels = [...prevChannelsData];
          const channelIndex = updatedChannels.findIndex(
            (channel) => channel.id === channelId
          );
          if (channelIndex !== -1) {
            updatedChannels[channelIndex] = channelData;
          } else {
            updatedChannels.push(channelData);
          }
          const removeUsselesschannel = updatedChannels;
          const channelsToRemove = removeUsselesschannel.filter(
            (channel) => !channelIds.includes(channel.id)
          );
          channelsToRemove.forEach((channelToRemove) => {
            const removeIndex = removeUsselesschannel.findIndex(
              (channel) => channel.id === channelToRemove.id
            );
            if (removeIndex !== -1) {
              removeUsselesschannel.splice(removeIndex, 1);
            }
          });
          return removeUsselesschannel;
        });
      });
    });

    setChannelsData((prevChannelsData) => {
      const updatedChannels = [...prevChannelsData];
      const channelsToRemove = updatedChannels.filter(
        (channel) => !channelIds.includes(channel.id)
      );
      channelsToRemove.forEach((channelToRemove) => {
        const removeIndex = updatedChannels.findIndex(
          (channel) => channel.id === channelToRemove.id
        );
        if (removeIndex !== -1) {
          updatedChannels.splice(removeIndex, 1);
        }
      });
      return updatedChannels;
    });

    return () => {
      channelIds.forEach((channelId) => {
        socket.off(`channelData:${channelId}`);
      });
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
