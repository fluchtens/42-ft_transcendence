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
  BanUserDto,
} from './dtos/gateway.dtos';
import * as bcrypt from 'bcryptjs';
import { FriendshipStatus, Member, User } from '@prisma/client';
import { FriendshipService } from 'src/friendship/friendship.service';
import { threadId } from 'worker_threads';

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
      (socket = new Set<Socket>()), this.userConnections.set(userId, socket);
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

  async refreshUserData(userId: number) {
    try {
      const updatedUserData = await this.userService.getUserById(userId);
      this.usersData.set(userId, updatedUserData);

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
      const connection: boolean = this.verifyUserConnection(
        client.id,
        channelId,
      );
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
      console.log('checkConnection', channelInfo.name, connection);
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
      if (channelInfo.password) {
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

  @SubscribeMessage('getChannelInitialData')
  async handleChannelInitialData(
    @ConnectedSocket() client: Socket,
    @MessageBody() channelId: string,
  ) {
    const userId: number = client.handshake.auth.userId;
    if (userId) {
      const channel = await this.getChannelData(client, channelId, false);
      return channel;
    } else {
      console.log('userId Invalid getChannelStatus');
      return;
    }
  }

  @SubscribeMessage('getChannelStatus')
  async getChannelStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() channelId: string,
  ) {
    const userId: number = client.handshake.auth.userId;
    if (userId) {
      const channelIsPublic = await this.chatService.isChannelPublic(channelId);
      const isMember = await this.chatService.findMemberInChannel(
        channelId,
        userId,
      );
      if (channelIsPublic && !isMember) {
        const channel = await this.chatService.getChannelById(channelId);
        const channeldata: Partial<ChannelData> = channel;
        if (channel.password === 'true') {
          channeldata.protected = true;
        }
        return channel;
      }
      const channel = await this.getChannelData(client, channelId, false);
      return channel;
    } else {
      console.log('userId Invalid getChannelStatus');
      return;
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
        // if (ChannelData.messages)
        //   console.log("emit test", ChannelData.name);
        this.server.to(client.id).emit(`channelData:${channelId}`, ChannelData);
        if (ChannelData) return true;
        if (!ChannelData.isMember && !ChannelData.public) return true;
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
  async handleRefreshUser(@ConnectedSocket() client: Socket) {
    const userId: number = client.handshake.auth.userId;
    if (userId) {
      await this.refreshUserData(userId);
      this.server.emit('refreshPage');
    }
  }

  @SubscribeMessage('deleteChannel')
  async handleDeleteChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() channelId: string,
  ) {
    console.log(channelId);
    const userId = Number(client.handshake.auth.userId);
    if (userId) {
      try {
        const channel: ChannelData = await this.getChannelData(
          client,
          channelId,
          true,
        );
        if (channel) {
          const deleted = await this.chatService.deleteChannel(
            userId,
            channelId,
          );
          for (const member of channel.members) {
            const memberId: number = member.member.userId;
            this.server.to(channelId).emit(`${channelId}/channelDeleted`);
            const clients = this.roomService.getRoomClients(channelId);
            clients.forEach((client) => {
              this.roomService.leaveRoom(client, channelId);
            });
            this.server.to(String(memberId)).emit('channelDeleted', channelId);
            this.server.emit("channelDeleted", channelId);
          }
          this.connectedUsers.delete(channelId);
          return '';
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
        const member = await this.userService.findUserByUsername(
          memberUsername,
          false,
        );
        const friendship = await this.friendshipService.findFriendship(
          userId,
          member.id,
        );
        const isBanned = await this.chatService.isUserBanned(channelId, userId);
        if (isBanned) {
          throw new Error("this user is banned");
        }

        if (!friendship || friendship.status !== FriendshipStatus.ACCEPTED) {
          throw new Error('You are not friends with this user');
        }
        if (channelId && member) {
          const result = await this.chatService.addMember(
            userId,
            channelId,
            member.id,
          );
          if (!result) throw new Error('member is in the channel');
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
            this.server.to(channelId).emit(`${channelId}/member`, {
              member: result,
              user: userMember,
            });
            this.server.to(String(member.id)).emit('newChannel', channelId);
            return null;
          }
        } else {
          console.error('channelId or member not found, addMemberFail');
          return 'channelId or member not found, addMemberFail';
        }
      } catch (error) {
        console.log(error.message);
        return error.message;
      }
    } else {
      console.log('User ID not available.504');
      return 'User ID not available.';
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
          const member = await this.chatService.findMemberInChannel(
            channelDto.channelId,
            userId,
          );
          if (member) {
            throw new Error('member is in channel');
          }
          const isBanned = await this.chatService.isUserBanned(channelDto.channelId, userId);
          if (isBanned) {
            throw new Error("this user is banned");
          }
          const joinChannel = await this.chatService.joinPublicChannel(
            userId,
            channelDto.channelId,
            channelDto.password,
          );
          if (joinChannel) {
            let connectedUsersSet = this.connectedUsers.get(channel.id);
            if (!connectedUsersSet) {
              connectedUsersSet = new Set<string>();
              this.connectedUsers.set(channel.id, connectedUsersSet);
            }

            connectedUsersSet.add(client.id);
            const user = await this.getOrAddUserData(userId);
            const message = user.username + ' has joined the channel';
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
            this.server.to(String(userId)).emit('resetChannel', channel.id);
            return true;
          } else {
            throw new Error('error when join the channel');
          }
        } else {
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
        const protect = await this.chatService.updateChannelWithPassword(
          userId,
          channelId,
          password,
        );
        this.server.emit('resetChannel', channelId);
        return '';
      } catch (error) {
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
    @MessageBody() changeRoleDto: ChangeRoleDto,
  ) {
    const userId = Number(client.handshake.auth.userId);
    if (userId) {
      try {
        const { channelId, memberId, newRole } = changeRoleDto;
        if (channelId && memberId && newRole) {
          const changeRole = await this.chatService.changeMemberRole(
            userId,
            channelId,
            memberId,
            newRole,
          );
          const userMember = await this.getOrAddUserData(Number(memberId));
          if (changeRole) {
            const userData = await this.getOrAddUserData(userId);
            const message =
              userData.username +
              ' changed the role of ' +
              userMember.username +
              ' to ' +
              newRole;
            const messageSend = await this.chatService.addMessage(
              userId,
              channelId,
              message,
            );
            if (!messageSend) throw new Error('Message cannot be send');
            const messageData: Messages = messageSend;
            messageData.user = userData;
            this.server.to(channelId).emit(`${channelId}/message`, messageData);
          }
          this.server.to(channelId).emit('refreshPage', channelId);
          console.log(changeRole);
          return null;
        }
      } catch (error) {
        console.log(error.message);
        return error.message;
      }
    } else {
      console.log('User ID not available.622');
      return 'User ID not available.';
    }
  }

  @SubscribeMessage('deteleChannelProtection')
  async handleDeteleChannelProtection(
    @ConnectedSocket() client: Socket,
    @MessageBody() changeChannelPasswordDto: ChangeChannelPasswordDto,
  ) {
    const userId = Number(client.handshake.auth.userId);
    if (userId) {
      try {
        const { channelId } = changeChannelPasswordDto;
        const protect = await this.chatService.removePasswordFromChannel(
          userId,
          channelId,
        );
        this.server.emit('resetChannel', channelId);
        console.log('Deleteprotection', protect);
        return '';
      } catch (error) {
        console.log(error.message);
        return error.message;
      }
    } else {
      console.log('User ID not available.594');
      return 'User ID not available';
    }
  }

  @SubscribeMessage('kickUser')
  async handleKickUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() kickUserDto: KickUserDto,
  ) {
    const userId = Number(client.handshake.auth.userId);
    if (userId) {
      try {
        const { channelId, userIdKick } = kickUserDto;
        if (channelId && userIdKick) {
          const kickUser = await this.chatService.kickUser(
            userId,
            channelId,
            userIdKick,
          );
          const userMember = await this.getOrAddUserData(Number(userIdKick));
          if (kickUser) {
            const userData = await this.getOrAddUserData(userId);
            const message =
              userData.username +
              ' kicked ' +
              userMember.username;
            const messageSend = await this.chatService.addMessage(
              userId,
              channelId,
              message,
            );
            if (!messageSend) throw new Error('Message cannot be send');
            const messageData: Messages = messageSend;
            messageData.user = userData;
            this.server.to(channelId).emit(`${channelId}/message`, messageData);

            const connectedUsersSet = this.connectedUsers.get(channelId);
            if (!connectedUsersSet) {
              throw new Error('Cannot find the channel connection to kick player');
            }
            const socketsConnected = this.userConnections.get(userIdKick);
            socketsConnected.forEach((socket) => {
              this.roomService.leaveRoom(socket, channelId);
              connectedUsersSet.delete(socket.id);
            });
          }
          this.server.to(channelId).emit('refreshPage', channelId);
          this.server
              .to(channelId)
              .emit(`${channelId}/memberDeleted`, userIdKick);
          this.server.to(String(userIdKick)).emit(`${channelId}/channelDeleted`);
          this.server.to(String(userIdKick)).emit('resetChannel', channelId);
          console.log(kickUser);
          return null;
        }
      } catch (error) {
        console.log(error.message);
        return error.message;
      }
    } else {
      console.log('User ID not available.646');
      return 'User ID not available.';
    }
  }

  @SubscribeMessage('connectToProtectedChannel')
  async handleConnectToChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() getChannelDto: GetChannelDto,
  ): Promise<boolean> {
    {
      const userId = client.handshake.auth.userId;
      const { channelId, password } = getChannelDto;
      if (userId) {
        try {
          const connection: boolean = this.verifyUserConnection(
            client.id,
            channelId,
          );
          if (!connection) {
            const passwordVerify = await this.chatService.passwordChannelVerify(
              channelId,
              password,
            );
            console.log('password', passwordVerify, channelId, password);
            if (passwordVerify) {
              let connectedUsersSet = this.connectedUsers.get(channelId);
              if (!connectedUsersSet) {
                connectedUsersSet = new Set<string>();
                this.connectedUsers.set(channelId, connectedUsersSet);
              }
              connectedUsersSet.add(client.id);
              this.server.emit('resetChannel', channelId);
              this.server.to(String(userId)).emit('refreshPage');
              return true;
            } else {
              throw new Error('Wrong password');
            }
          }
        } catch (error) {
          console.error('Error joining room:', error.message);
          return false;
        }
      } else {
        console.error('User ID not available.281');
        return false;
      }
    }
  }

  @SubscribeMessage('changeChannelVisibility')
  async handlechangeChannelVisibility(
    @ConnectedSocket() client: Socket,
    @MessageBody() changeChannelVisibilityDto: ChangeChannelVisibilityDto,
  ) {
    const userId = Number(client.handshake.auth.userId);
    if (userId) {
      try {
        const { channelId, isPublic } = changeChannelVisibilityDto;
        if (channelId) {
          const changeChannel = await this.chatService.updateChannelVisibility(
            userId,
            channelId,
            isPublic,
          );
          if (changeChannel) {
            const user = await this.getOrAddUserData(userId);
            const message =
              user.username + ' Has changed the channel visibility';
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
            // const clients = this.roomService.getRoomClients(channelId);
            const channel = await this.getChannelData(client, channelId, true);
            this.server.to(channelId).emit(`channelData:${channelId}`, channel);
            this.server.emit('resetChannel', channelId);
            return null;
          }
          return null;
        }
      } catch (error) {
        console.log(error.message);
        return error.message;
      }
    } else {
      console.log('User ID not available.646');
      return 'User ID not available.';
    }
  }

  @SubscribeMessage('leaveChannel')
  async handleLeaveChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() channelId: string,
  ): Promise<string> {
    const userId: number = client.handshake.auth.userId;
    const user = await this.getOrAddUserData(userId);
    if (userId) {
      try {
        const channel = await this.getChannelData(client, channelId, false);
        const userRole = await this.chatService.findMemberRoleInChannel(
          channelId,
          userId,
        );
        if (userRole === 'OWNER')
          throw new Error('The owner cannot leave the channel');
        const message: string = user.username + ' has left the channel';
        const messageSend = await this.chatService.addMessage(
          userId,
          channelId,
          message,
        );
        if (!messageSend)
          throw new Error('Error when sending the leave channel message');
        const messageData: Messages = messageSend;
        messageData.user = user;
        this.server.to(channelId).emit(`${channelId}/message`, messageData);
        if (channel.isConnected) {
          const connectedUsersSet = this.connectedUsers.get(channelId);
          if (!connectedUsersSet)
            throw new Error('Cannot find the channel connection to leave');
          const sockets = this.userConnections.get(userId);
          sockets.forEach((socket) => {
            this.roomService.leaveRoom(socket, channelId);
            connectedUsersSet.delete(socket.id);
          });
          this.roomService.leaveRoom(client, channelId);
          const result: string = await this.chatService.deleteMember(
            userId,
            channelId,
          );
          if (result) {
            this.server.to(String(userId)).emit('resetChannel', channelId);
            this.server
              .to(channelId)
              .emit(`${channelId}/memberDeleted`, userId);
            return '';
          }
        }
      } catch (error) {
        console.log(error.message);
        return error.message;
      }
    }
  }

  @SubscribeMessage('banUser')
  async handleBanUser(@ConnectedSocket() client: Socket, @MessageBody() banUserDto: BanUserDto) {
    const userId = Number(client.handshake.auth.userId);
    if (userId) {
      try {
        const { channelId, userIdToBan } = banUserDto;
        if (channelId && userIdToBan) {
          const banUser = await this.chatService.banUser(
            userId,
            channelId,
            Number(userIdToBan),
          );
          const userMember = await this.getOrAddUserData(Number(userIdToBan));
          if (banUser) {
            const userData = await this.getOrAddUserData(userId);
            const message =
              userData.username +
              ' banded ' +
              userMember.username;
            const messageSend = await this.chatService.addMessage(
              userId,
              channelId,
              message,
            );
            if (!messageSend) throw new Error('Message cannot be send');
            const messageData: Messages = messageSend;
            messageData.user = userData;
            this.server.to(channelId).emit(`${channelId}/message`, messageData);

            const connectedUsersSet = this.connectedUsers.get(channelId);
            if (!connectedUsersSet) {
              throw new Error('Cannot find the channel connection to ban player');
            }
            const socketsConnected = this.userConnections.get(Number(userIdToBan));
            socketsConnected.forEach((socket) => {
              this.roomService.leaveRoom(socket, channelId);
              connectedUsersSet.delete(socket.id);
            });
          }
          this.server.to(channelId).emit('refreshPage', channelId);
          this.server
              .to(channelId)
              .emit(`${channelId}/memberDeleted`, userIdToBan);
          this.server.to(String(userIdToBan)).emit(`${channelId}/channelDeleted`);
          this.server.to(String(userIdToBan)).emit('resetChannel', channelId);
          console.log(banUser);
          return null;
        }
      } catch (error) {
        console.log(error.message);
        return error.message;
      }
    } else {
      console.log('User ID not available.646');
      return 'User ID not available.';
    }
  }

  @SubscribeMessage('unbanUser')
  async handleUnbanUser(@ConnectedSocket() client: Socket, @MessageBody() banUserDto: BanUserDto) {

  }
}
