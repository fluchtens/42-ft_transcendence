import { useAuth } from "../../hooks/useAuth";
import { ChannelElement } from "./ChannelElement";
import { AddChannelBar } from "./AddChannelBar";
import styles from "./Channels.module.scss";
import { useEffect, useState } from "react";
import { Channel } from "../../types/chat.interface";
import { useChatSocket } from "../../hooks/useChatSocket";

function Channels() {
  const [newChannel, setNewChannel] = useState<string>("");
  const [channelIds, setChannelIds] = useState<string[]>([]);
  const [channelsData, setChannelsData] = useState<Channel[]>([]);
  const [isPublic, setIsPublic] = useState<boolean>(true);
  const [password, setPassword] = useState<string>("");
  const { user } = useAuth();
  const socket = useChatSocket();

  const changeNewChannel = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewChannel(e.target.value);
  };

  const onCreateChannel = () => {
    socket.emit("createChannel", {
      channelName: newChannel,
      isPublic: isPublic,
      password: password,
    });
    setNewChannel("");
    setIsPublic(true);
    setPassword("");
  };

  useEffect(() => {
    socket.on("newChannel", (channelId: string) => {
      setChannelIds((prevChannelsIds) => [...prevChannelsIds, channelId]);
    });

    socket.on("channelDeleted", (deletedChannelId: string) => {
      setChannelIds((prevChannels) =>
        prevChannels.filter((channelId) => channelId !== deletedChannelId)
      );
    });

    return () => {
      socket.off("newChannel");
      socket.off("channelDeleted");
    };
  }, []);

  useEffect(() => {
    socket.on("allChannels", (channelIds: string[]) => {
      setChannelIds(channelIds);
    });
    socket.emit("getAllChannels");
    return () => {
      socket.off("allChannels");
    };
  }, []);

  useEffect(() => {
    channelIds.forEach((channelId) => {
      socket.emit("joinRoom", { channelId: channelId, getMessages: false });
      socket.on(`channelData:${channelId}`, (channelData: Channel) => {
        console.log("channelData", channelData);
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
          return updatedChannels;
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
          <AddChannelBar
            name={newChannel}
            changeName={changeNewChannel}
            isPublic={isPublic}
            setIsPublic={setIsPublic}
            password={password}
            setPassword={setPassword}
            createChannel={onCreateChannel}
          />
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
