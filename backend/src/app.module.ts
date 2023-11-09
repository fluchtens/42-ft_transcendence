import { Module } from '@nestjs/common';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { ChatModule } from './chat/chat.module';
import { FriendshipModule } from './friendship/friendship.module';

@Module({
  imports: [PrismaModule, AuthModule, UserModule, FriendshipModule, ChatModule],
  controllers: [],
  providers: [],
})
export class AppModule {}
