import { GameGateway } from './gameGateway';
import { Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from 'src/user/user.module';
import { GameService } from './game.service';
import { FriendshipModule } from 'src/friendship/friendship.module';

@Module({
  imports: [AuthModule, UserModule, FriendshipModule],
  providers: [GameService, GameGateway],
})
export class GameGatewayModule {}
