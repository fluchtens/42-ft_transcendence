import { GameGateway } from './gameGateway'
import { Module } from '@nestjs/common'
import { GameRouter } from './gameRouter.service'
import { AuthService } from "src/auth/auth.service";

@Module({
  providers: [GameGateway, GameRouter, AuthService],
//   providers: [GameGateway],
})
export class GameGatewayModule {}
