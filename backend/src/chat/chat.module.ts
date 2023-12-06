import { Module } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatGateway } from './chat.gateway';
import { UserModule } from 'src/user/user.module';
import { AuthModule } from 'src/auth/auth.module';
import { RoomsService } from './room.service';
import { FriendshipModule } from 'src/friendship/friendship.module';
import { GameGatewayModule } from 'src/game/gameGateway.module';

@Module({
  imports: [UserModule, AuthModule, FriendshipModule, GameGatewayModule],
  providers: [ChatService, ChatGateway, RoomsService],
})
export class ChatModule {}
