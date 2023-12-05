import { useState } from "react";
import { Modal } from "../../components/Modal";
import styles from "./CreateChannel.module.scss";
import { notifyError, notifySuccess } from "../../utils/notifications";
import { useChatSocket } from "../../hooks/useChatSocket";

interface CreateChannelProps {
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
  closeModal: () => void;
}

const CreateChannel = ({
  newChannel,
  setNewChannel,
  closeModal,
}: CreateChannelProps) => {
  const [isProtected, setIsProtected] = useState<boolean>(false);
  const socket = useChatSocket();

  const changeIsProtected = () => {
    setIsProtected(!isProtected);
  };

  const changeName = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewChannel((prevEditChannel) => ({
      ...prevEditChannel,
      name: e.target.value,
    }));
  };

  const changeStatus = () => {
    setNewChannel((prevEditChannel) => ({
      ...prevEditChannel,
      isPublic: !prevEditChannel.isPublic,
    }));
  };

  const changePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewChannel((prevEditChannel) => ({
      ...prevEditChannel,
      password: e.target.value,
    }));
  };

  const resetProperties = () => {
    setNewChannel({
      name: "",
      isPublic: true,
      password: "",
    });
  };

  const createChannel = () => {
    socket.emit("createChannel", {
      channelName: newChannel.name,
      isPublic: newChannel.isPublic,
      password: newChannel.password,
    }, (result: string) => {
      if (!result) {
        notifySuccess("Channel successfully created");
      }
      else if (result === 'invalid input') {
        notifyError('Invalid input')
      }
    });
  };

  const submitData = (e: React.FormEvent) => {
    e.preventDefault();
    createChannel();
    closeModal();
    resetProperties();
  };

  return (
    <Modal>
      <form className={styles.form} onSubmit={submitData}>
        <h1>Create Channel</h1>
        <div className={styles.types}>
          <label>Channel Type</label>
          <div className={styles.type} onClick={changeIsProtected}>
            <div>
              <label>Protected by a password</label>
              <input
                type="checkbox"
                checked={isProtected === true}
                onChange={changeIsProtected}
              />
            </div>
            <p>Only members with the channel password will be able to join.</p>
          </div>
          <div className={styles.type} onClick={changeStatus}>
            <div>
              <label>Private Channel</label>
              <input
                type="checkbox"
                checked={newChannel.isPublic === false}
                onChange={changeStatus}
              />
            </div>
            <p>
              Only selected members and roles will be able to view this channel.
            </p>
          </div>
        </div>
        <div className={styles.inputs}>
          <div className={styles.input}>
            <label>Channel Name</label>
            <input
              type="text"
              value={newChannel.name}
              onChange={changeName}
              placeholder="Enter a channel name"
              required
            />
          </div>
          {isProtected === true && (
            <div className={styles.input}>
              <label>Channel Password</label>
              <input
                type="password"
                value={newChannel.password}
                onChange={changePassword}
                placeholder="Enter a channel password"
                required
              />
            </div>
          )}
        </div>
        <div className={styles.buttons}>
          <button type="button" onClick={closeModal}>
            Cancel
          </button>
          <button type="submit">Create Channel</button>
        </div>
      </form>
    </Modal>
  );
};

export { CreateChannel };
