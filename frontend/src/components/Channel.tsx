import { useState } from "react";

interface ChannelComponentProps {
  channel: ChannelData;
}

const ChannelComponent: React.FC<ChannelComponentProps> = ({ channel }) => {
  const [messageInput, setMessageInput] = useState('');

  const onSendMessage = () => {
    console.log(`Sending message: ${messageInput}`);
    //fonction to send a message, do after
    setMessageInput('');
  };
  
  return (
    <div className="channel-container">
      <div className="channel-header">
        {channel.channelName}
      </div>
      <div className="message-list">
        {channel.messages.map((message, index) => (
          <div key={index} className="message">
            {message.userId}: {message.content}
          </div>
        ))}
      </div>
      <div className="message-input">
        <input type="text" placeholder="Type your message" value={messageInput} onChange={(e) => setMessageInput(e.target.value)}/>
        <button onClick={onSendMessage}>
          Send
        </button>
      </div>
    </div>
  );
};

export default ChannelComponent;