import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { User } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  private async getUserById(id: number) {
    return this.prismaService.user.findUnique({
      where: { id },
    });
  }

  private async findUserAvatar(id: number) {
    return this.prismaService.user.findUnique({
      where: { id },
      select: { avatar: true },
    });
  }

  private async updateUserAvatar(id: number, avatar: string) {
    return this.prismaService.user.update({
      where: { id },
      data: { avatar },
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

  async postAvatar(req, file) {
    const user = await this.findUserAvatar(req.user.id);
    if (user && user.avatar) {
      const filePath = path.resolve('./uploads', user.avatar);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    await this.updateUserAvatar(req.user.id, file.filename);
    return { message: 'Avatar successfully updated' };
  }

  async getAvatar(filename: string, res) {
    const filePath = path.resolve('./uploads', filename);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Avatar not found');
    }
    res.sendFile(filePath);
  }
}
