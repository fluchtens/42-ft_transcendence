import { GameGateway } from './gameGateway'
import { Module } from '@nestjs/common'
import { GameRouter } from './gameRouter.service'
import { AuthService } from "src/auth/auth.service";
import { UserService } from "src/user/user.service";
import { PrismaService } from 'src/prisma/prisma.service';

@Module({
  providers: [GameGateway, GameRouter, AuthService, UserService, PrismaService],
//   providers: [GameGateway],
})
export class GameGatewayModule {}
