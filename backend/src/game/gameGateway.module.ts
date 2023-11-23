import { GameGateway } from './gameGateway'
import { Module } from '@nestjs/common'
import { GameRouter } from './gameRouter.service'
import { AuthService } from "src/auth/auth.service";
import { UserService } from "src/user/user.service";

@Module({
  providers: [GameGateway, GameRouter, AuthService, UserService],
//   providers: [GameGateway],
})
export class GameGatewayModule {}
