import { MiddlewareConsumer, Module, NestModule, RequestMethod } from "@nestjs/common";
import { UserController } from "./user.controller";
import { UserService } from "./user.service";
import { PrismaService } from "src/prisma.service";
import { ValidateUserAccountMiddleware, ValidateUserMiddleware } from "./user.middleware";

@Module(
  {
    imports: [],
    controllers: [UserController],
    providers: [UserService, PrismaService]
  }
)

export class UserModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ValidateUserMiddleware, ValidateUserAccountMiddleware)
    .forRoutes({
      path: 'api/v1/user/:id',
      method: RequestMethod.GET,
    });
  }
}
