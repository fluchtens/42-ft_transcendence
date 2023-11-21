import styles from "./MessageInput.module.scss";

interface MessageInputProps {
  content: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const MessageInput = ({ content, onChange, onSubmit }: MessageInputProps) => (
  <form className={styles.messageInput} onSubmit={onSubmit}>
    <input
      type="text"
      placeholder="Type your message..."
      value={content}
      onChange={onChange}
      required
    />
  </form>
);

export { MessageInput };
