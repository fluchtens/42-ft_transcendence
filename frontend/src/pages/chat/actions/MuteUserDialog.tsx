import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useChatSocket } from "@/hooks/useChatSocket";
import { Channel } from "@/types/chat.interface";
import { User } from "@/types/user.interface";
import { notifyError, notifySuccess } from "@/utils/notifications";
import { useState } from "react";

interface MuteUserDialogProps {
  memberId: number;
  member: User;
  channel: Channel;
  dialog: boolean;
  setDialog: (value: boolean) => void;
}

export const MuteUserDialog = ({ memberId, channel, dialog, setDialog }: MuteUserDialogProps) => {
  const [time, setTime] = useState<number>(0);
  const chatSocket = useChatSocket();

  const handleTime = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTime(e.target.valueAsNumber);
  };

  const submitData = (e: React.FormEvent) => {
    e.preventDefault();
    chatSocket.emit(
      "muteUser",
      {
        channelId: channel.id,
        userIdToMute: memberId,
        timeToMute: time,
      },
      (result: string) => {
        if (!result) {
          notifySuccess("muteUser");
        } else {
          notifyError(result);
        }
      }
    );
    closeDialog();
  };

  const closeDialog = () => {
    setDialog(false);
    setTime(0);
  };

  return (
    <Dialog open={dialog} onOpenChange={closeDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Mute</DialogTitle>
          <DialogDescription className="hidden"></DialogDescription>
        </DialogHeader>
        <Separator />
        <form className="p-0 flex flex-col gap-3" onSubmit={submitData}>
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-semibold">Mute time (in minutes)</label>
            <Input type="number" value={time} onChange={handleTime} placeholder="Enter a mute time" required></Input>
          </div>
          <div className="t-1.5 md:ml-auto flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={closeDialog}>
              Cancel
            </Button>
            <Button type="submit">Confirm</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
