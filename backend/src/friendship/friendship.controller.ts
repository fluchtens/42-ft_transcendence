import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FriendshipService } from './friendship.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FriendshipDto, UserDto } from './dtos/FriendshipDto';

@Controller('friendship')
export class FriendshipController {
  constructor(private readonly friendshipService: FriendshipService) {}

  /* -------------------------------------------------------------------------- */
  /*                                   General                                  */
  /* -------------------------------------------------------------------------- */

  @Get(':userId')
  async getFriends(@Param('userId', ParseIntPipe) userId: string) {
    return this.friendshipService.getFriends(parseInt(userId));
  }

  /* -------------------------------------------------------------------------- */
  /*                                  Requests                                  */
  /* -------------------------------------------------------------------------- */

  @Post('add')
  @UseGuards(JwtAuthGuard)
  async addFriend(@Req() req, @Body() body: FriendshipDto) {
    return this.friendshipService.addFriend(req, body);
  }

  @Patch('accept')
  @UseGuards(JwtAuthGuard)
  async acceptFriend(@Req() req, @Body() body: UserDto) {
    const { id } = req.user;
    const receiverId: number = parseInt(id);
    const { senderId } = body;
    return this.friendshipService.acceptFriend(receiverId, senderId);
  }

  /* -------------------------------------------------------------------------- */
  /*                                 Management                                 */
  /* -------------------------------------------------------------------------- */

  @Delete('remove')
  @UseGuards(JwtAuthGuard)
  async removeFriend(@Req() req, @Body() body: FriendshipDto) {
    return this.friendshipService.removeFriend(req, body);
  }
}
