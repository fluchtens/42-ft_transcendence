import { User } from "./user.interface";

export interface Channel {
  id: string;
  name: string;
  inviteCode?: string;
  public: boolean;
  protected: boolean;
  messages: Messages[];
  members: any[];
}

export interface Message {
  id: string;
  content: string;
  userId: number;
  user?: User | null;
}
