import {
  BadGatewayException,
  BadRequestException,
  Body,
  Inject,
  OnModuleInit,
  Param,
  Req,
  UseGuards,
  forwardRef,
} from '@nestjs/common';

import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Request } from 'express';
import { env } from 'process';

import { Server } from 'socket.io';
import { Socket } from 'socket.io';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { ChatService } from './chat.service';
import { ChatController } from './chat.controller';
import { AuthService } from 'src/auth/auth.service';
import { ExecutionContextHost } from '@nestjs/core/helpers/execution-context-host';
import cookieParser from 'cookie-parser';
import { UserService } from 'src/user/user.service';
import { RoomsService } from './room.service';
import {
  SendMessageDto,
  ChannelData,
  Messages,
  AddMemberDto,
  CreateChannelDto,
  GetChannelDto,
  DeleteMessageDto,
  ChangeMessageDto,
  MemberDto,
  ChangeRoleDto,
  ChangeChannelPasswordDto,
  KickUserDto,
  ChangeChannelVisibilityDto,
} from './dtos/gateway.dtos';
import * as bcrypt from 'bcryptjs';
import { FriendshipStatus, Member, User } from '@prisma/client';
import { FriendshipService } from 'src/friendship/friendship.service';

@WebSocketGateway({
  namespace: 'chatSocket',
  cors: {
    origin: ['http://localhost'],
    credentials: true,
  },
})
export class ChatGateway implements OnModuleInit {
  constructor(
    private readonly authService: AuthService,
    private readonly chatService: ChatService,
    private readonly userService: UserService,
    private readonly roomService: RoomsService,
    private readonly friendshipService: FriendshipService,
  ) {}

  private connectedUsers: Map<string, Set<string>> = new Map();
  private usersData: Map<number, Partial<User>> = new Map();
  private userConnections: Map<number, Set<Socket>> = new Map();

  @WebSocketServer()
  server: Server;

  private addSocketToUser(userId: number, socketData: Socket): void {
    let socket = this.userConnections.get(userId);
    if (!socket) {
      socket = new Set<Socket>(),
      this.userConnections.set(userId, socket);
    }

    socket.add(socketData);
    this.userConnections.set(userId, socket);
  }

  private removeSocketFromUser(userId: number, socketData: Socket) {
    const userSocket = this.userConnections.get(userId);
    if (userSocket) {
      userSocket.delete(socketData);

      if (userSocket.size === 0) {
        this.userConnections.delete(userId);
      } else {
        this.userConnections.set(userId, userSocket);
      }
    }
  }

  async InitRooms(client: Socket) {
    const userId: string = String(client.handshake.auth.userId);
    try {
      const channels = await this.chatService.getUserChannels(
        Number(client.handshake.auth.userId),
      );
      channels.forEach((channel) => {
        if (!this.roomService.getRoomClients(channel.id)) {
          this.roomService.createRoom(channel.id);
        }
        if (!channel.password) this.roomService.joinRoom(client, channel.id);
      });
      if (!this.roomService.getRoomClients(userId)) {
        this.roomService.createRoom(userId);
      }
      this.roomService.joinRoom(client, userId);
    } catch (error) {
      console.error('chat init rooms error socket io', error.message);
    }
  }

  verifyUserConnection(socketId: string, channelId: string): boolean {
    if (!channelId) {
      return false;
    }
    const connectedUsersSet = this.connectedUsers.get(channelId);
    if (!connectedUsersSet || !connectedUsersSet.has(socketId)) {
      return false;
    }
    return true;
  }

  async getOrAddUserData(number: number): Promise<Partial<User>> {
    const existingUser = this.usersData.get(number);
    if (existingUser) {
      return existingUser;
    } else {
      const newUser: Partial<User> = await this.userService.getUserById(number);
      this.usersData.set(number, newUser);
      return newUser;
    }
  }

