import { useState } from "react";
import { Modal } from "../../components/Modal";
import styles from "./EditChannel.module.scss";
import { notifySuccess } from "../../utils/notifications";

interface EditChannelProps {
  editChannel: {
    name: string;
    isPublic: boolean;
    password: string;
  };
  setEditChannel: React.Dispatch<
    React.SetStateAction<{
      name: string;
      isPublic: boolean;
      password: string;
    }>
  >;
  closeModal: () => void;
}

const EditChannel = ({
  editChannel,
  setEditChannel,
  closeModal,
}: EditChannelProps) => {
  const [isProtected, setIsProtected] = useState<boolean>(false);

  const changeIsProtected = () => {
    setIsProtected(!isProtected);
  };

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

  const changePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditChannel((prevEditChannel) => ({
      ...prevEditChannel,
      password: e.target.value,
    }));
  };

  const resetProperties = () => {
    setEditChannel({
      name: "",
      isPublic: true,
      password: "",
    });
  };

  const submitData = (e: React.FormEvent) => {
    e.preventDefault();
    closeModal();
    resetProperties();
    notifySuccess("Channel successfully created");
  };

  return (
    <Modal>
      <form className={styles.form} onSubmit={submitData}>
        <h1>Edit Channel</h1>
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
          {isProtected === true && (
            <div className={styles.input}>
              <label>Channel Password</label>
              <input
                type="password"
                value={editChannel.password}
                onChange={changePassword}
                placeholder="Enter a channel password"
                required
              />
            </div>
          )}
        </div>
        <div className={styles.buttons}>
          <button className={styles.delete}>Delete Channel</button>

          <div className={styles.rightBtns}>
            <button type="button" onClick={closeModal}>
              Cancel
            </button>
            <button type="submit">Edit Channel</button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export { EditChannel };
