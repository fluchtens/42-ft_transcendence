import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { useChatSocket } from "@/hooks/useChatSocket";
import { Channel } from "@/types/chat.interface";
import { notifyError, notifySuccess } from "@/utils/notifications";
import { useState } from "react";

interface UnbanUserDialogProps {
  channel: Channel;
  dialog: boolean;
  setDialog: (value: boolean) => void;
}

export const UnbanUserDialog = ({ channel, dialog, setDialog }: UnbanUserDialogProps) => {
  const [unbanUser, setUnbanUser] = useState<string>("");
  const chatSocket = useChatSocket();

  const changeUnbanUser = (e: React.ChangeEvent<HTMLInputElement>) => {
    setUnbanUser(e.target.value);
  };

  const submitData = (e: React.FormEvent) => {
    e.preventDefault();
    chatSocket.emit("unbanUser", { channelId: channel.id, userToUnban: unbanUser }, (result: string) => {
      if (!result) {
        notifySuccess(unbanUser + " has been unban");
      } else if (result === "Permission denied") {
        notifyError("Permission denied");
      } else {
        notifyError("fail to unban the user");
      }
    });
    closeDialog();
  };

  const closeDialog = () => {
    setDialog(false);
    setUnbanUser("");
  };

  return (
    <Dialog open={dialog} onOpenChange={closeDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Unban a user</DialogTitle>
          <DialogDescription className="hidden"></DialogDescription>
        </DialogHeader>
        <Separator />
        <form className="p-0 flex flex-col gap-3" onSubmit={submitData}>
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-semibold">Username</label>
            <Input type="text" value={unbanUser} onChange={changeUnbanUser} placeholder="Enter a username" required></Input>
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
