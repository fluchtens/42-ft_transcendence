import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { CreateChannelDialog } from "./CreateChannelDialog";

export const CreateChannelBar = () => {
  const [dialog, setDialog] = useState<boolean>(false);
  const [newChannel, setNewChannel] = useState({
    name: "",
    isPublic: true,
    password: "",
  });

  const openModal = (e: React.FormEvent) => {
    e.preventDefault();
    setDialog(true);
  };

  const changeName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewChannel((prevEditChannel) => ({
      ...prevEditChannel,
      name: e.target.value,
    }));
  };

  return (
    <>
      <form className="flex items-center gap-1" onSubmit={openModal}>
        <Input type="text" value={newChannel.name} onChange={changeName} placeholder="Enter a channel name" required />
        <Button type="submit" size="icon" variant="outline">
          <PlusIcon className="w-[1.2rem] h-[1.2rem]" />
        </Button>
      </form>
      <CreateChannelDialog dialog={dialog} setDialog={setDialog} newChannel={newChannel} setNewChannel={setNewChannel} />
    </>
  );
};
