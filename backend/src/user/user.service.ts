import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  private async getUserById(id: number) {
    return this.prismaService.user.findUnique({
      where: { id },
    });
  }

  async getProfile(req) {
    if (req.user.toConfig) {
      return req.user;
    }
    return this.getUser(req.user.id);
  }

  async getUser(id: number) {
    if (!id) {
      throw new UnauthorizedException('User not found');
    }
    const user = await this.getUserById(id);
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    const users = await this.prismaService.user.findMany();
    return users;
  }
}
