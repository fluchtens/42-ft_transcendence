import { User } from "./user.interface";

export interface Channel {
  id: string;
  name: string;
  isMember: boolean;
  isConnected: boolean;
  inviteCode?: string;
  public: boolean;
  protected: boolean;
  messages: Messages[];
  members: MemberUsers[];
}

export interface Message {
  id: string;
  content: string;
  userId: number;
  user?: User | null;
}

export interface Member {
  id: string;
  role: string;
  userId: number;
  channelId: string;
  silencedTime: Date;
  CreatedAt: Date;
  updatedAt: Date;
}

export interface MemberUsers {
  member: Member;
  user: User;
}
