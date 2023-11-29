import { Member, User } from '@prisma/client';

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
  memberUsername: string;
}

export class GetChannelDto {
  channelId: string;
  getMessages: boolean;
  password?: string;
}

export class Messages {
  id: string;
  content: string;
  userId: number;
  user?: Partial<User>;
  constructor(
    messageId: string,
    content: string,
    userId: number,
    user?: Partial<User>,
  ) {
    this.id = messageId;
    this.content = content;
    this.userId = userId;
    this.user = user;
  }
}

export class MemberDto {
  member: Member;
  user: Partial<User>;
  constructor(member: Member, user: Partial<User>) {
    this.member = member;
    this.user = user;
  }
}

export class ChannelData {
  id: string;
  name: string;
  isMember: boolean;
  isConnected: boolean;
  inviteCode?: string;
  public: boolean;
  protected: boolean;
  messages: Messages[];
  members: any[];
}
