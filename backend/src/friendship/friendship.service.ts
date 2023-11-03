import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FriendshipDto } from './dtos/FriendshipDto';

@Injectable()
export class FriendshipService {
  constructor(private readonly prismaService: PrismaService) {}

  /* -------------------------------------------------------------------------- */
  /*                                   Private                                  */
  /* -------------------------------------------------------------------------- */

  private async findUserById(id: number) {
    try {
      const user = await this.prismaService.user.findUnique({
        where: { id },
      });

      return user;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  private async findUserRelation(senderId: number, receiverId: number) {
    try {
      const friendship = await this.prismaService.friendship.findFirst({
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

      return friendship;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  private async findUserFriends(id: number) {
    try {
      const friends = await this.prismaService.user.findUnique({
        where: { id },
        include: {
          addedFriends: {
            where: { status: true },
            select: {
              receiver: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                },
              },
            },
          },
          acceptedFriends: {
            where: { status: true },
            select: {
              sender: {
                select: {
                  id: true,
                  username: true,
                  avatar: true,
                },
              },
            },
          },
        },
      });

      return friends;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  /* -------------------------------------------------------------------------- */
  /*                                   General                                  */
  /* -------------------------------------------------------------------------- */

  async getFriends(userId: number) {
    const user = await this.findUserFriends(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const friends = [
      ...user.addedFriends.map((user) => user.receiver),
      ...user.acceptedFriends.map((user) => user.sender),
    ];

    return { friends };
  }

  async addFriend(req, body: FriendshipDto) {
    const { id } = req.user;
    const senderId = id;
    const { receiverId } = body;

    if (senderId === receiverId) {
      throw new BadRequestException("You can't send yourself a friend request");
    }

    const receiverUser = await this.findUserById(receiverId);
    if (!receiverUser) {
      throw new NotFoundException('User not found');
    }

    const friendship = await this.findUserRelation(senderId, receiverId);
    if (friendship) {
      throw new BadRequestException('You are already friends with this user');
    }

    await this.prismaService.friendship.create({
      data: {
        sender: { connect: { id: senderId } },
        receiver: { connect: { id: receiverId } },
      },
    });

    return { message: 'Friend request sent' };
  }

  async removeFriend(req, body: FriendshipDto) {
    const { id } = req.user;
    const senderId = id;
    const { receiverId } = body;

    if (senderId === receiverId) {
      throw new BadRequestException("You can't send yourself a friend request");
    }

    const receiverUser = await this.findUserById(receiverId);
    if (!receiverUser) {
      throw new NotFoundException('User not found');
    }

    const friendship = await this.findUserRelation(senderId, receiverId);
    if (!friendship) {
      throw new BadRequestException('You are not friends with this user');
    }

    await this.prismaService.friendship.delete({
      where: {
        id: friendship.id,
      },
    });

    return { message: 'Friend removed successfully' };
  }
}
