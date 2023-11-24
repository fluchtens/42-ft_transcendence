import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Channel, Member, MemberRole, Message } from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class ChatService {
  constructor(private readonly prismaService: PrismaService) {}

  async getChannelById(
    channelId: string,
    password?: string,
    connected?: boolean,
  ): Promise<Partial<Channel>> {
    try {
      if (!channelId) throw new BadRequestException('invalid channelId');
      const channel = await this.prismaService.channel.findUnique({
        where: {
          id: channelId,
        },
      });
      if (!channel) {
        throw new NotFoundException('Channel not found');
      }
      const sanitizedChannel: Partial<Channel> = {
        id: channel.id,
        name: channel.name,
        public: channel.public,
        password: 'true',
      };
      if (channel.password && !connected) {
        if (!password) {
          return sanitizedChannel;
        }
        const matchPwd = await bcrypt.compare(password, channel.password);
        console.log(password);
        if (matchPwd) {
          return channel;
        } else {
          throw new BadRequestException('wrong password');
        }
      }
      return channel;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async getChannelMembers(channelId: string) {
    try {
      const channelMembers = await this.prismaService.member.findMany({
        where: {
          channelId: channelId,
        },
        include: {
          user: true,
        },
      });
      return channelMembers;
    } catch (error) {
      console.error('Error getting channel members:', error.message);
      throw error;
    }
  }

  async findMemberRoleInChannel(
    channelId: string,
    userId: number,
  ): Promise<string | null> {
    try {
      const channel = await this.prismaService.channel.findUnique({
        where: {
          id: channelId,
        },
        include: {
          members: true,
        },
      });
      if (channel) {
        const member = channel.members.find((m) => Number(m.userId) === userId);
        if (member) {
          const memberRole = member.role;
          return memberRole;
        } else {
          return null;
        }
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error when searching memberRole in channel: ', error);
      throw error;
    }
  }

  async findMemberInChannel(
    channelId: string,
    userId: number,
  ): Promise<Member | null> {
    try {
      const existingMember = await this.prismaService.member.findFirst({
        where: {
          userId: userId,
          channelId: channelId,
        },
      });
      if (existingMember) {
        return existingMember;
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async createChannel(
    userId: number,
    channelName: string,
    isPublic: boolean,
    password?: string,
  ) {
    if (!userId) {
      console.error('user invalid');
      return null;
    }
    try {
      if (password) {
        const hashedPwd = await bcrypt.hash(password, 10);
        const channel = await this.prismaService.channel.create({
          data: {
            name: channelName,
            inviteCode: uuidv4(),
            password: hashedPwd,
            public: isPublic,
            user: {
              connect: {
                id: userId,
              },
            },
          },
        });
        const member = await this.prismaService.member.create({
          data: {
            role: 'ADMIN',
            userId: userId,
            channelId: channel.id,
          },
        });
        return channel;
      } else {
        const channel = await this.prismaService.channel.create({
          data: {
            name: channelName,
            inviteCode: uuidv4(),
            public: isPublic,
            user: {
              connect: {
                id: userId,
              },
            },
          },
        });
        const member = await this.prismaService.member.create({
          data: {
            role: 'ADMIN',
            userId: userId,
            channelId: channel.id,
          },
        });
        return channel;
      }
    } catch (error) {
      console.error('create channel ', error.message);
      throw new NotFoundException();
    }
  }

  async getAllChannels() {
    try {
      const channels = await this.prismaService.channel.findMany();
      return channels;
    } catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  async getUserChannels(userId: any): Promise<any> {
    if (!userId) throw new BadRequestException('userId not found');
    try {
      const userInfo = await this.prismaService.user.findUnique({
        where: {
          id: userId,
        },
        include: {
          members: {
            include: {
              channel: true,
            },
          },
        },
      });
      if (userInfo) {
        const userChannels = userInfo.members.map((member) => member.channel);
        return userChannels;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error when getUserChannels: ', error);
      throw error;
    }
  }

  async getMessagesByChannel(channelId: string) {
    try {
      const messages = await this.prismaService.message.findMany({
        where: {
          channelId: channelId,
        },
      });
      return messages;
    } catch (error) {
      throw error;
    }
  }

  async addMember(
    userId: number,
    channelId: string,
    memberId: number,
  ): Promise<any> {
    if (!userId || !channelId || !memberId) {
      console.log('channelId or UserId invalid');
      return;
    }
    try {
      const channelData = await this.getChannelMembers(channelId);
      const existingMember = channelData.find(
        (member) => Number(member.userId) === Number(memberId),
      );
      if (existingMember) {
        console.error('Member already exists in the channel');
        return null;
      } else {
        const newMember = await this.prismaService.member.create({
          data: {
            userId: Number(memberId),
            channelId: channelId,
          },
        });
        return newMember;
      }
    } catch (error) {
      console.error('Error when try to add a new member to channel', error);
      throw error;
    }
  }
  async changeMemberRole(
    req: any,
    channelId: string,
    userId: number,
    newRole: string,
  ) {
    const { user } = req;
    const memberRole: string = await this.findMemberRoleInChannel(
      channelId,
      Number(user.id),
    );
    try {
      const existingMember = await this.findMemberInChannel(channelId, userId);
      if (!existingMember) {
        throw new Error('User not found in channel');
      }
      if (existingMember.role === newRole) {
        throw new Error('This member already have this Role');
      }
      if (user.role === 'GUEST') {
        throw new Error('You have no permission!');
      }
      const memberId = existingMember.id;
      switch (newRole) {
        case 'ADMIN': {
          if (memberRole !== 'ADMIN')
            throw new Error('You have no permission!');
          const updatedMember = await this.prismaService.member.update({
            where: {
              id: memberId,
            },
            data: {
              role: MemberRole.ADMIN,
            },
          });
          return updatedMember;
        }
        case 'MODERATOR': {
          const updatedMember = await this.prismaService.member.update({
            where: {
              id: memberId,
            },
            data: {
              role: MemberRole.MODERATOR,
            },
          });
          return updatedMember;
        }

        case 'GUEST': {
          if (existingMember.role === 'MODERATOR' && user.role === 'MODERATOR')
            throw new Error('You have no permission');
          const updatedMember = await this.prismaService.member.update({
            where: {
              id: memberId,
            },
            data: {
              role: MemberRole.GUEST,
            },
          });
          return updatedMember;
        }
        default:
          throw new Error('Invalid role');
      }
    } catch (error) {
      console.error('Error when changing roles', error);
      throw error;
    }
  }

  async addMessage(
    userId: number,
    channelId: string,
    messageContent: string,
  ): Promise<Message | null> {
    if (!userId || !channelId || !messageContent) {
      console.error('invalid input');
      return null;
    }
    try {
      const userData = await this.findMemberInChannel(channelId, userId);
      const channelData = await this.prismaService.channel.findUnique({
        where: {
          id: channelId,
        },
      });
      if (userData.silencedTime > new Date()) {
        throw new Error('You are muted!');
      }
      if (userData && channelData) {
        const newMessage = await this.prismaService.message.create({
          data: {
            content: messageContent,
            userId: userId,
            channelId: channelData.id,
          },
        });
        await this.prismaService.channel.update({
          where: {
            id: channelId,
          },
          data: {
            messages: {
              connect: {
                id: newMessage.id,
              },
            },
          },
        });
        return newMessage;
      }
      throw new Error('no channelData or userData');
    } catch (error) {
      console.error('error when add message', error);
      throw error;
    }
  }

  async changeMessage(
    userId: number,
    messageId: string,
    newMessage: string,
  ): Promise<null | any> {
    if (!userId || !messageId || !newMessage) {
      console.error('invalid input');
      return null;
    }
    try {
      const message = await this.prismaService.message.findUnique({
        where: {
          id: messageId,
        },
      });
      if (!message) throw new Error('Message not found');
      if (message.userId !== userId)
        throw new Error('You cannot modify another user message');
      const updateMessage = await this.prismaService.message.update({
        where: {
          id: messageId,
        },
        data: {
          content: newMessage,
          updatedAt: new Date(),
          edited: true,
        },
      });
      return updateMessage;
    } catch (error) {
      console.error('error when add message', error);
      throw error;
    }
  }

  async deleteMessage(userId: number, messageId: string): Promise<null | any> {
    if (!userId || !messageId) {
      console.error('invalid input');
      return null;
    }
    try {
      const message = await this.prismaService.message.findUnique({
        where: {
          id: messageId,
        },
      });
      if (!message) throw new Error('Message not found');
      const userRole = await this.findMemberRoleInChannel(
        message.channelId,
        userId,
      );
      if (
        !(userRole === 'MODERATOR' || userRole === 'ADMIN') &&
        message.userId !== userId
      ) {
        throw new Error('You have no permission to delete the message');
      }
      await this.prismaService.message.delete({
        where: {
          id: messageId,
        },
      });
      return 'The message was succefull deleted!';
    } catch (error) {
      console.log('error when delete the message', error);
      throw error;
    }
  }

  async deleteChannel(userId: number, channelId: string): Promise<null | any> {
    if (!userId || !channelId) {
      console.error('invalid input');
      return null;
    }
    try {
      const channel = await this.prismaService.channel.findUnique({
        where: {
          id: channelId,
        },
      });
      if (!channel) throw new Error('channel not found');
      if (channel.userId !== userId) {
        throw new Error('You have no permission to delete the channel');
      }
      await this.prismaService.channel.delete({
        where: {
          id: channelId,
        },
      });
      return 'The channel was succefull deleted!';
    } catch (error) {
      console.log('error when delete the channel', error);
      throw error;
    }
  }

  async changeChannelOwner() {}

  async checkIfUserCanJoinChannel(
    userId: number,
    channelId: string,
  ): Promise<boolean> {
    try {
      const member = await this.prismaService.member.findFirst({
        where: {
          userId: userId,
          channelId: channelId,
        },
      });
      if (member) {
        return true;
      }
      return false;
    } catch (error) {
      console.error(error.message);
      return false;
    }
  }

  async updateChannelWithPassword(
    userId: number,
    channelId: string,
    password: string,
  ) {
    try {
      const channelData = await this.getChannelById(channelId);
      if (channelData.userId === userId) {
        await this.prismaService.channel.update({
          where: {
            id: channelId,
          },
          data: {
            password: password,
          },
        });
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async verifyChannelPassword(
    channelId: string,
    password: string,
  ): Promise<boolean> {
    const channel = await this.prismaService.channel.findUnique({
      where: { id: channelId },
    });
    return channel?.password === password;
  }

  async removePasswordFromChannel(
    userId: number,
    channelId: string,
    password: string,
  ): Promise<string> {
    try {
      const channelData = await this.getChannelById(channelId);
      if (channelData.userId === userId) {
        if (await this.verifyChannelPassword(channelId, password)) {
          await this.prismaService.channel.update({
            where: {
              id: channelId,
            },
            data: {
              password: null,
            },
          });
          return 'Password successful removed';
        }
        return 'Password verification failed';
      }
      return 'You are not the channel Owner';
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async updateChannelVisibility(
    userId: number,
    channelId: string,
    isPublic: boolean,
  ): Promise<string> {
    try {
      const channelData = await this.getChannelById(channelId);
      if (channelData.userId === userId) {
        await this.prismaService.channel.update({
          where: {
            id: channelId,
          },
          data: {
            public: isPublic,
          },
        });
        return 'Visibility changed';
      }
      return 'Only the channel owner can change the visibility';
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async isChannelPublic(channelId: string): Promise<boolean> {
    try {
      const channel = await this.prismaService.channel.findUnique({
        where: {
          id: channelId,
        },
      });
      return channel?.public || false;
    } catch (error) {
      console.error(error);
      throw error;
    }
  }
}
