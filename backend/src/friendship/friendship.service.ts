import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { FriendshipStatus } from '@prisma/client';
import { UserService } from 'src/user/user.service';
import { FriendshipGateway } from './friendship.gateway';

@Injectable()
export class FriendshipService {
  constructor(
    private readonly prismaService: PrismaService,
    private readonly userService: UserService,
    private readonly friendshipGateway: FriendshipGateway,
  ) {}

  /* -------------------------------------------------------------------------- */
  /*                                   Private                                  */
  /* -------------------------------------------------------------------------- */

  async findFriendship(senderId: number, receiverId: number) {
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

  private async findBlockedRelation(senderId: number, receiverId: number) {
    try {
      const friendship = await this.prismaService.friendship.findFirst({
        where: {
          senderId: senderId,
          receiverId: receiverId,
          status: FriendshipStatus.BLOCKED,
        },
      });
      return friendship;
    } catch (error) {
      throw new BadRequestException(error.message);
    }
  }

  private async findBlockedRelations(userId: number) {
    try {
      const blockedUsers = await this.prismaService.friendship.findMany({
        where: {
          senderId: userId,
          status: FriendshipStatus.BLOCKED,
        },
      });
      return blockedUsers;
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

  /* -------------------------------------------------------------------------- */
  /*                                   General                                  */
  /* -------------------------------------------------------------------------- */

  async getBlockedUsers(userId: number) {
    const blockedRelations = await this.findBlockedRelations(userId);
    const blockedUsers = await Promise.all(
      blockedRelations.map(async (relation) => {
        const user = await this.userService.getUserById(relation.receiverId);
        return user;
      }),
    );
    return blockedUsers;
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
      const blockedRelation = await this.findBlockedRelation(
        reqUserId,
        targetUserId,
      );
      if (blockedRelation) {
        throw new BadRequestException('You have already blocked this user');
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

  async unlockUser(reqUserId: number, targetUserId: number) {
    if (reqUserId === targetUserId) {
      throw new BadRequestException("You can't unlock yourself");
    }

    const targetUser = await this.userService.findUserById(targetUserId);
    if (!targetUser) {
      throw new NotFoundException('User not found');
    }

    const blockedRelation = await this.findBlockedRelation(
      reqUserId,
      targetUserId,
    );
    if (!blockedRelation) {
      throw new BadRequestException("You haven't blocked this user");
    }

    await this.prismaService.friendship.delete({
      where: { id: blockedRelation.id },
    });

    return { message: 'User successfully unlocked' };
  }

  /* -------------------------------------------------------------------------- */
  /*                                   Friends                                  */
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

    friends.sort((a, b) => a.username.localeCompare(b.username));

    const friendsData = friends.map((user: any) => {
      if (user.avatar) {
        user.avatar = `${process.env.VITE_BACK_URL}/user/avatar/${user.avatar}`;
      }
      const userStatus = this.friendshipGateway.getUserStatus().get(user.id);
      if (userStatus) {
        user.status = userStatus.status;
      } else {
        user.status = 'Offline';
      }
      return user;
    });

    friendsData.sort((a, b) => {
      if (a.status === 'In game' && b.status !== 'In game') return -1;
      if (a.status !== 'In game' && b.status === 'In game') return 1;
      if (a.status === 'Online' && b.status !== 'Online') return -1;
      if (a.status !== 'Online' && b.status === 'Online') return 1;
      return 0;
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

    await this.prismaService.friendship.delete({
      where: { id: friendship.id },
    });

    return { message: 'Friend removed successfully' };
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

    await this.prismaService.friendship.delete({
      where: { id: friendship.id },
    });

    return {
      message: `You have deleted the friend request of ${senderUser.username}`,
    };
  }
}
