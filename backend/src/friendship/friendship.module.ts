import { Module } from '@nestjs/common';
import { FriendshipController } from './friendship.controller';
import { FriendshipService } from './friendship.service';
import { FriendshipGateway } from './friendship.gateway';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from 'src/user/user.module';
import { RoomsService } from 'src/chat/room.service';

@Module({
  imports: [AuthModule, UserModule],
  controllers: [FriendshipController],
  providers: [FriendshipService, FriendshipGateway, RoomsService],
  exports: [FriendshipService, FriendshipGateway],
})
export class FriendshipModule {}
