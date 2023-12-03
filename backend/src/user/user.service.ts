import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcryptjs';
import * as fs from 'fs';
import * as path from 'path';
import { UsernameDto } from './dtos/UsernameDto';
import { UpdatePwdDto } from './dtos/UpdatePwdDto';
import { User } from '@prisma/client';

@Injectable()
export class UserService {
  constructor(private readonly prismaService: PrismaService) {}

  /* -------------------------------------------------------------------------- */
  /*                                    Utils                                   */
  /* -------------------------------------------------------------------------- */

  async findUserById(id: number) {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { id },
      });
      return user;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findUserByUsername(username: string, insensitive: boolean) {
    try {
      if (insensitive) {
        const user = await this.prismaService.user.findFirst({
          where: {
            username: {
              equals: username,
              mode: 'insensitive',
            },
          },
        });
        return user;
      } else {
        const user = await this.prismaService.user.findUnique({
          where: { username },
        });
        return user;
      }
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findUserByFortyTwoId(fortyTwoId: number) {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { fortyTwoId },
      });
      return user;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findUserAvatar(id: number) {
    return this.prismaService.user.findUnique({
      where: { id },
      select: { avatar: true },
    });
  }

  async findUserStats(id: number) {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { id },
        include: {
          wonMatches: true,
          lostMatches: true,
        },
      });

      return {
        wonMatches: user.wonMatches.length,
        lostMatches: user.lostMatches.length,
      };
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async findUserHistory(id: number) {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { id },
        include: {
          wonMatches: true,
          lostMatches: true,
        },
      });

      const history = [...user.wonMatches, ...user.lostMatches];
      return history;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  async updateUserUsername(id: number, username: string) {
    return this.prismaService.user.update({
      where: { id },
      data: { username },
    });
  }

  async updateUserAvatar(id: number, avatar: string) {
    return this.prismaService.user.update({
      where: { id },
      data: { avatar },
    });
  }

  async updateUserPassword(id: number, password: string) {
    return this.prismaService.user.update({
      where: { id },
      data: { password },
    });
  }

  async updateUserTwoFa(id: number, twoFa: boolean) {
    return this.prismaService.user.update({
      where: { id },
      data: { twoFa },
    });
  }

  async updateUserTwoFaSecret(id: number, twoFaSecret: string) {
    return this.prismaService.user.update({
      where: { id },
      data: { twoFaSecret },
    });
  }

  exclude<User, Key extends keyof User>(
    user: User,
    keys: Key[],
  ): Omit<User, Key> {
    return Object.fromEntries(
      Object.entries(user).filter(([key]) => !keys.includes(key as Key)),
    ) as Omit<User, Key>;
  }

  /* -------------------------------------------------------------------------- */
  /*                                   General                                  */
  /* -------------------------------------------------------------------------- */

  async getUser(req) {
    return this.getUserById(req.user.id);
  }

  async getAllUsers() {
    const users = await this.prismaService.user.findMany();
    if (!users) {
      throw new NotFoundException('No users found');
    }

    const usersData = users.map((user) => {
      const userData = this.exclude(user, ['fortyTwoId', 'password']);
      if (userData.avatar) {
        userData.avatar = `${process.env.VITE_BACK_URL}/user/avatar/${userData.avatar}`;
      }
      return userData;
    });

    return usersData;
  }

  async getUserById(id: number): Promise<Partial<User>> {
    const user = await this.findUserById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userData = this.exclude(user, ['fortyTwoId', 'password']);
    if (userData.avatar) {
      userData.avatar = `${process.env.VITE_BACK_URL}/user/avatar/${userData.avatar}`;
    }
    return userData;
  }

  async getUserByUsername(username: string) {
    const user = await this.findUserByUsername(username, false);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const userData = this.exclude(user, ['fortyTwoId', 'password']);
    if (userData.avatar) {
      userData.avatar = `${process.env.VITE_BACK_URL}/user/avatar/${userData.avatar}`;
    }
    return userData;
  }

  /* -------------------------------------------------------------------------- */
  /*                                  Username                                  */
  /* -------------------------------------------------------------------------- */

  async changeUsername(req, body: UsernameDto) {
    const { username } = body;

    const user = await this.findUserById(req.user.id);
    if (!user) {
      throw new NotFoundException('User not found');
    } else if (user.username === username) {
      throw new ConflictException('You already have this username');
    } else {
      const searchUser = await this.findUserByUsername(username, true);
      if (searchUser && searchUser.id !== req.user.id) {
        throw new ConflictException('This username is already taken');
      }
    }

    await this.updateUserUsername(req.user.id, username);

    return { message: 'Username updated successfully' };
  }

  /* -------------------------------------------------------------------------- */
  /*                                  Password                                  */
  /* -------------------------------------------------------------------------- */

  async changePassword(req, body: UpdatePwdDto) {
    const { id } = req.user;
    const { password, newPassword } = body;

    const user = await this.findUserById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    } else if (user.fortyTwoId) {
      throw new UnauthorizedException('You are connected with 42');
    }

    const matchPwd = await bcrypt.compare(password, user.password);
    if (!matchPwd) {
      throw new UnauthorizedException("Old password isn't valid");
    }

    const hashedPwd = await bcrypt.hash(newPassword, 10);
    await this.updateUserPassword(id, hashedPwd);

    return { message: 'Password updated successfully' };
  }

  /* -------------------------------------------------------------------------- */
  /*                                   Avatar                                   */
  /* -------------------------------------------------------------------------- */

  async getAvatar(filename: string, res) {
    const filePath = path.resolve('./uploads', filename);
    if (!fs.existsSync(filePath)) {
      throw new NotFoundException('Avatar not found');
    }
    res.sendFile(filePath);
  }

  async postAvatar(req, file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No avatar file provided');
    }

    const user = await this.findUserAvatar(req.user.id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    if (user.avatar) {
      const filePath = path.resolve('./uploads', user.avatar);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    await this.updateUserAvatar(req.user.id, file.filename);

    return { message: 'Avatar updated successfully' };
  }

  /* -------------------------------------------------------------------------- */
  /*                                    Game                                    */
  /* -------------------------------------------------------------------------- */

  async getLeaderboard() {
    const users = await this.getAllUsers();
    if (!users) throw new NotFoundException('No users found');

    const sortedUsers = users.sort((a, b) => b.rating - a.rating);
    const topUsers = sortedUsers.slice(0, 100);
    return topUsers;
  }

  async getUserStats(id: number) {
    const user = await this.findUserById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const stats = await this.findUserStats(id);
    if (!user) {
      throw new NotFoundException('No stats found');
    }

    const history = await this.findUserHistory(id);
    history.sort((a, b) => (a.finished > b.finished ? -1 : 1));

    return stats;
  }

  async getUserHistory(id: number) {
    const user = await this.findUserById(id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const history = await this.findUserHistory(id);
    if (!history) {
      throw new NotFoundException('No history found');
    }

    const sortedHistory = history.sort((a, b) =>
      a.finished > b.finished ? -1 : 1,
    );

    const userPromises = sortedHistory.map(async (match: any) => {
      const [winner, loser] = await Promise.all([
        this.getUserById(match.winnerId),
        this.getUserById(match.loserId),
      ]);
      match.winner = winner;
      match.loser = loser;
      return match;
    });

    const historyWithUsers = await Promise.all(userPromises);
    return historyWithUsers;
  }
}
