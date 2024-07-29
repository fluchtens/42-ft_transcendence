import { Button } from "@/components/ui/button";
import { DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetClose, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useAuth } from "@/hooks/useAuth";
import { useChatSocket } from "@/hooks/useChatSocket";
import { Channel } from "@/types/chat.interface";
import { useEffect, useState } from "react";
import { BsFillChatDotsFill } from "react-icons/bs";
import { Link } from "react-router-dom";
import { ChannelElement } from "./ChannelElement";
import { CreateChannelBar } from "./CreateChannelBar";

export default function Channels() {
  const [sheetOpen, setSheetOpen] = useState(false);
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
        <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <BsFillChatDotsFill className="h-[1.1rem] w-[1.1rem]" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right">
            <SheetClose asChild>
              <Link to="/" className="text-xl font-semibold text-left">
                <DialogTitle>ft_transcendence</DialogTitle>
                <DialogDescription className="text-sm font-light text-muted-foreground">Multiplayer pong game</DialogDescription>
              </Link>
            </SheetClose>
            <div className="mt-2 max-h-[55.3rem] flex flex-col">
              <CreateChannelBar />
              <ul className="mt-2 overflow-y-scroll flex flex-col">
                {channelsData.map((channel, index) => (
                  <li key={channel.id}>
                    <ChannelElement channel={channel} setSheetOpen={setSheetOpen} />
                    <Separator className={`${index !== channelsData.length - 1 ? "my-1" : "hidden"}`} />
                  </li>
                ))}
              </ul>
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
