import { useState } from "react";
import { Modal } from "../../components/Modal";
import styles from "./CreateChannel.module.scss";

interface CreateChannelProps {
  name: string;
}

const CreateChannel = ({ name }: CreateChannelProps) => {
  const [type, setType] = useState<string>("public");

  const changeType = (type: string) => {
    setType(type);
  };

  return (
    <>
      <div className={styles.container}>
        <form>
          <h1>Create Channel</h1>
          <div className={styles.types}>
            <label>Channel Type</label>
            <div className={styles.type}>
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
            <div className={styles.type}>
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
            <div className={styles.type}>
              <div>
                <label>Protected by a password</label>
                <input
                  type="checkbox"
                  checked={type === "protected"}
                  onChange={() => changeType("protected")}
                />
              </div>
              <p>
                Only members with the channel password will be able to join.
              </p>
            </div>
          </div>
          <div className={styles.inputs}>
            <div className={styles.input}>
              <label>Channel Name</label>
              <input
                type="text"
                value={name}
                // onChange={changeUsername}
                placeholder="Enter a channel name"
                required
              />
            </div>
            {type === "protected" && (
              <div className={styles.input}>
                <label>Password</label>
                <input
                  type="text"
                  value={name}
                  // onChange={changeUsername}
                  placeholder="Enter a channel password"
                  required
                />
              </div>
            )}
          </div>
          <div className={styles.buttons}>
            <button type="button">Cancel</button>
            <button type="submit">Create Channel</button>
          </div>
        </form>
      </div>
    </>
  );
};

export { CreateChannel };
