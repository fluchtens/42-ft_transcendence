import { Member, MemberRole, User } from '@prisma/client';
import { IsNotEmpty, IsString, Length, Matches } from 'class-validator';

export class SendMessageDto {
  @IsNotEmpty({ message: 'Message cannot be empty' })
  @IsString({ message: 'Message must be a string' })
  @Length(1, 2000, {
    message: 'Message must be between 1 and 2000 characters long',
  })
  channelId: string;
  message: string;
}

export class CreateChannelDto {
  @IsNotEmpty({ message: 'Channel name cannot be empty' })
  @IsString({ message: 'Channel name must be a string' })
  @Length(3, 16, {
    message: 'Channel name must be between 3 and 16 characters long',
  })
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
  @IsNotEmpty({ message: 'Username cannot be empty' })
  @IsString({ message: 'Username must be a string' })
  memberUsername: string;
}

export class GetChannelDto {
  channelId: string;
  getMessages: boolean;
  password?: string;
}

export class ChangeRoleDto {
  channelId: string;
  memberId: number;
  newRole: MemberRole;
}

export class ChangeChannelPasswordDto {
  channelId: string;
  password: string;
}

export class KickUserDto {
  channelId: string;
  userIdKick: number;
}

export class ChangeChannelVisibilityDto {
  channelId: string;
  isPublic: boolean;
}

export class BanUserDto {
  channelId: string;
  userIdToBan: number;
}

export class UnbanUserDto {
  channelId: string;
  userToUnban: string;
}

export class MuteUserDto {
  channelId: string;
  userIdToMute: number;
  timeToMute: number;
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
