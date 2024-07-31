import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useChatSocket } from "@/hooks/useChatSocket";
import { notifyError, notifySuccess } from "@/utils/notifications";
import { useState } from "react";

interface CreateChannelDialogProps {
  dialog: boolean;
  setDialog: (value: boolean) => void;
  newChannel: {
    name: string;
    isPublic: boolean;
    password: string;
  };
  setNewChannel: React.Dispatch<
    React.SetStateAction<{
      name: string;
      isPublic: boolean;
      password: string;
    }>
  >;
}

export const CreateChannelDialog = ({ dialog, setDialog, newChannel, setNewChannel }: CreateChannelDialogProps) => {
  const [havePassword, setHavePassword] = useState<boolean>(false);
  const socket = useChatSocket();

  const handleHavePassword = () => {
    setHavePassword(!havePassword);
  };

  const handleName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewChannel((prevEditChannel) => ({
      ...prevEditChannel,
      name: e.target.value,
    }));
  };

  const handleIsPublic = () => {
    setNewChannel((prevEditChannel) => ({
      ...prevEditChannel,
      isPublic: !prevEditChannel.isPublic,
    }));
  };

  const handlePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewChannel((prevEditChannel) => ({
      ...prevEditChannel,
      password: e.target.value,
    }));
  };

  const resetProperties = () => {
    setHavePassword(false);
    setNewChannel((prevEditChannel) => ({
      ...prevEditChannel,
      name: "",
      isPublic: true,
      password: "",
    }));
  };

  const cancel = () => {
    setDialog(false);
    resetProperties();
  };

  const createChannel = () => {
    socket.emit(
      "createChannel",
      {
        channelName: newChannel.name,
        isPublic: newChannel.isPublic,
        password: newChannel.password,
      },
      (result: string) => {
        if (!result) {
          notifySuccess("Channel successfully created");
        } else if (result === "invalid input") {
          notifyError("Invalid input");
        }
      }
    );
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    createChannel();
    setDialog(false);
    resetProperties();
  };

  return (
    <Dialog open={dialog} onOpenChange={cancel}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Create channel</DialogTitle>
          <DialogDescription className="text-sm font-normal">Create a real-time chat room.</DialogDescription>
        </DialogHeader>
        <Separator />
        <form onSubmit={submit} className="p-0 flex flex-col gap-3">
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold">Confidentiality</label>
            <div className="px-4 py-3 rounded-md border cursor-pointer">
              <div className="flex justify-between items-center gap-3">
                <div>
                  <label className="text-sm font-medium">Protected by a password</label>
                  <p className="text-xs font-normal text-muted-foreground">Only members with the channel password will be able to join.</p>
                </div>
                <Switch checked={havePassword} onClick={handleHavePassword} />
              </div>
            </div>
            <div className="px-4 py-3 rounded-md border cursor-pointer">
              <div className="flex justify-between items-center gap-3">
                <div>
                  <label className="text-sm font-medium">Private</label>
                  <p className="text-xs font-normal text-muted-foreground">Only selected members and roles will be able to view this channel.</p>
                </div>
                <Switch checked={!newChannel.isPublic} onClick={handleIsPublic} />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold">Name</label>
            <Input type="text" value={newChannel.name} onChange={handleName} placeholder="Enter a channel name" required></Input>
          </div>
          {havePassword && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-semibold">Password</label>
              <Input type="password" value={newChannel.password} onChange={handlePassword} placeholder="Enter a channel password" required></Input>
            </div>
          )}
          <div className="mt-1.5 md:ml-auto flex items-center gap-2">
            <Button type="button" variant="ghost" onClick={cancel}>
              Cancel
            </Button>
            <Button type="submit">Confirm</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
