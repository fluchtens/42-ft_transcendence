import { Module } from '@nestjs/common';
import { FriendshipController } from './friendship.controller';
import { FriendshipService } from './friendship.service';
import { FriendshipGateway } from './friendship.gateway';
import { UserService } from 'src/user/user.service';
import { AuthService } from 'src/auth/auth.service';

@Module({
  controllers: [FriendshipController],
  providers: [FriendshipService, FriendshipGateway, AuthService, UserService],
})
export class FriendshipModule {}
