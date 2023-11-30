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

  async getMemberById(memberId: string) {
    try {
      const member = await this.prismaService.member.findUnique({
        where: {
          id: memberId,
        },
      });
      if (member) {
        return member;
      } else {
        throw new Error('no member found');
      }
    } catch (error) {
      console.log(error);
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
            role: 'OWNER',
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
            role: 'OWNER',
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
    userId: number,
    channelId: string,
    memberChangeId: number,
    newRole: string,
  ) {
    const memberRole: string = await this.findMemberRoleInChannel(
      channelId,
      Number(userId),
    );
    try {
      const existingMember = await this.findMemberInChannel(channelId, memberChangeId);
      if (!existingMember) {
        throw new Error('User not found in channel');
      }
      if (existingMember.role === newRole) {
        throw new Error('This member already have this Role');
      }
      if (memberRole === 'GUEST' || memberRole === 'ADMIN') {
        throw new Error('You have no permission!');
      }
      const memberId = existingMember.id;
      switch (newRole) {
        case 'OWNER': {
          if (memberRole !== 'OWNER')
            throw new Error('You have no permission!');

          const updateChannel = await this.prismaService.channel.update({
            where: {
              id : channelId,
            },
            data: {
              user: {
                connect: {
                  id: memberChangeId,
                },
              },
            }
          })
          const updatedMember = await this.prismaService.member.update({
            where: {
              id: memberId,
            },
            data: {
              role: MemberRole.OWNER,
            },
          });
          return updatedMember;
        }
        case 'ADMIN': {
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

        case 'GUEST': {
          if (existingMember.role === 'ADMIN' && memberRole === 'ADMIN')
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
        !(userRole === 'OWNER' || userRole === 'ADMIN') &&
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

  async updateChannelWithPassword(
    userId: number,
    channelId: string,
    password: string,
  ) {
    try {
      const userRole = await this.findMemberRoleInChannel(channelId, userId);
      const cryptedPassword: string = await bcrypt.hash(password, 10);
      if (userRole === "OWNER") {
        const result = await this.prismaService.channel.update({
          where: {
            id: channelId,
          },
          data: {
            password: cryptedPassword ,
          },
        });
      }
      else {
        throw new Error("You are not the chat owner");
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  }

  async removePasswordFromChannel(
    userId: number,
    channelId: string,
    password: string,
  ): Promise<string> {
    try {
      const channelData = await this.getChannelById(channelId);
      if (channelData.userId === userId) {
        if (await bcrypt.compare(password, channelData.password)) {
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
      throw new Error('Only the channel owner can change the visibility');
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

  async getAllPublicChannels() {
    try {
      const channels = this.prismaService.channel.findMany({
        where: {
          public: true,
        },
      });
      if (channels) {
        return channels;
      }
    } catch (error) {
      console.log(error.message);
    }
  }

  async joinPublicChannel(
    userId: number,
    channelId: string,
    password?: string,
  ) {
    try {
      if (!userId) {
        throw new BadRequestException('userId not found');
      }
      const channelMembers = await this.getChannelMembers(channelId);
      const existingMember = channelMembers.find(
        (member) => Number(member.userId) === Number(userId),
      );
      if (existingMember) {
        throw new Error('Member already exists in the channel');
      }
      const channel = await this.getChannelById(channelId, password);
      if (channel.password === 'true') {
        throw new Error('need password to join channel');
      }
      const newMember = await this.prismaService.member.create({
        data: {
          userId: userId,
          channelId: channelId,
        },
      });
      return newMember;
    } catch (error) {
      throw error;
    }
  }

  async deleteMember(userId: number, channelId: string) {
    try {
      const member = await this.findMemberInChannel(channelId, userId);
      if (member) {
        await this.prismaService.member.delete({
          where: {
            id: member.id,
          },
        });
      }
      else {
        throw new Error("The member dons't exist");
      }
    }
    catch(error) {
      throw error;
    }
  }

  async kickUser(userId: number, channelId: string, userIdKick: number) {
    try {
      const userRole = await this.findMemberRoleInChannel(channelId, userId);
      const userRoleKick = await this.findMemberRoleInChannel(channelId, userIdKick);
      if (userRole === 'ADMIN' || userRole === 'OWNER') {
        if (userRoleKick === 'OWNER') {
          throw new Error('You cannot kick the chat owner')
        }
        await this.deleteMember(userIdKick, channelId);
        return "member deleted";
      }
    }
    catch(error) {
      throw error;
    }
  }
}
