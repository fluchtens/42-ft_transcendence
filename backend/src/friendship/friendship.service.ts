import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
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
    return this.prismaService.user.findUnique({
      where: { id },
    });
  }

  private async findRelationship(senderId: number, receiverId: number) {
    return this.prismaService.friendship.findFirst({
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
  }

  /* -------------------------------------------------------------------------- */
  /*                                   General                                  */
  /* -------------------------------------------------------------------------- */

  // async getFriends(userId: number) {
  //   const user = await this.prismaService.user.findUnique({
  //     where: { id: userId },
  //     include: {
  //       addedFriends: {
  //         where: { status: true },
  //         select: {
  //           receiver: {
  //             select: {
  //               id: true,
  //               username: true,
  //               avatar: true,
  //             },
  //           },
  //         },
  //       },
  //       acceptedFriends: {
  //         where: { status: true },
  //         select: {
  //           sender: {
  //             select: {
  //               id: true,
  //               username: true,
  //               avatar: true,
  //             },
  //           },
  //         },
  //       },
  //     },
  //   });

  //   const friends = [
  //     ...user.userFriends.map((friendship) => friendship.friend),
  //     ...user.friendUserFriends.map((friendship) => friendship.user),
  //   ];

  //   console.log(friends);

  //   return friends;
  // }

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

    const friendship = await this.findRelationship(senderId, receiverId);
    if (friendship) {
      throw new BadRequestException('You are already friends');
    }

    await this.prismaService.friendship.create({
      data: {
        sender: { connect: { id: senderId } },
        receiver: { connect: { id: receiverId } },
      },
    });

    return { message: 'Friend request sent' };
  }
}
