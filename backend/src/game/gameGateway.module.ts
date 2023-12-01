import { GameGateway } from './gameGateway'
import { Module } from '@nestjs/common'
import { AuthModule } from "src/auth/auth.module";
import { UserModule } from "src/user/user.module";
import { PrismaModule } from 'src/prisma/prisma.module';
import { GameService } from './game.service'
import { FriendshipModule } from 'src/friendship/friendship.module';

@Module({
  providers: [ GameGateway, GameService ],
	imports: [AuthModule, UserModule, PrismaModule, FriendshipModule],
	exports: [GameService]
})
export class GameGatewayModule {}
