import { Module } from "@nestjs/common";
import { ChatController } from "./chat.controller";
import { ChatService } from "./chat.service";
import { ChatGateway } from "./chat.gateway";
import { SocketClient } from "./chat.client";


@Module({
  controllers: [ChatController],
  providers: [ChatService, ChatGateway, SocketClient],
})
export class ChatModule {}