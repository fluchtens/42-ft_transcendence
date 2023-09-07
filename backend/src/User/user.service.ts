
import { PrismaService } from "./prisma.service";
import { User } from "./user.model";
import { Injectable } from "@nestjs/common";

@Injectable()
export class UserService{
  constructor(private readonly prisma: PrismaService) { }
  getHello(): string {
    return 'Hello World!';
  }
  async getAllUsers(): Promise<User[]>{
    return this.prisma.user.findMany()
  }

  async getUser(userName: String) : Promise<User | null>{
      return this.prisma.user.findUnique({where: {userName: String(userName)}})
  }

  async createUser(data: User): Promise<User>{
    return this.prisma.user.create({
      data,
    })
  }

  async changeUserName(userName: String, data:User): Promise<User>{
    return this.prisma.user.update({
      where: {userName:String(userName)},
      data: {userName: data.userName}
    })
  }
}