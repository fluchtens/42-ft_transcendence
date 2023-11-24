import { useState } from "react";
import { Modal } from "../../components/Modal";
import styles from "./CreateChannel.module.scss";
import { notifySuccess } from "../../utils/notifications";

interface CreateChannelProps {
  name: string;
  changeName: (e: React.ChangeEvent<HTMLInputElement>) => void;
  createChannel: () => void;
  closeModal: () => void;
}

const CreateChannel = ({
  name,
  changeName,
  createChannel,
  closeModal,
}: CreateChannelProps) => {
  const [type, setType] = useState<string>("public");
  const [password, setPassword] = useState<string>("");

  const changeType = (type: string) => {
    setType(type);
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
          <div className={styles.type} onClick={() => changeType("public")}>
            <div>
              <label>Public</label>
              <input
                type="checkbox"
                checked={type === "public"}
                onChange={() => changeType("public")}
              />
            </div>
            <p>Anyone can join the channel.</p>
          </div>
          <div className={styles.type} onClick={() => changeType("private")}>
            <div>
              <label>Private</label>
              <input
                type="checkbox"
                checked={type === "private"}
                onChange={() => changeType("private")}
              />
            </div>
            <p>Only selected members will be able to join the channel.</p>
          </div>
          <div className={styles.type} onClick={() => changeType("protected")}>
            <div>
              <label>Protected by a password</label>
              <input
                type="checkbox"
                checked={type === "protected"}
                onChange={() => changeType("protected")}
              />
            </div>
            <p>Only members with the channel password will be able to join.</p>
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
          {type === "protected" && (
            <div className={styles.input}>
              <label>Password</label>
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
