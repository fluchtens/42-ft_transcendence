import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { ChatService } from './chat.service';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { Request } from 'express';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Get()
  @UseGuards(JwtAuthGuard)
  async getCookie(@Req() req: Request) {
    const cookie = req.cookies;
    console.log(cookie);
    return cookie;
  }
}
