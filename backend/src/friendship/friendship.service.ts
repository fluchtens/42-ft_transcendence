import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FriendshipDto, UserDto } from './dtos/FriendshipDto';
import { FriendshipStatus } from '@prisma/client';

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

  private async findFriendship(senderId: number, receiverId: number) {
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

  private async findFriendshipStatus(
    senderId: number,
    receiverId: number,
    status: FriendshipStatus,
  ) {
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
          status,
        },
      });

      return friendship;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  private async findFriends(id: number) {
    try {
      const friends = await this.prismaService.user.findUnique({
        where: { id },
        include: {
          addedFriends: {
            where: { status: FriendshipStatus.ACCEPTED },
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
            where: { status: FriendshipStatus.ACCEPTED },
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
    const user = await this.findFriends(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const friends = [
      ...user.addedFriends.map((user) => user.receiver),
      ...user.acceptedFriends.map((user) => user.sender),
    ];

    return { friends };
  }

  /* -------------------------------------------------------------------------- */
  /*                                  Requests                                  */
  /* -------------------------------------------------------------------------- */

  async addFriend(req, body: FriendshipDto) {
    const { id } = req.user;
    const senderId = id;
    const { receiverId } = body;

    if (senderId === receiverId) {
      throw new BadRequestException("You can't be friends with yourself");
    }

    const receiverUser = await this.findUserById(receiverId);
    if (!receiverUser) {
      throw new NotFoundException('User not found');
    }

    const friendship = await this.findFriendship(senderId, receiverId);
    if (friendship) {
      if (friendship.status === FriendshipStatus.PENDING) {
        throw new BadRequestException(
          'A friend request is already pending with this user',
        );
      } else if (friendship.status === FriendshipStatus.ACCEPTED) {
        throw new BadRequestException('You are already friends with this user');
      } else if (friendship.status === FriendshipStatus.BLOCKED) {
        throw new BadRequestException('This user is blocked');
      }
    }

    await this.prismaService.friendship.create({
      data: {
        sender: { connect: { id: senderId } },
        receiver: { connect: { id: receiverId } },
        status: FriendshipStatus.PENDING,
      },
    });

    return { message: 'Friend request sent' };
  }

  async acceptFriend(receiverId: number, senderId: number) {
    if (receiverId === senderId) {
      throw new BadRequestException("You can't be friends with yourself");
    }

    const senderUser = await this.findUserById(senderId);
    if (!senderUser) {
      throw new NotFoundException('User not found');
    }

    const friendship = await this.findFriendshipStatus(
      senderId,
      receiverId,
      FriendshipStatus.PENDING,
    );
    if (!friendship) {
      throw new BadRequestException(
        'You have not received an invitation from this user',
      );
    }

    await this.prismaService.friendship.update({
      where: { id: friendship.id },
      data: { status: FriendshipStatus.ACCEPTED },
    });

    return { message: `You are now friends with ${senderUser.username}` };
  }

  /* -------------------------------------------------------------------------- */
  /*                                 Management                                 */
  /* -------------------------------------------------------------------------- */

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

    const friendship = await this.findFriendshipStatus(
      senderId,
      receiverId,
      FriendshipStatus.ACCEPTED,
    );
    if (!friendship) {
      throw new BadRequestException('You are not friends with this user');
    }

    await this.prismaService.friendship.delete({
      where: { id: friendship.id },
    });

    return { message: 'Friend removed successfully' };
  }
}
