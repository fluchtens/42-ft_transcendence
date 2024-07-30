
interface SendMessageDto {
  userId: number;
  channelId: string;
  message: string;
}

interface CreateChannel {
  channelName: string;
  isPublic: boolean;
  password?: string;
}

interface Messages {
  userId: number;
  id: string;
  content: string;
  edited: boolean;
}

interface ChannelData {
  channelId: string;
  channelName: string;
  inviteCode?: string;
  public: boolean;
  protected: boolean;
  messages: Messages [];
  members: any [];
}