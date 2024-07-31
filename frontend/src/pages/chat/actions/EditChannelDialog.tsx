import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { useChatSocket } from "@/hooks/useChatSocket";
import { Channel } from "@/types/chat.interface";
import { notifyError, notifySuccess } from "@/utils/notifications";
import { useNavigate } from "react-router-dom";

interface EditChannelDialogProps {
  editChannel: {
    name: string;
    isPublic: boolean;
    protected: boolean;
    password: string;
  };
  setEditChannel: React.Dispatch<
    React.SetStateAction<{
      name: string;
      isPublic: boolean;
      protected: boolean;
      password: string;
    }>
  >;
  channel: Channel;
  dialog: boolean;
  setDialog: (value: boolean) => void;
}

export const EditChannelDialog = ({ editChannel, setEditChannel, channel, dialog, setDialog }: EditChannelDialogProps) => {
  const socket = useChatSocket();
  const navigate = useNavigate();

  const changeName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditChannel((prevEditChannel) => ({
      ...prevEditChannel,
      name: e.target.value,
    }));
  };

  const changeStatus = () => {
    setEditChannel((prevEditChannel) => ({
      ...prevEditChannel,
      isPublic: !prevEditChannel.isPublic,
    }));
  };

  const changeProtected = () => {
    setEditChannel((prevEditChannel) => ({
      ...prevEditChannel,
      protected: !prevEditChannel.protected,
    }));
  };

  const changePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditChannel((prevEditChannel) => ({
      ...prevEditChannel,
      password: e.target.value,
    }));
  };

  const closeDialog = () => {
    setDialog(false);
    setEditChannel({
      name: channel.name,
      isPublic: channel.public,
      protected: channel.protected,
      password: "",
    });
  };

  const deleteChannel = () => {
    socket.emit("deleteChannel", channel.id, (result: string) => {
      if (result) {
        notifyError(result);
      } else {
        navigate("/");
        notifySuccess("Channel successfully deleted");
      }
    });
    closeDialog();
  };

  const submitData = (e: React.FormEvent) => {
    e.preventDefault();
    // ta functui
    if (editChannel.name !== channel.name) {
      socket.emit("changeChannelname", { channelName: editChannel.name, channelId: channel.id }, (result: string) => {
        if (result === "Invalid input") {
          notifyError(result);
        } else if (!result) {
          notifySuccess("channelName change to " + editChannel.name);
        }
      });
    }
    if (editChannel.password !== "") {
      socket.emit(
        "protectChannel",
        {
          channelId: channel.id,
          password: editChannel.password,
        },
        (result: string) => {
          if (result === "You are not the chat owner") {
            notifyError(result);
          } else if (!result) {
            notifySuccess("Password Changed");
          }
        }
      );
    }
    if (channel.protected && !editChannel.protected) {
      socket.emit(
        "deteleChannelProtection",
        {
          channelId: channel.id,
        },
        (result: string) => {
          if (result === "You are not the chat owner") {
            notifyError(result);
          } else if (!result) {
            notifySuccess("Password Changed");
          } else {
            notifyError("result");
          }
        }
      );
    }
    if (editChannel.isPublic !== channel.public) {
      socket.emit("changeChannelVisibility", { channelId: channel.id, isPublic: editChannel.isPublic }, (result: string) => {
        if (!result) {
          notifySuccess("Channel successfully updated");
        } else {
          notifyError("Failed to change channel visibility");
        }
      });
    }
    closeDialog();
  };

  return (
    <Dialog open={dialog} onOpenChange={closeDialog}>
      <DialogContent onOpenAutoFocus={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">Edit Channel</DialogTitle>
          <DialogDescription className="hidden"></DialogDescription>
        </DialogHeader>
        <Separator />
        <form className="p-0 flex flex-col gap-3" onSubmit={submitData}>
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-semibold">Confidentiality</label>
            <div className="px-4 py-3 rounded-md border cursor-pointer">
              <div className="flex justify-between items-center gap-3">
                <div>
                  <label className="text-sm font-medium">Protected by a password</label>
                  <p className="text-xs font-normal text-muted-foreground">Only members with the channel password will be able to join.</p>
                </div>
                <Switch checked={editChannel.protected} onClick={changeProtected} />
              </div>
            </div>
            <div className="px-4 py-3 rounded-md border cursor-pointer">
              <div className="flex justify-between items-center gap-3">
                <div>
                  <label className="text-sm font-medium">Private</label>
                  <p className="text-xs font-normal text-muted-foreground">Only selected members and roles will be able to view this channel.</p>
                </div>
                <Switch checked={!editChannel.isPublic} onClick={changeStatus} />
              </div>
            </div>
          </div>
          <div className="flex flex-col gap-1.5 w-full">
            <label className="text-sm font-semibold">Name</label>
            <Input type="text" value={editChannel.name} onChange={changeName} placeholder="Enter a channel name" required></Input>
          </div>
          {editChannel.protected && (
            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-sm font-semibold">Password</label>
              <Input type="password" value={editChannel.password} onChange={changePassword} placeholder="Enter a channel password" required></Input>
            </div>
          )}
          <div className="mt-1.5 flex justify-between items-center gap-2">
            <Button type="button" onClick={deleteChannel} variant="destructive">
              Delete
            </Button>
            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" onClick={closeDialog}>
                Cancel
              </Button>
              <Button type="submit">Confirm</Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
