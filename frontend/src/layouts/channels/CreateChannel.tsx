import { Dispatch, SetStateAction, useState } from "react";
import { Modal } from "../../components/Modal";
import styles from "./CreateChannel.module.scss";
import { notifySuccess } from "../../utils/notifications";

interface CreateChannelProps {
  name: string;
  changeName: (e: React.ChangeEvent<HTMLInputElement>) => void;
  isPublic: boolean;
  setIsPublic: Dispatch<SetStateAction<boolean>>;
  password: string;
  setPassword: Dispatch<SetStateAction<string>>;
  createChannel: () => void;
  closeModal: () => void;
}

const CreateChannel = ({
  name,
  changeName,
  isPublic,
  setIsPublic,
  password,
  setPassword,
  createChannel,
  closeModal,
}: CreateChannelProps) => {
  const [isProtected, setIsProtected] = useState<boolean>(false);

  const changeStatus = () => {
    setIsPublic(!isPublic);
  };

  const changeIsProtected = () => {
    setIsProtected(!isProtected);
  };

  const changePassword = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
  };

  const submitData = (e: React.FormEvent) => {
    e.preventDefault();
    createChannel();
    closeModal();
    notifySuccess("Channel successfully created");
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
                checked={isPublic === false}
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
              value={name}
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
                value={password}
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
