import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { FriendshipService } from './friendship.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FriendshipDto } from './dtos/FriendshipDto';

@Controller('friendship')
export class FriendshipController {
  constructor(private readonly friendshipService: FriendshipService) {}

  /* -------------------------------------------------------------------------- */
  /*                                   General                                  */
  /* -------------------------------------------------------------------------- */

  // @Get('friend/:userId')
  // async getFriends(@Param('userId') userId: number) {
  //   return this.userService.getFriends(2);
  // }

  @Post('add')
  @UseGuards(JwtAuthGuard)
  async addFriend(@Req() req, @Body() body: FriendshipDto) {
    return this.friendshipService.addFriend(req, body);
  }
}
