import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FriendshipStatus } from '@prisma/client';
import { UserService } from 'src/user/user.service';

@Injectable()
export class FriendshipService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UserService,
  ) {}

  /* -------------------------------------------------------------------------- */
  /*                                   Private                                  */
  /* -------------------------------------------------------------------------- */

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

  private async findPendingRequest(senderId: number, receiverId: number) {
    try {
      const friendship = await this.prismaService.friendship.findFirst({
        where: {
          senderId: senderId,
          receiverId: receiverId,
          status: FriendshipStatus.PENDING,
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

  private async findFriendRequests(userId: number) {
    try {
      const requests = await this.prismaService.friendship.findMany({
        where: {
          receiverId: userId,
          status: FriendshipStatus.PENDING,
        },
      });

      return requests;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  private exclude<User, Key extends keyof User>(
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

  async getFriends(userId: number) {
    const user = await this.findFriends(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const friends = [
      ...user.addedFriends.map((user) => user.receiver),
      ...user.acceptedFriends.map((user) => user.sender),
    ];

    const friendsData = friends.map((user) => {
      if (user.avatar) {
        user.avatar = `${process.env.VITE_BACK_URL}/user/avatar/${user.avatar}`;
      }
      return user;
    });

    return friendsData;
  }

  async removeFriend(reqUserId: number, targetUserId: number) {
    if (reqUserId === targetUserId) {
      throw new BadRequestException("You can't delete yourself");
    }

    const targetUser = await this.userService.findUserById(targetUserId);
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    const friendship = await this.findFriendship(reqUserId, targetUserId);
    if (!friendship || friendship.status !== FriendshipStatus.ACCEPTED) {
      throw new BadRequestException('You are not friends with this user');
    }

    await this.prismaService.friendship.update({
      where: { id: friendship.id },
      data: {
        sender: { connect: { id: reqUserId } },
        receiver: { connect: { id: targetUserId } },
        status: FriendshipStatus.DELETED,
      },
    });

    return { message: 'Friend removed successfully' };
  }

  async blockUser(reqUserId: number, targetUserId: number) {
    if (reqUserId === targetUserId) {
      throw new BadRequestException("You can't block yourself");
    }

    const targetUser = await this.userService.findUserById(targetUserId);
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    const friendship = await this.findFriendship(reqUserId, targetUserId);
    if (!friendship) {
      await this.prismaService.friendship.create({
        data: {
          sender: { connect: { id: reqUserId } },
          receiver: { connect: { id: targetUserId } },
          status: FriendshipStatus.BLOCKED,
        },
      });
    } else {
      if (friendship.status === FriendshipStatus.BLOCKED) {
        throw new BadRequestException('This user is already blocked');
      }

      await this.prismaService.friendship.update({
        where: { id: friendship.id },
        data: {
          sender: { connect: { id: reqUserId } },
          receiver: { connect: { id: targetUserId } },
          status: FriendshipStatus.BLOCKED,
        },
      });
    }

    return { message: 'User successfully blocked' };
  }

  /* -------------------------------------------------------------------------- */
  /*                                  Requests                                  */
  /* -------------------------------------------------------------------------- */

  async getFriendRequests(userId: number) {
    const requests = await this.findFriendRequests(userId);
    return requests;
  }

  async sendFriendRequest(senderId: number, receiverId: number) {
    if (senderId === receiverId) {
      throw new BadRequestException("You can't be friends with yourself");
    }

    const receiverUser = await this.userService.findUserById(receiverId);
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
      } else {
        await this.prismaService.friendship.update({
          where: { id: friendship.id },
          data: {
            sender: { connect: { id: senderId } },
            receiver: { connect: { id: receiverId } },
            status: FriendshipStatus.PENDING,
          },
        });
      }
    } else {
      await this.prismaService.friendship.create({
        data: {
          sender: { connect: { id: senderId } },
          receiver: { connect: { id: receiverId } },
          status: FriendshipStatus.PENDING,
        },
      });
    }

    return { message: `Friend request sent to ${receiverUser.username}` };
  }

  async acceptFriendRequest(receiverId: number, senderId: number) {
    if (receiverId === senderId) {
      throw new BadRequestException("You can't be friends with yourself");
    }

    const senderUser = await this.userService.findUserById(senderId);
    if (!senderUser) {
      throw new NotFoundException('User not found');
    }

    const friendship = await this.findPendingRequest(senderId, receiverId);
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

  async declineFriendRequest(receiverId: number, senderId: number) {
    if (receiverId === senderId) {
      throw new BadRequestException("You can't be friends with yourself");
    }

    const senderUser = await this.userService.findUserById(senderId);
    if (!senderUser) {
      throw new NotFoundException('User not found');
    }

    const friendship = await this.findPendingRequest(senderId, receiverId);
    if (!friendship) {
      throw new BadRequestException(
        'You have not received an invitation from this user',
      );
    }

    await this.prismaService.friendship.update({
      where: { id: friendship.id },
      data: { status: FriendshipStatus.DECLINED },
    });

    return {
      message: `You have deleted the friend request of ${senderUser.username}`,
    };
  }
}
