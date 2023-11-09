import { useContext, useEffect, useState } from "react"
import { WebsocketContext } from "../services/chat.socket";


export const  Websocket = () => {

  const [value, setValue] = useState("")
  const socket = useContext(WebsocketContext);
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected!');
    });
    socket.on('sendMessage', (data: any) => {
      console.log('sendMessage event received!');
      console.log(data);
    });

    return () => {
      console.log('Unregistering Events...');
      socket.off('connect');
      socket.off('sendMessage');
    };
  }, []);

  const onSubmit = () => {
    console.log(value);
    // socket.emit('createChannel', value);
    socket.emit('getAllChannels');
    socket.on('allChannels', (channels) => {
      console.log('Received all channels:', channels);
      channels.forEach((channel: any) => {
       socket.emit('joinChannel', channel.id);
      });
    })
    setValue('');
  }
  return (
    <div>
        <div>
    <ul>
     
    </ul>
  </div>
      <div>
        <h1> Websocket </h1>
        <input type="text" value={value} onChange={(e) => setValue(e.target.value)}/>
        <button onClick={onSubmit}>Submit</button>
      </div>
    </div>
  )
}
