import { useState } from "react";
import { Modal } from "../../components/Modal";
import styles from "./EditChannel.module.scss";
import { notifyError, notifySuccess } from "../../utils/notifications";
import { Channel } from "../../types/chat.interface";
import { useChatSocket } from "../../hooks/useChatSocket";
import { useNavigate } from "react-router-dom";

interface EditChannelProps {
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
  closeModal: () => void;
  channel: Channel;
}

const EditChannel = ({
  editChannel,
  setEditChannel,
  closeModal,
  channel,
}: EditChannelProps) => {
  // const [isProtected, setIsProtected] = useState<boolean>(false);

  // const changeIsProtected = () => {
  //   setIsProtected(!isProtected);
  // };

  const socket = useChatSocket();

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

  const navigate = useNavigate();

  const cancel = () => {
    closeModal();
    resetProperties();
  };

  const resetProperties = () => {
    setEditChannel({
      name: channel.name,
      isPublic: channel.public,
      protected: channel.protected,
      password: "",
    });
  };

  const deleteChannel = () => {
    console.log(channel.id);
    socket.emit("deleteChannel", channel.id, (result: string) => {
      if (result) {
        notifyError(result);

      } else {
        navigate("/");
        notifySuccess("Channel successfully deleted");
      }
    });
    closeModal();
    resetProperties();
  };

  const submitData = (e: React.FormEvent) => {
    e.preventDefault();
    // ta functui
    if (editChannel.password !== "") {
      socket.emit("protectChannel", {
        channelId: channel.id, password: editChannel.password
      }, (result: string) => {
        if (result) {
          // notifySuccess("Password Changed");
        }
        else {
          // notifyError(result);
        }
      });
    }
    socket.emit('changeChannelVisibility', {channelId: channel.id, isPublic:editChannel.isPublic});
    closeModal();
    resetProperties();
    notifySuccess("Channel successfully updated");
  };

  return (
    <Modal>
      <form className={styles.form} onSubmit={submitData}>
        <h1>Edit Channel</h1>
        <div className={styles.types}>
          <label>Channel Type</label>
          <div className={styles.type} onClick={changeProtected}>
            <div>
              <label>Protected by a password</label>
              <input
                type="checkbox"
                checked={editChannel.protected === true}
                onChange={changeProtected}
              />
            </div>
            <p>Only members with the channel password will be able to join.</p>
          </div>
          <div className={styles.type} onClick={changeStatus}>
            <div>
              <label>Private Channel</label>
              <input
                type="checkbox"
                checked={editChannel.isPublic === false}
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
              value={editChannel.name}
              onChange={changeName}
              placeholder="Enter a channel name"
              required
            />
          </div>
          {editChannel.protected === true && (
            <div className={styles.input}>
              <label>Channel Password</label>
              <input
                type="password"
                value={editChannel.password}
                onChange={changePassword}
                placeholder="Enter a channel password"
              />
            </div>
          )}
        </div>
        <div className={styles.buttons}>
          <button
            className={styles.delete}
            type="button"
            onClick={deleteChannel}
          >
            Delete Channel
          </button>

          <div className={styles.rightBtns}>
            <button className={styles.cancel} type="button" onClick={cancel}>
              Cancel
            </button>
            <button className={styles.edit} type="submit">
              Edit Channel
            </button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export { EditChannel };
