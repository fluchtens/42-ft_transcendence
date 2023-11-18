import { useAuth } from "../../utils/useAuth";
import { ChannelElement } from "./ChannelElement";
import { CreateChannel } from "./CreateChannel";
import styles from "./Channels.module.scss";

const channelsData = [
  { id: 1, name: "Creators Area ", status: "Public" },
  { id: 2, name: "Project Lumos", status: "Password" },
  { id: 3, name: "Les momos", status: "Private" },
  { id: 4, name: "fluchten's channel", status: "Private" },
  { id: 1, name: "Creators Area ", status: "Public" },
  { id: 2, name: "Project Lumos", status: "Password" },
  { id: 3, name: "Les momos", status: "Private" },
  { id: 4, name: "fluchten's channel", status: "Private" },
  { id: 1, name: "Creators Area ", status: "Public" },
  { id: 2, name: "Project Lumos", status: "Password" },
  { id: 3, name: "Les momos", status: "Private" },
  { id: 4, name: "fluchten's channel", status: "Private" },
  { id: 1, name: "Creators Area ", status: "Public" },
  { id: 2, name: "Project Lumos", status: "Password" },
  { id: 3, name: "Les momos", status: "Private" },
  { id: 4, name: "fluchten's channel", status: "Private" },
  { id: 1, name: "Creators Area ", status: "Public" },
  { id: 2, name: "Project Lumos", status: "Password" },
  { id: 3, name: "Les momos", status: "Private" },
  { id: 4, name: "fluchten's channel", status: "Private" },
];

function Channels() {
  const { user } = useAuth();

  return (
    <>
      {user && (
        <div className={styles.container}>
          <CreateChannel />
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
