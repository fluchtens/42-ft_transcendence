export interface Channel {
  id: string;
  name: string;
  inviteCode?: string;
  public: boolean;
  protected: boolean;
  messages: Messages[];
  members: any[];
}

interface Messages {
  userId: number;
  id: string;
  content: string;
  edited: boolean;
}
