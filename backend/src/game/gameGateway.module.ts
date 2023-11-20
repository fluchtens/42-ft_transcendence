import { GameGateway } from './gameGateway'
import { Module } from '@nestjs/common'
import { GameRouter } from './gameRouter.service'

@Module({
  providers: [GameGateway, GameRouter],
//   providers: [GameGateway],
})
export class GameGatewayModule {}
