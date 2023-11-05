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
import { UserIdDto } from 'src/user/dtos/UserIdDto';

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

  @Delete('remove')
  @UseGuards(JwtAuthGuard)
  async removeFriend(@Req() req, @Body() body: UserIdDto) {
    const { id } = req.user;
    const { userId } = body;
    return this.friendshipService.removeFriend(id, userId);
  }

  @Patch('block')
  @UseGuards(JwtAuthGuard)
  async blockUser(@Req() req, @Body() body: UserIdDto) {
    const { id } = req.user;
    const { userId } = body;
    return this.friendshipService.blockUser(id, userId);
  }

  /* -------------------------------------------------------------------------- */
  /*                                  Requests                                  */
  /* -------------------------------------------------------------------------- */

  @Get('request/pending')
  @UseGuards(JwtAuthGuard)
  async getFriendRequests(@Req() req) {
    const { id } = req.user;
    return this.friendshipService.getFriendRequests(id);
  }

  @Post('request/send')
  @UseGuards(JwtAuthGuard)
  async sendFriendRequest(@Req() req, @Body() body: UserIdDto) {
    const { id } = req.user;
    const { userId } = body;
    return this.friendshipService.sendFriendRequest(id, userId);
  }

  @Patch('request/accept')
  @UseGuards(JwtAuthGuard)
  async acceptFriendRequest(@Req() req, @Body() body: UserIdDto) {
    const { id } = req.user;
    const { userId } = body;
    return this.friendshipService.acceptFriendRequest(id, userId);
  }
}
