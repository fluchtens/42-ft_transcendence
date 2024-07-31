import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useChatSocket } from "@/hooks/useChatSocket";
import { Channel } from "@/types/chat.interface";
import { notifyError, notifySuccess } from "@/utils/notifications";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface JoinChannelDialogProps {
  dialog: boolean;
  setDialog: (value: boolean) => void;
  setSheetOpen: (value: boolean) => void;
  channel: Channel;
}

export const JoinChannelDialog = ({ dialog, setDialog, setSheetOpen, channel }: JoinChannelDialogProps) => {
  const [password, setPassword] = useState<string>("");
  const navigate = useNavigate();
  const socket = useChatSocket();

  const handlePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (channel.public && !channel.isMember) {
      socket.emit("joinPublicChannel", { channelId: channel.id, password: password }, (result: string) => {
        if (!result) {
          navigate("/chat/" + channel.id);
          notifySuccess("You has joined the channel");
        } else if (result === "this user is banned") {
          notifyError("You are banned");
        }
      });
    } else {
      socket.emit("connectToProtectedChannel", { channelId: channel.id, password: password }, (result: boolean) => {
        if (result) {
          notifySuccess("You has joined the channel password");
          navigate("/chat/" + channel.id);
        } else {
          notifyError("Wrong password");
        }
      });
    }
    setDialog(false);
    setSheetOpen(false);
    setPassword("");
  };

  const cancel = () => {
    setDialog(false);
    setPassword("");
  };

  return (
    <Dialog open={dialog} onOpenChange={cancel}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Join {channel.name}</DialogTitle>
          <DialogDescription className="hidden"></DialogDescription>
        </DialogHeader>
        <Separator />
        <form onSubmit={submit} className="p-0 flex flex-col gap-3">
          {channel.protected && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Password</label>
              <Input type="password" value={password} onChange={handlePassword} placeholder="Enter the channel password" required />
            </div>
          )}
          <div className="mt-1 md:ml-auto flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={cancel}>
              Cancel
            </Button>
            <Button type="submit">Join</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
