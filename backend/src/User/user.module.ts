import { Module } from '@nestjs/common';
import { UserController } from './user.controller';
import { UserService } from './user.service';
import { AuthGuard } from 'src/auth/auth.guard';

@Module({
  controllers: [UserController],
  providers: [UserService, AuthGuard],
})
export class UserModule {}
