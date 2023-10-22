import { Body, Controller, Get, Post, Req, UseGuards } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { Request } from "express";


@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}
  @Post()
  @UseGuards(JwtAuthGuard)
  async createChannel(@Req() req: Request){
    return this.chatService.createChat(req);
  }
  @Get()
  @UseGuards(JwtAuthGuard)
  async getChannel(@Req() req: Request){
    return ;
    // console.log
  }
  @Post('addMember')
  @UseGuards(JwtAuthGuard)
  async addMember(@Req() req: Request, @Body() body){
    console.log(req.body);
    // return this.chatService.addMember(req, body, "test");
  }
}