import { Input } from "@/components/ui/input";

interface MessageInputProps {
  content: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const MessageInput = ({ content, onChange, onSubmit }: MessageInputProps) => (
  <form className="p-0 w-full" onSubmit={onSubmit}>
    <Input type="text" placeholder="Type your message..." value={content} onChange={onChange} required className="h-[2.5rem] bg-secondary" />
  </form>
);
