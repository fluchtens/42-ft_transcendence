import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { IoPersonAddSharp } from "react-icons/io5";

interface AddMemberBarProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

export const AddMemberBar = ({ value, onChange, onSubmit }: AddMemberBarProps) => (
  <form className="flex items-center gap-1" onSubmit={onSubmit}>
    <Input type="text" value={value} onChange={onChange} required />
    <Button type="submit" size="icon" variant="outline">
      <IoPersonAddSharp className="w-[1rem] h-[1rem]" />
    </Button>
  </form>
);
