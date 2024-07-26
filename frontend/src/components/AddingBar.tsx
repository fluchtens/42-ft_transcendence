import { IoPersonAddSharp } from "react-icons/io5";

interface AddUserBarProps {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onSubmit: (e: React.FormEvent) => void;
}

const AddUserBar = ({ value, onChange, onSubmit }: AddUserBarProps) => (
  <form className="" onSubmit={onSubmit}>
    <input type="text" value={value} onChange={onChange} required />
    <button type="submit">
      <IoPersonAddSharp className="" />
    </button>
  </form>
);

export { AddUserBar };
