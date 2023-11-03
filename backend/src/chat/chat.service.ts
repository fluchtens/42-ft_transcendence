import { Injectable, UseGuards } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Member, MemberRole } from "@prisma/client";
import { channel } from "diagnostics_channel";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { PrismaService } from "src/prisma/prisma.service";
import { isErrored } from "stream";


@Injectable()
export class ChatService{
  constructor(private readonly prismaService: PrismaService) {}
  
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
  
  async createChat(req, channelName: string){
    const { user } = req;
    console.log(user.id);
    if (!user){
      console.error("user invalid");
      return null;
    }
    const channel = await this.prismaService.channel.create({
      data : {
        name : channelName,
        inviteCode: "InviteCode",
        user: {
          connect: {
            id: user.id
          },
        },
      },
    });
  
    const member = await this.prismaService.member.create({
      data: {
        role: 'ADMIN',
        userId: user.id,
        channelId: channel.id,
      },
    });

    return channel;
  }
  async getUserChannels(req): Promise<any> {
    const { user } = req;
    const userId = user.id;
    // console.log(user);
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

  async addMember(req: any, channelId: string, userId: number): Promise<any>{
    if (!(userId || channelId)) {
      console.log("channelId or UserId invalid");
      return;
    }
    if (await this.findMemberInChannel(channelId, userId)){
      return "The user is already in the channel.";
    }
    const { user } = req;
    const memberRole : string = await this.findMemberRoleInChannel(channelId, Number(user.id));
    if (memberRole) {
      try {
        const newMember = await this.prismaService.member.create({
          data : {
            userId: userId,
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

  async addMessage(req: any, channelId: string, messageContent: string) : Promise<null | any> {
    const { user } = req;

    if (!user || !channelId || !messageContent){
      console.error('invalid input');
      return null;
    }
    try {
      const userData = this.findMemberInChannel(channelId, user.id);
      const channelData = await this.prismaService.channel.findUnique({
        where: {
          id: channelId,
        },
      });
      console.log((await userData).silencedTime);
      if ((await userData).silencedTime > new Date()){
        throw new Error ("You are muted!");
      }
      if (userData && channelData) {
        const newMessage = await this.prismaService.message.create({
          data: {
            content: messageContent,
            userId: user.id,
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
}