  async refreshUserData(userId: number){
    try {
      const updatedUserData = await this.userService.getUserById(userId);
  
      this.usersData.set(userId, updatedUserData);

      console.log(`User data refreshed for user with ID ${userId}`);
    } catch (error) {
      console.error(`Error refreshing user data: ${error.message}`);
    }
  }

  async getChannelData(
    client: Socket,
    channelId: string,
    getMessages: boolean,
    password?: string,
  ): Promise<ChannelData> {
    let channelData: ChannelData;
    try {
      const connection: boolean = this.verifyUserConnection(client.id, channelId);
      const channelInfo = await this.chatService.getChannelById(
        channelId,
        password,
        connection,
      );
      channelData = new ChannelData();
      channelData.isConnected = connection;
      channelData.inviteCode = channelInfo.inviteCode;
      channelData.id = channelInfo.id;
      channelData.name = channelInfo.name;
      channelData.public = channelInfo.public;
      const userInChannel = await this.chatService.findMemberInChannel(
        channelData.id,
        Number(client.handshake.auth.userId),
      );
      if (userInChannel) {
        channelData.isMember = true;
      } else {
        channelData.isMember = false;
      }
      if (channelInfo.password){
        channelData.protected = true;
      }
      if (channelInfo.password === 'true' || !getMessages) {
        channelData.messages = [];
        channelData.members = [];
        return channelData;
      }
      this.roomService.joinRoom(client, channelId);
      if (!connection) {
        let connectedUsersSet = this.connectedUsers.get(channelId);
        if (!connectedUsersSet) {
          connectedUsersSet = new Set<string>();
          this.connectedUsers.set(channelId, connectedUsersSet);
        }
        connectedUsersSet.add(client.id);
      }
      if (!channelInfo.password) channelData.protected = false;
      const channelMembers =
        await this.chatService.getChannelMembers(channelId);
      channelData.members = channelMembers;
      const messagesRaw =
        await this.chatService.getMessagesByChannel(channelId);

      const messages: Messages[] = await Promise.all(
        messagesRaw.map(async (rawMessage) => {
          const user = await this.getOrAddUserData(rawMessage.userId);
          return new Messages(
            rawMessage.id,
            rawMessage.content,
            rawMessage.userId,
            user,
          );
        }),
      );
      const memberDto: MemberDto[] = await Promise.all(
        channelMembers.map(async (rawMember) => {
          const user = await this.getOrAddUserData(rawMember.userId);
          return new MemberDto(rawMember, user);
        }),
      );
      channelData.messages = messages;
      channelData.members = memberDto;
      // channelData.isConnected = true;
    } catch (error) {
      console.error('error getChannelData', error);
      throw error;
    }
    return channelData;
  }

  async handleConnection(@ConnectedSocket() client: Socket) {
    try {
      const cookie = client.handshake.headers.cookie;
      if (!cookie) {
        throw new Error('No cookies found');
      }

      const cookies = cookie.split(';').map((cookie) => cookie.trim());
      const jwtCookie = cookies.find((cookie) =>
        cookie.startsWith('access_token='),
      );

      const token = jwtCookie.substring('access_token='.length);
      if (!token) {
        throw new Error('access_token not found');
      }
      const decodedToken = this.authService.verifyAccessToken(token);
      client.handshake.auth.userId = decodedToken.id;
      // this.addSocketToUser(client.handshake.auth.userId, client.id);
      const userId = client.handshake.auth.userId;

      this.addSocketToUser(userId, client);
    } catch (error) {
      console.error('not connected', error.message);
    }
  }

  handleDisconnect(client: Socket) {
    this.roomService.disconnectClient(client);
    const userId = client.handshake.auth.userId;

    this.removeSocketFromUser(userId, client);
    
    this.connectedUsers.forEach((usersSet, channelId) => {
      if (usersSet.has(client.id)) {
        usersSet.delete(client.id);
        if (usersSet.size === 0) {
          this.connectedUsers.delete(channelId);
        }
      }
    });
  }

