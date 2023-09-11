import { PrismaService } from "../prisma.service";
import { User } from "./user.model";
import { Injectable } from "@nestjs/common";

@Injectable()

export class UserService {
  constructor(private readonly prisma: PrismaService) {}
  
  async getAllUsers(): Promise<User[]> {
    return this.prisma.user.findMany();
  }

  async getUser(id : number) : Promise<User>{
    return this.prisma.user.findUnique({where: {id : Number(id)}})
  }
  async createUser(data: User): Promise<User> {
    return this.prisma.user.create({
      data,
    });
  }

  async changeUserName(userName: String, data:User): Promise<User> {
    return this.prisma.user.update({
      where: {userName:String(userName)},
      data: {userName: data.userName}
    })
  }
}
