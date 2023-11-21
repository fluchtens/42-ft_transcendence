import { User } from "./user.interface";

export interface Message {
  id: string;
  content: string;
  userId: number;
  user?: User;
}