  onModuleInit() {
    this.server.on('connection', (socket) => {
      this.InitRooms(socket);
    });
  }

  @SubscribeMessage('getAllChannels')
  async handleGetAllChannels(@ConnectedSocket() client: Socket): Promise<void> {
    const userId = client.handshake.auth.userId;
    if (userId) {
      try {
        const channels = await this.chatService.getUserChannels(userId);
        const publicChannels = await this.chatService.getAllPublicChannels();
        const allChannels = [...channels, ...publicChannels];
        const channelIds = allChannels.map((channel) => channel.id);
        client.emit('allChannels', channelIds);
      } catch (error) {
        console.error('error getting all channels:', error.message);
      }
    } else {
      console.error('User ID not available.254');
    }
  }

  @SubscribeMessage('getChannelStatus')
  async getChannelStatus(@ConnectedSocket() client: Socket,
  @MessageBody() channelId: string) {
    const userId: number = client.handshake.auth.userId;
    if (userId) {
      const channelIsPublic  = await this.chatService.isChannelPublic(channelId);
      const isMember = await this.chatService.findMemberInChannel(channelId, userId);
      if (channelIsPublic && !isMember) {
        const channel = await this.chatService.getChannelById(channelId);
        return channel;
      }
      const channel = await this.getChannelData(client, channelId, false);
      return channel;
    }
    else {
      console.log("userId Invalid getChannelStatus");
      return ;
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() getChannelDto: GetChannelDto,
  ) {
    const userId = client.handshake.auth.userId;
    const { channelId, password, getMessages } = getChannelDto;
    if (userId) {
      try {
        const ChannelData: ChannelData = await this.getChannelData(
          client,
          channelId,
          getMessages,
          password,
        );
        client.emit(`channelData:${channelId}`, ChannelData);
        if (ChannelData)
         return true;
        // if (!ChannelData.isMember && !ChannelData.public)
        //  return true;
      } catch (error) {
        console.error('Error joining room:', error.message);
        return false;
      }
    } else {
      console.error('User ID not available.281');
      return false;
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageDto: SendMessageDto,
  ): Promise<void> {
    const userId = client.handshake.auth.userId;
    const { channelId, message } = messageDto;
    if (userId && channelId && message) {
      try {
        const channel = await this.chatService.getChannelById(channelId);
        if (channel) {
          const messageSend = await this.chatService.addMessage(
            userId,
            channelId,
            message,
          );
          if (!messageSend) throw new Error('Message cannot be send');
          const messageData: Messages = messageSend;
          messageData.user = await this.getOrAddUserData(userId);
          this.server.to(channelId).emit(`${channelId}/message`, messageData);
        }
      } catch (error) {
        console.error('sendMessage error', error.message);
      }
    }
    return;
  }

  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() deleteMessageDto: DeleteMessageDto,
  ) {
    const { messageId, channelId } = deleteMessageDto;
    const userId = client.handshake.auth.userId;
    if (userId) {
      try {
        const message = await this.chatService.deleteMessage(userId, messageId);
        if (message) {
          this.server
            .to(channelId)
            .emit(`${channelId}/messageDeleted`, messageId);
        } else {
          console.log('failed to delete message');
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      console.log('UserID not available.');
    }
  }

  @SubscribeMessage('updateMessage')
  async handleUpdateMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() changeMessageDto: ChangeMessageDto,
  ) {
    const { messageId, newMessage } = changeMessageDto;
    const userId = client.handshake.auth.userId;
    if (userId) {
      try {
        const message = await this.chatService.changeMessage(
          userId,
          messageId,
          newMessage,
        );
        if (message) {
          const channelData = await this.getChannelData(
            client,
            message.channelId,
            true,
          );
          this.server
            .to(message.channelId)
            .emit(`channelData:${message.channelId}`, channelData);
        } else {
          console.log('failed to update message');
        }
      } catch (error) {
        console.error(error);
      }
    } else {
      console.log('UserID not available.');
    }
  }

  @SubscribeMessage('createChannel')
  async createChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() createChannelDto: CreateChannelDto,
  ) {
    const userId = Number(client.handshake.auth.userId);
    let { channelName } = createChannelDto;
    const { isPublic, password } = createChannelDto;
    if (userId) {
      if (!channelName) {
        try {
          const user = await this.getOrAddUserData(userId);
          channelName = user.username + '_channel';
        } catch (error) {
          console.error('createchannel error', error.message);
          throw new BadRequestException();
        }
      }
      try {
        const channelData = await this.chatService.createChannel(
          userId,
          channelName,
          isPublic,
          password,
        );
        this.roomService.createRoom(channelData.id);
        this.roomService.joinRoom(client, channelData.id);
        if (isPublic) {
          this.server.emit('newChannel', channelData.id);
        } else {
          client.emit('newChannel', channelData.id);
        }
      } catch (error) {
        console.error('createchannel error', error.message);
        throw new BadRequestException();
      }
    } else {
      console.log('User ID not available.410');
    }
  }

  @SubscribeMessage('refreshUser')
  async handleRefreshUser(
    @ConnectedSocket() client: Socket) {
    const userId : number = client.handshake.auth.userId;
    if (userId) {
      await this.refreshUserData(userId);
    }
  }

  @SubscribeMessage('deleteChannel')
  async handleDeleteChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() channelId: string,
  ) {
    console.log(channelId)
    const userId = Number(client.handshake.auth.userId);
    if (userId) {
      try {
        const channel : ChannelData = await this.getChannelData(client, channelId, true);
        if (channel) {
          const deleted = await this.chatService.deleteChannel(
            userId,
            channelId,
          );
          for (const member of channel.members) {
            const memberId: number = member.member.userId;
            const clients = this.roomService.getRoomClients(channelId);
            clients.forEach((client) => {
              this.roomService.leaveRoom(client, channelId);
            });
            this.server.to(String(memberId)).emit('channelDeleted', channelId);
          }
          this.connectedUsers.delete(channelId);
          console.log(deleted);
          return "";
        } else {
          console.log('Error when get Channel data');
          throw new Error('Error when get Channel data');
        }
      } catch (error) {
        console.error(error.message);
        return error.message;
      }
    } else {
      console.log('User ID not available.449');
      return 'User ID not available.450';
    }
  }

