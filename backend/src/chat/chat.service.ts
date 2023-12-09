import {
  Injectable,
} from '@nestjs/common';
import { Channel, Member, MemberRole, Message, Prisma } from '@prisma/client';
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
      if (!channelId) throw new Error('invalid channelId');
      const channel = await this.prismaService.channel.findUnique({
        where: {
          id: channelId,
        },
      });
      if (!channel) {
        throw new Error('Channel not found');
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
          throw new Error('wrong password');
        }
      }
      return channel;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getSimpleChannelById(channelId: string): Promise<Channel> {
    try {
      if (!channelId) throw new Error('invalid channelId');
      const channel = await this.prismaService.channel.findUnique({
        where: {
          id: channelId,
        },
      });
      if (!channel) {
        throw new Error('Channel not found');
      }
      return channel;
    } catch (error) {
      throw new Error(error.message);
    }
  }
  async passwordChannelVerify(
    channelId: string,
    password: string,
  ): Promise<boolean> {
    try {
      const channel = await this.prismaService.channel.findUnique({
        where: {
          id: channelId,
        },
      });
      if (!channel) {
        throw new Error('Channel not found');
      }
      const matchPwd = await bcrypt.compare(password, channel.password);
      if (matchPwd) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      throw new error();
      return false;
    }
  }

  async getMemberById(memberId: string): Promise<any> {
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
    }
  }

  async getChannelMembers(channelId: string): Promise<any> {
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
  ): Promise<any> {
    if (!userId) {
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
      throw new Error();
    }
  }

  async getAllChannels(): Promise<any> {
    try {
      const channels = await this.prismaService.channel.findMany();
      return channels;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async changeChannelName(
    userId: number,
    channelId: string,
    newChannelname: string,
  ): Promise<any> {
    const userRole = await this.findMemberRoleInChannel(channelId, userId);
    if (userRole !== 'OWNER') {
      throw new Error("You don't has permission to change the channelName");
    }
    await this.prismaService.channel.update({
      where: {
        id: channelId,
      },
      data: {
        name: newChannelname,
      },
    });
  }

  async getUserChannels(userId: any): Promise<any> {
    if (!userId) throw new Error('userId not found');
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
            orderBy: {
              createdAt: Prisma.SortOrder.asc,
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
      throw error;
    }
  }

  async getMessagesByChannel(channelId: string): Promise<any> {
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
      return;
    }
    try {
      const channelData = await this.getChannelMembers(channelId);
      const existingMember = channelData.find(
        (member) => Number(member.userId) === Number(memberId),
      );
      if (existingMember) {
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
      throw error;
    }
  }
  async changeMemberRole(
    userId: number,
    channelId: string,
    memberChangeUserId: number,
    newRole: string,
  ): Promise<any> {
    try {
      const userStatus = await this.findMemberInChannel(
        channelId,
        Number(userId),
      );
      const memberToChange = await this.findMemberInChannel(
        channelId,
        memberChangeUserId,
      );
      if (!memberToChange) {
        throw new Error('User not found in channel');
      }
      if (memberToChange.role === newRole) {
        throw new Error('This member already has this Role');
      }
      if (userStatus.role === 'GUEST' || userStatus.role === 'ADMIN') {
        throw new Error("You don't have the required permissions!");
      }
      const memberId = memberToChange.id;
      switch (newRole) {
        case 'OWNER': {
          if (userStatus.role !== 'OWNER')
            throw new Error("You don't have the required permissions!");
          const updateChannel = await this.prismaService.channel.update({
            where: {
              id: channelId,
            },
            data: {
              user: {
                connect: {
                  id: memberChangeUserId,
                },
              },
            },
          });
          const updatedMember = await this.prismaService.member.update({
            where: {
              id: memberId,
            },
            data: {
              role: MemberRole.OWNER,
            },
          });

          const updatedOwnerMember = await this.prismaService.member.update({
            where: {
              id: userStatus.id,
            },
            data: {
              role: MemberRole.ADMIN,
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
      throw error;
    }
  }

  async addMessage(
    userId: number,
    channelId: string,
    messageContent: string,
    gameInvit?: boolean,
  ): Promise<Message | null> {
    if (!userId || !channelId || !messageContent) {
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
            gameInvit:gameInvit,
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
      throw error;
    }
  }

  async changeMessage(
    userId: number,
    messageId: string,
    newMessage: string,
  ): Promise<null | any> {
    if (!userId || !messageId || !newMessage) {
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
      throw error;
    }
  }

  async deleteMessage(userId: number, messageId: string): Promise<null | any> {
    if (!userId || !messageId) {
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
        throw new Error('You are not authorized to delete the message!');
      }
      await this.prismaService.message.delete({
        where: {
          id: messageId,
        },
      });
      return 'The message was succefull deleted!';
    } catch (error) {
      throw error;
    }
  }

  async deleteChannel(userId: number, channelId: string): Promise<null | any> {
    if (!userId || !channelId) {
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
      throw error;
    }
  }

  async updateChannelWithPassword(
    userId: number,
    channelId: string,
    password: string,
  ): Promise<any> {
    try {
      const userRole = await this.findMemberRoleInChannel(channelId, userId);
      const cryptedPassword: string = await bcrypt.hash(password, 10);
      if (userRole === 'OWNER') {
        const result = await this.prismaService.channel.update({
          where: {
            id: channelId,
          },
          data: {
            password: cryptedPassword,
          },
        });
      } else {
        throw new Error('You are not the chat owner');
      }
    } catch (error) {
      throw error;
    }
  }

  async removePasswordFromChannel(
    userId: number,
    channelId: string,
  ): Promise<string> {
    try {
      const memberRole = await this.findMemberRoleInChannel(channelId, userId);
      if (memberRole === 'OWNER') {
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
      return 'You are not the channel Owner';
    } catch (error) {
      throw error;
    }
  }

  async updateChannelVisibility(
    userId: number,
    channelId: string,
    isPublic: boolean,
  ): Promise<string> {
    try {
      const userRole = await this.findMemberRoleInChannel(channelId, userId);
      if (userRole === 'OWNER') {
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
      throw error;
    }
  }

  async getAllPublicChannels(): Promise<any> {
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
    }
  }

  async joinPublicChannel(
    userId: number,
    channelId: string,
    password?: string,
  ): Promise<any> {
    try {
      if (!userId) {
        throw new Error('userId not found');
      }
      const channelMembers = await this.getChannelMembers(channelId);
      const existingMember = channelMembers.find(
        (member) => Number(member.userId) === Number(userId),
      );
      if (existingMember) {
        throw new Error('Member already exists in the channel');
      }
      const channel = await this.getSimpleChannelById(channelId);
      if (channel.password) {
        const checkPassword = await this.passwordChannelVerify(
          channelId,
          password,
        );
        if (!checkPassword) {
          throw new Error('Wrong Password');
        }
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

  async deleteMember(userId: number, channelId: string): Promise<string> {
    try {
      const member = await this.findMemberInChannel(channelId, userId);
      if (member) {
        await this.prismaService.member.delete({
          where: {
            id: member.id,
          },
        });
        return 'member deleted';
      } else {
        throw new Error("The member dons't exist");
      }
    } catch (error) {
      throw error;
    }
  }

  async kickUser(userId: number, channelId: string, userIdKick: number): Promise<any> {
    try {
      const userRole = await this.findMemberRoleInChannel(channelId, userId);
      const userRoleKick = await this.findMemberRoleInChannel(
        channelId,
        userIdKick,
      );
      if (
        (userRole !== 'ADMIN' && userRole !== 'OWNER') ||
        (userRole === 'ADMIN' && userRoleKick === 'ADMIN')
      ) {
        throw new Error('You have no permission to kick');
      }
      if (userRoleKick === 'OWNER') {
        throw new Error('You cannot kick the chat owner');
      }
      if (await this.deleteMember(userIdKick, channelId)) {
        return 'member deleted';
      }
    } catch (error) {
      throw error;
    }
  }

  async banUser(userId: number, channelId: string, userIdKick: number): Promise<any> {
    try {
      const userRole = await this.findMemberRoleInChannel(channelId, userId);
      const userRoleKick = await this.findMemberRoleInChannel(
        channelId,
        userIdKick,
      );
      if (
        (userRole !== 'ADMIN' && userRole !== 'OWNER') ||
        (userRole === 'ADMIN' && userRoleKick === 'ADMIN')
      ) {
        throw new Error('You have no permission to ban');
      }
      if (userRoleKick === 'OWNER') {
        throw new Error('You cannot ban the chat owner');
      }
      if (await this.deleteMember(userIdKick, channelId)) {
        const channel = await this.prismaService.channel.findUnique({
          where: { id: channelId },
        });
        if (!channel.bannedUsers.includes(userIdKick)) {
          await this.prismaService.channel.update({
            where: { id: channelId },
            data: {
              bannedUsers: {
                push: userIdKick,
              },
            },
          });
        }
        return 'member banned';
      }
    } catch (error) {
      throw error;
    }
  }

  async unbanUser(channelId: string, userId: number): Promise<void> {
    const channel = await this.prismaService.channel.findUnique({
      where: { id: channelId },
    });

    if (channel.bannedUsers.includes(userId)) {
      await this.prismaService.channel.update({
        where: { id: channelId },
        data: {
          bannedUsers: {
            set: channel.bannedUsers.filter((id) => id !== userId),
          },
        },
      });
    } else {
      throw new Error('The user are not banned');
    }
  }

  async isUserBanned(channelId: string, userId: number): Promise<boolean> {
    const channel = await this.prismaService.channel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new Error("Le canal n'existe pas.");
    }

    return channel.bannedUsers.includes(userId);
  }

  async muteMember(
    channelId: string,
    userId: number,
    silencedTime: Date,
  ): Promise<void> {
    const member = await this.findMemberInChannel(channelId, userId);
    if (member) {
      await this.prismaService.member.update({
        where: { id: member.id },
        data: {
          silencedTime: silencedTime,
        },
      });
    } else {
      throw new Error('member not found');
    }
  }

  async createPrivateChannel(senderId: number, receiverId: number): Promise<any> {
    try {
      const channel = await this.prismaService.privateMessageChannel.create({
        data: {
          sender: {
            connect: {
              id: senderId,
            },
          },
          receiver: {
            connect: {
              id: receiverId,
            },
          },
        },
      });
      if (channel) {
        return channel.id;
      }
      return null;
    } catch {
      throw new Error('Failed to create a private channel');
    }
  }

  async findPrivateChannel(
    senderId: number,
    receiverId: number,
  ): Promise<string> {
    try {
      const channel = await this.prismaService.privateMessageChannel.findFirst({
        where: {
          OR: [
            {
              senderId: senderId,
              receiverId: receiverId,
            },
            {
              senderId: receiverId,
              receiverId: senderId,
            },
          ],
        },
      });
      if (channel) {
        return channel.id;
      }
      return null;
    } catch {
      return null;
    }
  }

  async addPrivateMessage(
    userId: number,
    privateMessageId: string,
    messageContent: string,
    gameInvit?: boolean,
  ): Promise<any> {
    if (!userId || !privateMessageId || !messageContent) {
      return null;
    }
    try {
      const channelData =
        await this.prismaService.privateMessageChannel.findUnique({
          where: {
            id: privateMessageId,
          },
        });
      if (channelData) {
        const newMessage = await this.prismaService.privateMessage.create({
          data: {
            content: messageContent,
            userId: userId,
            privateMessageId: channelData.id,
            gameInvit: gameInvit,
          },
        });
        await this.prismaService.privateMessageChannel.update({
          where: {
            id: privateMessageId,
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
      throw new Error('no channelData');
    } catch (error) {
      throw error;
    }
  }

  async canConnectToPrivateChannel(
    channelId: string,
    userId: number,
  ): Promise<boolean> {
    try {
      const channel = await this.prismaService.privateMessageChannel.findUnique(
        {
          where: {
            id: channelId,
          },
        },
      );
      if (channel.receiverId === userId || channel.senderId === userId) {
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }

  async getPrivateMessages(privateChannelId: string): Promise<any> {
    try {
      const messages = await this.prismaService.privateMessage.findMany({
        where: {
          privateMessageId: privateChannelId,
        },
      });
      return messages;
    } catch (error) {
      throw new Error(error.message);
    }
  }

  async getPrivateChannelData(channelId: string): Promise<any> {
    const channel = await this.prismaService.privateMessageChannel.findUnique({
      where: {
        id: channelId,
      },
    });
    return channel;
  }

  async deletePrivateMessage(messageId: string): Promise<null | any> {
    if (!messageId) {
      return null;
    }
    try {
      const message = await this.prismaService.privateMessage.findUnique({
        where: {
          id: messageId,
        },
      });
      if (!message) throw new Error('Message not found');
      await this.prismaService.privateMessage.delete({
        where: {
          id: messageId,
        },
      });
      return 'The message was succefull deleted!';
    } catch (error) {
      throw error;
    }
  }

  async deleteGameMessage( messageId: string): Promise<null | any> {
    if (!messageId) {
      return null;
    }
    try {
      const message = await this.prismaService.message.findUnique({
        where: {
          id: messageId,
        },
      });
      if (!message) throw new Error('Message not found');
      await this.prismaService.message.delete({
        where: {
          id: messageId,
        },
      });
      return 'The message was succefull deleted!';
    } catch (error) {
      throw error;
    }
  }
}
