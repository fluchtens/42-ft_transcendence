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
import { FriendshipGateway } from './friendship.gateway';

@Controller('friendship')
export class FriendshipController {
  constructor(
    private readonly friendshipService: FriendshipService,
    private readonly friendshipGateway: FriendshipGateway,
  ) {}

  /* -------------------------------------------------------------------------- */
  /*                                   General                                  */
  /* -------------------------------------------------------------------------- */

  @Post('block')
  @UseGuards(JwtAuthGuard)
  async blockUser(@Req() req, @Body() body: UserIdDto) {
    const { id } = req.user;
    const { userId } = body;
    const res = await this.friendshipService.blockUser(id, userId);
    this.friendshipGateway.handleReloadList();
    return res;
  }

  @Delete('unlock')
  @UseGuards(JwtAuthGuard)
  async unlockUser(@Req() req, @Body() body: UserIdDto) {
    const { id } = req.user;
    const { userId } = body;
    const res = await this.friendshipService.unlockUser(id, userId);
    this.friendshipGateway.handleReloadList();
    return res;
  }

  /* -------------------------------------------------------------------------- */
  /*                                   Friends                                  */
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
    const res = await this.friendshipService.removeFriend(id, userId);
    this.friendshipGateway.handleReloadList();
    return res;
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
    const res = await this.friendshipService.sendFriendRequest(id, userId);
    this.friendshipGateway.handleReloadList();
    return res;
  }

  @Patch('request/accept')
  @UseGuards(JwtAuthGuard)
  async acceptFriendRequest(@Req() req, @Body() body: UserIdDto) {
    const { id } = req.user;
    const { userId } = body;
    const res = await this.friendshipService.acceptFriendRequest(id, userId);
    this.friendshipGateway.handleReloadList();
    return res;
  }

  @Delete('request/decline')
  @UseGuards(JwtAuthGuard)
  async declineFriendRequest(@Req() req, @Body() body: UserIdDto) {
    const { id } = req.user;
    const { userId } = body;
    const res = await this.friendshipService.declineFriendRequest(id, userId);
    this.friendshipGateway.handleReloadList();
    return res;
  }
}
