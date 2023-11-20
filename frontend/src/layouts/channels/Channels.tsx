import { useAuth } from "../../utils/useAuth";
import { ChannelElement } from "./ChannelElement";
import { AddChannelBar } from "./AddChannelBar";
import styles from "./Channels.module.scss";
import { useState } from "react";
import { channelsData } from "./_chat.dummy.data";

function Channels() {
  const [newChannel, setNewChannel] = useState<string>("");
  const { user } = useAuth();

  const changeNewChannel = (e: React.ChangeEvent<HTMLInputElement>) => {
    setNewChannel(e.target.value);
  };

  return (
    <>
      {user && (
        <div className={styles.container}>
          <AddChannelBar name={newChannel} changeName={changeNewChannel} />
          <ul>
            {channelsData.map((channel) => (
              <li key={channel.id}>
                <ChannelElement name={channel.name} status={channel.status} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

export default Channels;
