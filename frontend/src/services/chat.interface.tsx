
interface SendMessageDto {
  userId: number;
  channelId: string;
  message: string;
}

interface Messages {
  userId: number;
  messageId: string;
  content: string;
  edited: boolean;
}

interface ChannelData {
  channelId: string;
  channelName: string;
  inviteCode?: string;
  messages: Messages [];
  members: any [];
}