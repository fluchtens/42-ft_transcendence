import { AddChannelBar } from "@/components/AddingBar";
import { Button } from "@/components/ui/button";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { HamburgerMenuIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useChatSocket } from "../../hooks/useChatSocket";
import { Channel } from "../../types/chat.interface";
import { ChannelElement } from "./ChannelElement";

function Channels() {
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
      setChannelIds((prevChannels) => prevChannels.filter((channelId) => channelId !== deletedChannelId));
    });

    socket.on("resetChannel", (channelId: string) => {
      socket.emit("getChannelStatus", channelId, (channel: Channel) => {
        setChannelsDataRaw((prevChannelsData) => {
          const updatedChannels = [...prevChannelsData];
          if (!channel.isMember && !channel.public) {
            const updatedChannels = prevChannelsData.filter((channelData) => channelData.id !== channel.id);
            return updatedChannels;
          }
          const channelIndex = updatedChannels.findIndex((channel) => channel.id === channelId);
          if (channelIndex !== -1) {
            if (channel.isMember || channel.public) {
              updatedChannels[channelIndex] = channel;
            } else {
              const filteredChannels = updatedChannels.filter((channel) => channel.id !== channelId);
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
  }, [channelsDataRaw]);

  useEffect(() => {
    socket.emit("getChannelInitialData", channelIds, (channels: Channel[]) => {
      setChannelsDataRaw(channels);
    });
    return () => {};
  }, [channelIds]);

  return (
    <>
      {user && (
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="outline" size="icon">
              <HamburgerMenuIcon className="h-[1.1rem] w-[1.1rem]" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <SheetClose asChild>
              <Link to="/" className="text-xl font-semibold text-left">
                <DialogTitle>ft_transcendence</DialogTitle>
                <DialogDescription className="text-sm font-light text-muted-foreground">Multiplayer pong game</DialogDescription>
              </Link>
            </SheetClose>
            <div className="mt-2 max-h-[59rem] flex flex-col">
              <AddChannelBar />
              <ul className="mt-2 overflow-y-scroll">
                {channelsData.map((channel) => (
                  <SheetClose asChild>
                    <li key={channel.id}>
                      <ChannelElement channel={channel} />
                    </li>
                  </SheetClose>
                ))}
              </ul>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}

export default Channels;
