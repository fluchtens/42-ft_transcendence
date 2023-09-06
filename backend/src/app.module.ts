import { Module } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { UserModule } from './User/user.module';
import { UserController } from './User/user.controller';

@Module({
  imports: [UserModule],
  controllers: [UserController],
  providers: [PrismaService],
})
export class AppModule {}
