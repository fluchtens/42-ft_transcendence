import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { PrismaService } from "src/prisma/prisma.service";
import { isErrored } from "stream";


@Injectable()
export class ChatService{
  constructor(private readonly prismaService: PrismaService,
  private readonly jwtService: JwtService) {}
  
  async createChat(req){
    const { user } = req;
    console.log(user.id);

    const result = await this.prismaService.channel.create({
      data : {
        name : "ChannelName",
        inviteCode: "InviteCode",
        user: {
          connect: {
            username: user.username
          }
        }
      }
    })
    return result;
  }
  async addMember(req, channelId, userId){
    const { user } = req;

    const result = await this.prismaService.channel.update({
      where: {
        id: channelId,
      },
      data: {
        members: {
          update: [
            user, {
              connect: {
                username: user.username
              }
            },
          ]
        }
      }
    })
  }
}