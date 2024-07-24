import { PlusIcon } from "@radix-ui/react-icons";
import { useState } from "react";
import { IoPersonAddSharp } from "react-icons/io5";
import { CreateChannel } from "../pages/channels/actions/CreateChannel";
import styles from "./AddingBar.module.scss";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface AddUserBarProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const AddUserBar = ({ value, onChange, onSubmit }: AddUserBarProps) => (
  <form className={styles.form} onSubmit={onSubmit}>
    <input type="text" value={value} onChange={onChange} required />
    <button type="submit">
      <IoPersonAddSharp className={styles.icon} />
    </button>
  </form>
);

const AddChannelBar = () => {
  const [modal, setModal] = useState<boolean>(false);
  const [newChannel, setNewChannel] = useState({
    name: "",
    isPublic: true,
    password: "",
  });

  const openModal = (e: React.FormEvent) => {
    e.preventDefault();
    setModal(true);
  };

  const closeModal = () => {
    setModal(false);
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
        <Input type="text" value={newChannel.name} onChange={changeName} placeholder="Enter a channel name" required></Input>
        <Button type="submit" size="icon" variant="outline">
          <PlusIcon className="w-[1.2rem] h-[1.2rem]" />
          {/* <FaPlus className="w[1.2rem] h-[1.2rem]" /> */}
        </Button>
      </form>
      {modal && <CreateChannel newChannel={newChannel} setNewChannel={setNewChannel} closeModal={closeModal} />}
    </>
  );
};

export { AddChannelBar, AddUserBar };