  @SubscribeMessage('addMember')
  async addMember(
    @ConnectedSocket() client: Socket,
    @MessageBody() addMemberDto: AddMemberDto,
  ) {
    const userId = Number(client.handshake.auth.userId);
    if (userId) {
      try {
        const { channelId, memberUsername } = addMemberDto;
        const member = await this.userService.findUserByUsername(memberUsername);
        const friendship = await this.friendshipService.findFriendship(userId, member.id);
        if (!friendship || friendship.status !== FriendshipStatus.ACCEPTED) {
          throw new Error('You are not friends with this user');
        }
        if (channelId && member) {
          const result = await this.chatService.addMember(
            userId,
            channelId,
            member.id,
          );
          if (!result)
            throw new Error("member is in the channel");
          if (result) {
            const user = await this.getOrAddUserData(userId);
            const message = user.username + ' has added ' + member.username;
            const messageData = await this.chatService.addMessage(
              userId,
              channelId,
              message,
            );
            const messageDataDto: Messages = messageData;
            messageDataDto.user = user;
            this.server
              .to(channelId)
              .emit(`${channelId}/message`, messageDataDto);
            const userMember = await this.getOrAddUserData(Number(member.id));
            this.server
              .to(channelId)
              .emit(`${channelId}/member`, { member: result, user: userMember });
            this.server.to(String(member.id)).emit('newChannel', channelId);
            return null;
          }
        } else {
          console.error('channelId or member not found, addMemberFail');
          return "channelId or member not found, addMemberFail";
        }
      }
      catch (error) {
        console.log(error.message);
        return error.message;
      }
    } else {
      console.log('User ID not available.504');
      return "User ID not available.";
    }
  }

