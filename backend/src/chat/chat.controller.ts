import { Body, Controller, Delete, Get, Param, Post, Put, Req, UseGuards } from "@nestjs/common";
import { ChatService } from "./chat.service";
import { JwtAuthGuard } from "src/auth/guards/jwt-auth.guard";
import { Request } from "express";
import { MemberRole } from "@prisma/client";
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

// Votre code ici

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('createChannel')
  @UseGuards(JwtAuthGuard)
  async createChannel(@Req() req: Request,
  @Body() body: any){
    const { channelName } = body;
    console.log(channelName);
    return this.chatService.createChat(req, channelName);
  }

  @Get('getChannels')
  @UseGuards(JwtAuthGuard)
  async getChannel(@Req() req: Request){
    console.log(req.user);
    return this.chatService.getUserChannels(req);
  }

  @Post('addMember')
  @UseGuards(JwtAuthGuard)
  async addMember(@Req() req: Request, @Body() body){
    console.log(req.body);
    const { channelId, userId } = body;
    console.log(body);
    return this.chatService.addMember(req, channelId, Number(userId));
  }
  @Post('changeMemberRole')
  @UseGuards(JwtAuthGuard)
  async changeMemberRole(@Req() req: Request, @Body() body) {
    const { channelId, userId, newRole } = body;
    return this.chatService.changeMemberRole(req, channelId, userId, newRole);
  }

  @Post('addMessage')
  @UseGuards(JwtAuthGuard)
  async addMessage(@Req() req: Request, @Body() body) {
    const { channelId, messageContent } = body;
    return this.chatService.addMessage(req, channelId, messageContent);
  }

  @Put('changeMessage')
  @UseGuards(JwtAuthGuard)
  async changeMessage(@Req() req: Request, @Body() body) {
    const { messageId, newMessage } = body;
    return this.chatService.changeMessage(req, messageId, newMessage);
  }

  @Delete('message/:id')
  @UseGuards(JwtAuthGuard)
  async deleteMessage(@Req() req: Request,
  @Param('id') messageId: string) {
    return this.chatService.deleteMessage(req, messageId);
  }

  @Delete('channel/:id')
  @UseGuards(JwtAuthGuard)
  async deleteChannel(@Req() req: Request,
  @Param('id') channelId: string) {
    return this.chatService.deleteMessage(req, channelId);
  }
}