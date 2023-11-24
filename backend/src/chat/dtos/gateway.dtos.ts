export class SendMessageDto {
  channelId: string;
  message: string;
}

export class CreateChannelDto {
  channelName: string;
  isPublic: boolean;
  password?: string;
}

export class DeleteMessageDto {
  channelId: string;
  messageId: string;
}

export class ChangeMessageDto {
  channelId: string;
  messageId: string;
  newMessage: string;
}

export class AddMemberDto {
  channelId: string;
  memberId: number;
}

export class GetChannelDto {
  channelId: string;
  password?: string;
}

export class Messages {
  userId: number;
  id: string;
  content: string;
  edited: boolean;
  constructor(
    messageId: string,
    content: string,
    edited: boolean,
    userId: number,
  ) {
    this.id = messageId;
    this.content = content;
    this.edited = edited;
    this.userId = userId;
  }
}

export class ChannelData {
  id: string;
  name: string;
  inviteCode?: string;
  public: boolean;
  protected: boolean;
  messages: Messages[];
  members: any[];
}
