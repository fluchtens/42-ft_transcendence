import { Module } from "@nestjs/common";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";
import { ChatGateway } from "./chat.gateway";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { UserModule } from "src/user/user.module";
import { AuthModule } from "src/auth/auth.module";
import { AuthService } from "src/auth/auth.service";
import { UserService } from "src/user/user.service";
import { RoomsService } from "./room.service";
import { FriendshipService } from "src/friendship/friendship.service";
import { FriendshipModule } from "src/friendship/friendship.module";
// import { SocketClient } from "./chat.client";


@Module({
  imports: [FriendshipModule, AuthModule, UserModule],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, RoomsService],
})
export class ChatModule {}