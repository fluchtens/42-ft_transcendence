import { User } from "./user.interface";

export interface Message {
  content: string;
  userId: number;
  user?: User;
}
