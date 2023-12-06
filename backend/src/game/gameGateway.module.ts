import { GameGateway } from './gameGateway';
import { Global, Module } from '@nestjs/common';
import { AuthModule } from 'src/auth/auth.module';
import { UserModule } from 'src/user/user.module';
import { GameService } from './game.service';
import { FriendshipModule } from 'src/friendship/friendship.module';

@Global()
@Module({
  providers: [GameGateway, GameService],
  imports: [AuthModule, UserModule, FriendshipModule],
  exports: [GameService],
})
export class GameGatewayModule {}
