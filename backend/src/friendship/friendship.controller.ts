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

  @Post('send')
  @UseGuards(JwtAuthGuard)
  async sendFriendRequest(@Req() req, @Body() body: FriendshipDto) {
    const { id } = req.user;
    const { receiverId } = body;
    return this.friendshipService.sendFriendRequest(id, receiverId);
  }

  @Patch('accept')
  @UseGuards(JwtAuthGuard)
  async acceptFriendRequest(@Req() req, @Body() body: UserDto) {
    const { id } = req.user;
    const { senderId } = body;
    return this.friendshipService.acceptFriendRequest(id, senderId);
  }

  /* -------------------------------------------------------------------------- */
  /*                                 Management                                 */
  /* -------------------------------------------------------------------------- */

  @Delete('remove')
  @UseGuards(JwtAuthGuard)
  async removeFriend(@Req() req, @Body() body: FriendshipDto) {
    const { id } = req.user;
    const { receiverId } = body;
    return this.friendshipService.removeFriend(id, receiverId);
  }

  @Patch('block')
  @UseGuards(JwtAuthGuard)
  async blockUser(@Req() req, @Body() body: FriendshipDto) {
    const { id } = req.user;
    const { receiverId } = body;
    return this.friendshipService.blockUser(id, receiverId);
  }
}
