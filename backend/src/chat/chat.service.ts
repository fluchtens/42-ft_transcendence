import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { Member, MemberRole } from "@prisma/client";
import { PrismaService } from "src/prisma/prisma.service";
import { isErrored } from "stream";


@Injectable()
export class ChatService{
  constructor(private readonly prismaService: PrismaService,
  private readonly jwtService: JwtService) {}
  
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
  
  async createChat(req, channelName){
    const { user } = req;
    console.log(user.id);

    const channel = await this.prismaService.channel.create({
      data : {
        name : channelName,
        inviteCode: "InviteCode",
        user: {
          connect: {
            username: user.username
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

}