  @SubscribeMessage('joinPublicChannel')
  async handleJoinPublicChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() channelDto: GetChannelDto,
  ) {
    const userId = Number(client.handshake.auth.userId);
    if (userId) {
      try {
        const channel = await this.chatService.getChannelById(
          channelDto.channelId,
          );
          if (channel) {
            console.log(channelDto.channelId);
            const member = await this.chatService.findMemberInChannel(channelDto.channelId, userId);
            if (member) {
              throw new Error("member is in channel")
            }
            const joinChannel = await this.chatService.joinPublicChannel(
              userId,
              channelDto.channelId,
              channelDto.password,
            );
            if (joinChannel) {
              const user = await this.getOrAddUserData(userId);
              const message = user.username + ' have joined the channel';
              const messageData = await this.chatService.addMessage(
                userId,
                channelDto.channelId,
                message,
              );
              const messageDataDto: Messages = messageData;
              messageDataDto.user = user;
              this.server
                .to(channelDto.channelId)
                .emit(`${channelDto.channelId}/message`, messageDataDto);
              this.server
                .to(channelDto.channelId)
                .emit(`${channelDto.channelId}/member`, {
                  member: joinChannel,
                  user: user,
                });
              // const channelInfo = await this.getChannelData(
              //   client,
              //   channel.id,
              //   true,
              //   channelDto.password,
              // );
              // this.server
              //   .to(String(userId))
              //   .emit(`channelData:${channel.id}`, channelInfo);
              this.server.to(String(userId)).emit("resetChannel", channel.id);
              return true;
            } else {
              throw new Error('error when join the channel');
            }
          }
          else {
          throw new Error('Channel not found');
        }
      } catch (error) {
        console.log(error.message);
        return false;
      }
    } else {
      console.log('User ID not available.572');
      return false;
    }
  }

  @SubscribeMessage('protectChannel')
  async handleChannelProtection(
    @ConnectedSocket() client: Socket,
    @MessageBody() changeChannelPasswordDto: ChangeChannelPasswordDto,
  ) {
    const userId = Number(client.handshake.auth.userId);
    if (userId) {
      try {
        const { channelId, password } = changeChannelPasswordDto;
        const protect = await this.chatService.updateChannelWithPassword(userId, channelId, password);
        return "";
      }
      catch (error) {
        console.log(error.message);
        return error.message;
      }
    } else {
      console.log('User ID not available.594');
      return 'User ID not available';
    }
  }

  @SubscribeMessage('changeRole')
  async handleChangeRole(
    @ConnectedSocket() client: Socket,
    @MessageBody() changeRoleDto: ChangeRoleDto) {
    const userId = Number(client.handshake.auth.userId);
    if (userId) {
      try {
        const { channelId, memberId, newRole } = changeRoleDto;
        if (channelId && memberId && newRole) {
          const changeRole = await this.chatService.changeMemberRole(userId, channelId, memberId, newRole);

          const userMember = await this.getOrAddUserData(Number(memberId));
            this.server
              .to(channelId)
              .emit(`${channelId}/member`, { member: changeRole, user: userMember });
          console.log(changeRole);
          return null;
        }
      }
      catch (error) {
        console.log(error.message);
        return error.message;
      }
    } else {
      console.log('User ID not available.622');
      return 'User ID not available.';
    }
  }

  @SubscribeMessage('kickUser')
  async handleKickUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() kickUserDto: KickUserDto) {
    const userId = Number(client.handshake.auth.userId);
    if (userId) {
      try {
        const { channelId, userIdKick} = kickUserDto;
        if (channelId && userIdKick) {
          const changeRole = await this.chatService.kickUser(userId, channelId, userIdKick);
          console.log(changeRole);
          return null;
        }
      }
      catch (error) {
        console.log(error.message);
        return error.message;
      }
    } else {
      console.log('User ID not available.646');
      return 'User ID not available.';
    }
  }

  @SubscribeMessage('changeChannelVisibility')
  async handlechangeChannelVisibility(@ConnectedSocket() client: Socket,
  @MessageBody() changeChannelVisibilityDto : ChangeChannelVisibilityDto) {
    const userId = Number(client.handshake.auth.userId);
    if (userId) {
      try {
        const { channelId, isPublic} = changeChannelVisibilityDto;
        if (channelId) {
          const changeChannel = await this.chatService.updateChannelVisibility(userId, channelId, isPublic);
          if (changeChannel) {
            const user = await this.getOrAddUserData(userId);
            const message = user.username + " Has changed the channel visibility";
            const messageData = await this.chatService.addMessage(
              userId,
              channelId,
              message,
            );
            const messageDataDto: Messages = messageData;
            messageDataDto.user = user;
            this.server
              .to(channelId)
              .emit(`${channelId}/message`, messageDataDto);
            const clients = this.roomService.getRoomClients(channelId);
            const channel = await this.getChannelData(client, channelId, true);
            // this.server.except(channelId).emit('channelDeleted', channel.id);
            this.server.to(channelId).emit(`channelData:${channelId}`, channel);
            this.server.emit('resetChannel', channel.id);
            // if (isPublic && channel.public) {
              // this.server.except(channelId).emit("newChannel", channel.id);
            // }
            channel.members = [];
            channel.messages = [];
            // this.server.except(channelId).emit(`channelData:${channelId}`, channel);
            return null;
          }
          console.log(changeChannel);
          return null;
        }
      }
      catch (error) {
        console.log(error.message);
        return error.message;
      }
    } else {
      console.log('User ID not available.646');
      return 'User ID not available.';
    }
  }

  @SubscribeMessage('leaveChannel')
  async handleLeaveChannel(@ConnectedSocket() client: Socket, @MessageBody() channelId: string): Promise<string> {
    const userId: number = client.handshake.auth.userId;
    const user = await this.getOrAddUserData(userId);
    if (userId) {
      try {
        const channel = await this.getChannelData(client, channelId, false);
        const userRole = await this.chatService.findMemberRoleInChannel(channelId, userId);
        if (userRole === "OWNER")
          throw new Error("The owner cannot leave the channel");
        const message: string = user.username + " have leave the channel";
        const messageSend = await this.chatService.addMessage(
          userId,
          channelId,
          message,
        );
        if (!messageSend) throw new Error('Error when sending the leave channel message');
        const messageData: Messages = messageSend;
        messageData.user = user;
        this.server.to(channelId).emit(`${channelId}/message`, messageData);
        if (channel.isConnected) {
          const connectedUsersSet = this.connectedUsers.get(channelId);
          if (!connectedUsersSet)
            throw new Error ("Cannot find the channel connection to leave")
          const sockets = this.userConnections.get(userId);
          sockets.forEach((socket) => {
            this.roomService.leaveRoom(socket, channelId);
            connectedUsersSet.delete(socket.id);
          });
          this.roomService.leaveRoom(client, channelId);
          const result: string = await this.chatService.deleteMember(userId, channelId);
          if (result) {
            // if (!channel.public) {
            //   this.server.to(String(userId)).emit("channelDeleted");
            // }
            // else {
              this.server.to(String(userId)).emit("resetChannel", channelId);
              // const channelData = await this.getChannelData(client, channelId, false);
              // this.server.to(String(userId)).emit(`channelData:${channelId}`, channelData);
              // this.server.to(channelId).emit(`channelData:${channelId}`, channelData);
            // }
            return "";
          }
        }
      }
      catch(error) {
        console.log(error.message);
        return (error.message);
      }
    }
  }
}
