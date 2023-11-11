import { Module } from '@nestjs/common';
import { FriendshipController } from './friendship.controller';
import { FriendshipService } from './friendship.service';
import { FriendshipGateway } from './friendship.gateway';
import { UserService } from 'src/user/user.service';

@Module({
  controllers: [FriendshipController],
  providers: [FriendshipService, FriendshipGateway, UserService],
})
export class FriendshipModule {}
