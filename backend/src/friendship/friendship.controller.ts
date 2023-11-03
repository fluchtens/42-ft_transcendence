import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { FriendshipService } from './friendship.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { FriendshipDto } from './dtos/FriendshipDto';

@Controller('friendship')
export class FriendshipController {
  constructor(private readonly friendshipService: FriendshipService) {}

  /* -------------------------------------------------------------------------- */
  /*                                   General                                  */
  /* -------------------------------------------------------------------------- */

  @Get(':userId')
  async getFriends(@Param('userId') userId: string) {
    return this.friendshipService.getFriends(parseInt(userId));
  }

  @Post('add')
  @UseGuards(JwtAuthGuard)
  async addFriend(@Req() req, @Body() body: FriendshipDto) {
    return this.friendshipService.addFriend(req, body);
  }

  @Post('remove')
  @UseGuards(JwtAuthGuard)
  async removeFriend(@Req() req, @Body() body: FriendshipDto) {
    return this.friendshipService.removeFriend(req, body);
  }
}
