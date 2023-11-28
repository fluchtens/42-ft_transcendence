import { GameGateway } from './gameGateway'
import { Module } from '@nestjs/common'
import { GameRouter } from './gameRouter.service'
import { AuthService } from "src/auth/auth.service";
import { UserService } from "src/user/user.service";
import { PrismaService } from 'src/prisma/prisma.service';
import { GameService } from './game.service'
import { FriendshipGateway } from 'src/friendship/friendship.gateway';

@Module({
  providers: [
		GameGateway,
		GameRouter,
		AuthService,
		UserService,
		PrismaService,
		GameService,
		FriendshipGateway,
	],
//   providers: [GameGateway],
})
export class GameGatewayModule {}
