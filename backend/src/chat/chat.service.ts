import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { Channel, Member, MemberRole, Message } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";


@Injectable()
export class ChatService{
  constructor(private readonly prismaService: PrismaService) {}
  
  

  async getChannelById(channelId: string): Promise<Channel> {
    try {
      const channel = await this.prismaService.channel.findUnique({
        where: {
          id: channelId
        },
      });
      if (!channel) {
        throw new NotFoundException('Channel not found');
      }
      return channel;
    }
    catch (error) {
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
    }
    catch (error) {
      console.error('Error getting channel members:', error.message);
      throw error;
    }
  }

  async findMemberRoleInChannel(channelId : string, userId : number): Promise<string | null>{
    try {
      const channel = await this.prismaService.channel.findUnique({
        where: {
          id : channelId,
        },
        include: {
          members: true,
        }
      });
      if (channel) {
        const member = channel.members.find((m) => Number(m.userId) === userId);
        if (member) {
          const memberRole = member.role;
          return memberRole;
        }
        else {
          return null;
        }
      }
      else {
        return null;
      }
    }
    catch (error) {
      console.error('Error when searching memberRole in channel: ', error);
      throw error;
    }
  }

  async findMemberInChannel(channelId: string, userId: number) : Promise<Member | null> {
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
  }
  
  async createChannel(userId: number, channelName: string){
    if (!userId){
      console.error("user invalid");
      return null;
    }
    try {
      const channel = await this.prismaService.channel.create({
        data : {
          name : channelName,
          inviteCode: "InviteCode",
          user: {
            connect: {
              id: userId
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
    catch (error) {
      console.error("create channel ", error.message);
      throw new NotFoundException();
    }
  }

  async getAllChannels() {
    try {
      const channels = await this.prismaService.channel.findMany();
      return channels;
    }
    catch (error) {
      throw new NotFoundException(error.message);
    }
  }

  async getUserChannels(userId: any): Promise<any> {
    if (!userId)
      throw new BadRequestException("userId not found");
    try {
      const userInfo = await this.prismaService.user.findUnique({
        where: {
          id: userId,
        },
        include: {
          members: {
            include: {
              channel: true,
            }
          }
        }
      });
      if (userInfo) {
        const userChannels = userInfo.members.map((member) => member.channel);
        return userChannels;
      }
      else {
        return [];
      }
    }
    catch (error) {
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
    }
    catch (error) {
      throw error;
    }
  }

  async addMember(userId: number, channelId: string, memberId: number): Promise<any>{
    if (!(userId || channelId || memberId)) {
      console.log("channelId or UserId invalid");
      return;
    }
    if (await this.findMemberInChannel(channelId, memberId)){
      return "The user is already in the channel.";
    }
    const memberRole : string = await this.findMemberRoleInChannel(channelId, userId);
    if (memberRole) {
      try {
        const newMember = await this.prismaService.member.create({
          data : {
            userId: memberId,
            channelId: channelId
          }
        });
        return newMember;
      }
      catch (error){
        console.error('Error when try to add a new member to channel', error);
        throw error;
      }
    }
    else {
      console.log('member is not in channel, addMember failed');
    }
  }

  async changeMemberRole(req: any, channelId: string, userId: number, newRole: string){
    const { user } = req;
    const memberRole : string = await this.findMemberRoleInChannel(channelId, Number(user.id));
    try {
      const existingMember = await this.findMemberInChannel(channelId, userId);
      if (!existingMember) {
        throw new Error("User not found in channel");
      }
      if (existingMember.role === newRole) {
        throw new Error("This member already have this Role");
      }
      if (user.role === "GUEST"){
        throw new Error("You have no permission!");
      }
      const memberId = existingMember.id;
      switch (newRole)
      {
        case "ADMIN": {
          if (memberRole !== "ADMIN")
            throw new Error("You have no permission!");
          const updatedMember = await this.prismaService.member.update({
            where: {
              id:memberId,
            },
            data: {
              role: MemberRole.ADMIN,
            },
          });
          return updatedMember;
        }
        case "MODERATOR": {
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
  
        case "GUEST": {
          if (existingMember.role === "MODERATOR" && user.role === "MODERATOR")
            throw new Error("You have no permission");
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
          throw new Error("Invalid role");
      }

    }
    catch(error) {
      console.error('Error when changing roles', error);
      throw error;
    }
  }

  async addMessage(userId: number, channelId: string, messageContent: string) : Promise<Message | null> {

    if (!userId || !channelId || !messageContent){
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
      if (userData.silencedTime > new Date()){
        throw new Error ("You are muted!");
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
      throw new Error("no channelData or userData");
    }
    catch(error) {
      console.error("error when add message", error);
      throw error;
    }
  }

  async changeMessage(req:any, messageId: string, newMessage: string) : Promise<null | any> {
    const { user } = req;

    if (!user || !messageId || !newMessage){
      console.error('invalid input');
      return null;
    }
    try {
      const message = await this.prismaService.message.findUnique({
        where: {
          id: messageId,
        },
      });
      if (!message)
        throw new Error("Message not found");
      if (message.userId !== user.id)
        throw new Error("You cannot modify another user message");
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
    }
    catch(error) {
      console.error("error when add message", error);
      throw error;
    }
  }

  async deleteMessage(req: any, messageId: string) : Promise<null | any> {
    const { user } = req;

    if (!user || !messageId){
      console.error('invalid input');
      return null;
    }
    try {
      const message = await this.prismaService.message.findUnique({
        where: {
          id: messageId,
        },
      });
      if (!message)
        throw new Error("Message not found");
      const userRole = await this.findMemberRoleInChannel(message.channelId, user.id);
      if (!(userRole === "MODERATOR" || userRole === "ADMIN") || message.userId !== user.id) {
        throw new Error("You have no permission to delete the message")
      }
      await this.prismaService.message.delete({
        where: {
          id: messageId,
        },
      });
      return ("The message was succefull deleted!");
    }
    catch(error) {
      console.log('error when delete the message', error);
      throw error;
    }
  }

  async deleteChannel(req: any, channelId: string) : Promise<null | any> {
    const { user } = req;

    if (!user || !channelId){
      console.error('invalid input');
      return null;
    }
    try {
      const channel = await this.prismaService.channel.findUnique({
        where: {
          id: channelId,
        },
      });
      if (!channel)
        throw new Error("channel not found");
      const userRole = await this.findMemberRoleInChannel(channelId, user.id);
      if (!(userRole === "ADMIN") || channel.userId !== user.id) {
        throw new Error("You have no permission to delete the channel")
      }
      await this.prismaService.channel.delete({
        where: {
          id: channelId,
        },
      });
      return ("The channel was succefull deleted!");
    }
    catch(error) {
      console.log('error when delete the channel', error);
      throw error;
    }
  }

  async checkIfUserCanJoinChannel(userId: number, channelId: string): Promise<boolean> {
    try {
      const member = await this.prismaService.member.findFirst({
        where: {
          userId: userId,
          channelId: channelId,
        },
      });
      if (member){
        return true;
      }
      return false;
    }
    catch(error){
      console.error(error.message);
      return false;
    }
  }
}