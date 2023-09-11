import { Module } from "@nestjs/common";
import { UserModule } from "./User/user.module";
import { PrismaService } from "./prisma.service";

@Module(
  {
    imports: [UserModule],
    controllers: [],
    providers: []
  }
)

export class CoreModule {}