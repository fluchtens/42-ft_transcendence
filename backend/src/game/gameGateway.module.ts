import { GameGateway } from './gameGateway'
import { Module } from '@nestjs/common'
import { AuthModule } from "src/auth/auth.module";
import { UserModule } from "src/user/user.module";
import { PrismaModule } from 'src/prisma/prisma.module';
import { GameService } from './game.service'
import { FriendshipModule } from 'src/friendship/friendship.module';

// @Module({
//   providers: [
// 		GameGateway,
// 		GameRouter,
// 		AuthService,
// 		UserService,
// 		PrismaService,
// 		GameService,
// 		FriendshipGateway,
// 	],
// //   providers: [GameGateway],
// })
// export class GameGatewayModule {}

@Module({
  providers: [ GameGateway, GameService ],
	imports: [AuthModule, UserModule, PrismaModule, FriendshipModule]
//   providers: [GameGateway],
})
export class GameGatewayModule {}

//
