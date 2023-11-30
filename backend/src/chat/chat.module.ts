import { Module } from '@nestjs/common';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { UserModule } from 'src/user/user.module';
import { AuthModule } from 'src/auth/auth.module';
import { RoomsService } from './room.service';
import { FriendshipModule } from 'src/friendship/friendship.module';

@Module({
  imports: [UserModule, AuthModule, FriendshipModule],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, RoomsService],
})
export class ChatModule {}
