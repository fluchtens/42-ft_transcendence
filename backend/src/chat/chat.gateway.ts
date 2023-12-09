import { OnModuleInit } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server } from 'socket.io';
import { Socket } from 'socket.io';
import { ChatService } from './chat.service';
import { AuthService } from 'src/auth/auth.service';
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
  UnbanUserDto,
  MuteUserDto,
  ChangeChannelNameDto,
  PrivateChannelData,
  CreateGameInfo,
} from './dtos/gateway.dtos';
import { FriendshipStatus, User } from '@prisma/client';
import { FriendshipService } from 'src/friendship/friendship.service';
import { GameService } from 'src/game/game.service';

@WebSocketGateway({
  namespace: 'chatSocket',
  cors: {
    origin: ['http://localhost'],
    credentials: true,
  },
})
export class ChatGateway {
  constructor(
    private readonly authService: AuthService,
    private readonly chatService: ChatService,
    private readonly userService: UserService,
    private readonly roomService: RoomsService,
    private readonly friendshipService: FriendshipService,
    private readonly gameService: GameService,
  ) {}

  private connectedUsers: Map<string, Set<string>> = new Map();
  private usersData: Map<number, Partial<User>> = new Map();
  private userConnections: Map<number, Set<Socket>> = new Map();
  private waitingUsers: Map<number, CreateGameInfo> = new Map();

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

  private removeSocketFromUser(userId: number, socketData: Socket): any {
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

  async InitRooms(client: Socket): Promise<any> {
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
    } catch (error) {}
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

  async refreshUserData(userId: number): Promise<any> {
    try {
      const updatedUserData = await this.userService.getUserById(userId);
      this.usersData.set(userId, updatedUserData);
    } catch (error) {}
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
      const channelMembers = await this.chatService.getChannelMembers(
        channelId,
      );
      channelData.members = channelMembers;
      const messagesRaw = await this.chatService.getMessagesByChannel(
        channelId,
      );

      const messages: Messages[] = await Promise.all(
        messagesRaw.map(async (rawMessage) => {
          const user = await this.getOrAddUserData(rawMessage.userId);
          return new Messages(
            rawMessage.id,
            rawMessage.content,
            rawMessage.userId,
            user,
            rawMessage.gameInvit,
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
      throw error;
    }
    return channelData;
  }

  async handleConnection(@ConnectedSocket() client: Socket): Promise<any> {
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

      const userId = client.handshake.auth.userId;
      this.addSocketToUser(userId, client);
      await this.InitRooms(client);
    } catch (error) {
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): any {
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
      } catch (error) {}
    } else {
    }
  }

  @SubscribeMessage('getChannelInitialData')
  async handleChannelInitialData(
    @ConnectedSocket() client: Socket,
    @MessageBody() channelIds: string[],
  ): Promise<any> {
    const userId: number = client.handshake.auth.userId;
    if (userId) {
      try {
        const channels = await Promise.all(
          channelIds.map(async (channelId) => {
            const channel = await this.getChannelData(client, channelId, false);
            return channel;
          }),
        );
        return channels;
      }
      catch {
        return;
      }
    }
  }

  @SubscribeMessage('getChannelStatus')
  async getChannelStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() channelId: string,
  ): Promise<any> {
    const userId: number = client.handshake.auth.userId;
    if (userId) {
      try {
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
      }
      catch (error) {
        return;
      }
    } else {
      return;
    }
  }

  @SubscribeMessage('joinRoom')
  async handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() getChannelDto: GetChannelDto,
  ): Promise<any> {
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
        this.server.to(client.id).emit(`channelData:${channelId}`, ChannelData);
        if (ChannelData) return true;
        if (!ChannelData.isMember && !ChannelData.public) return true;
      } catch (error) {
        return false;
      }
    } else {
      return false;
    }
  }

  @SubscribeMessage('sendMessage')
  async handleSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageDto: SendMessageDto,
  ): Promise<string> {
    const userId = client.handshake.auth.userId;
    const { channelId, message } = messageDto;
    const isChannelIdValid =
      !!channelId &&
      typeof channelId === 'string' &&
      channelId.length >= 1 &&
      channelId.length <= 2000;
    const isMessageValid =
      !!message &&
      typeof message === 'string' &&
      message.length >= 1 &&
      message.length <= 2000;
    const isDtoValid = isChannelIdValid && isMessageValid;
    if (isDtoValid) {
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
        return error.message;
      }
    } else {
      return 'invalid input';
    }
    return;
  }

  @SubscribeMessage('deleteMessage')
  async handleDeleteMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() deleteMessageDto: DeleteMessageDto,
  ): Promise<any> {
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
        }
      } catch (error) {}
    } else {
    }
  }

  @SubscribeMessage('updateMessage')
  async handleUpdateMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() changeMessageDto: ChangeMessageDto,
  ): Promise<any> {
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
        }
      } catch (error) {}
    } else {
    }
  }

  @SubscribeMessage('createChannel')
  async createChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() createChannelDto: CreateChannelDto,
  ): Promise<string> {
    const userId = Number(client.handshake.auth.userId);
    let { channelName } = createChannelDto;
    const { isPublic, password } = createChannelDto;
    const isChannelNameValid =
      !!channelName &&
      typeof channelName === 'string' &&
      channelName.length >= 3 &&
      channelName.length <= 16;
    if (userId) {
      try {
        if (!isChannelNameValid) {
          throw new Error('invalid input');
        }
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
        return error.message;
      }
    } else {
    }
  }

  @SubscribeMessage('refreshUser')
  async handleRefreshUser(@ConnectedSocket() client: Socket): Promise<any> {
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
  ): Promise<any> {
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
            this.server.emit('channelDeleted', channelId);
          }
          this.connectedUsers.delete(channelId);
          return '';
        } else {
          throw new Error('Error when get Channel data');
        }
      } catch (error) {
        return error.message;
      }
    } else {
      return 'User ID not available.450';
    }
  }

  @SubscribeMessage('addMember')
  async addMember(
    @ConnectedSocket() client: Socket,
    @MessageBody() addMemberDto: AddMemberDto,
  ): Promise<any> {
    const userId = Number(client.handshake.auth.userId);
    if (userId) {
      try {
        const { channelId, memberUsername } = addMemberDto;
        const isNotEmpty =
          memberUsername !== undefined &&
          memberUsername !== null &&
          memberUsername !== '';
        const isString = typeof memberUsername === 'string';
        const isMemberUsernameValid = isNotEmpty && isString;
        const errorMessage = !isNotEmpty
          ? 'Username cannot be empty'
          : !isString
          ? 'Username must be a string'
          : '';
        if (!isMemberUsernameValid) {
          throw new Error(errorMessage);
        }
        const member = await this.userService.findUserByUsername(
          memberUsername,
          false,
        );
        const friendship = await this.friendshipService.findFriendship(
          userId,
          member.id,
        );
        const isBanned = await this.chatService.isUserBanned(
          channelId,
          member.id,
        );
        if (isBanned) {
          throw new Error('this user is banned');
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
          return 'channelId or member not found, addMemberFail';
        }
      } catch (error) {
        if (error.message === "Cannot read properties of null (reading 'id')") {
          return 'Member not found';
        }
        return error.message;
      }
    } else {
      return 'User ID not available.';
    }
  }

  @SubscribeMessage('joinPublicChannel')
  async handleJoinPublicChannel(
    @ConnectedSocket() client: Socket,
    @MessageBody() channelDto: GetChannelDto,
  ): Promise<any> {
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
          const isBanned = await this.chatService.isUserBanned(
            channelDto.channelId,
            userId,
          );
          if (isBanned) {
            throw new Error('this user is banned');
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
            return '';
          } else {
            throw new Error('error when join the channel');
          }
        } else {
          throw new Error('Channel not found');
        }
      } catch (error) {
        return error.message;
      }
    } else {
      return 'User Id not avalaible';
    }
  }

  @SubscribeMessage('protectChannel')
  async handleChannelProtection(
    @ConnectedSocket() client: Socket,
    @MessageBody() changeChannelPasswordDto: ChangeChannelPasswordDto,
  ): Promise<any> {
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
        return error.message;
      }
    } else {
      return 'User ID not available';
    }
  }

  @SubscribeMessage('changeRole')
  async handleChangeRole(
    @ConnectedSocket() client: Socket,
    @MessageBody() changeRoleDto: ChangeRoleDto,
  ): Promise<any> {
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
              ' has changed the role of ' +
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
          return null;
        }
      } catch (error) {
        return error.message;
      }
    } else {
      return 'User ID not available.';
    }
  }

  @SubscribeMessage('deteleChannelProtection')
  async handleDeteleChannelProtection(
    @ConnectedSocket() client: Socket,
    @MessageBody() changeChannelPasswordDto: ChangeChannelPasswordDto,
  ): Promise<any> {
    const userId = Number(client.handshake.auth.userId);
    if (userId) {
      try {
        const { channelId } = changeChannelPasswordDto;
        const protect = await this.chatService.removePasswordFromChannel(
          userId,
          channelId,
        );
        this.server.emit('resetChannel', channelId);
        return '';
      } catch (error) {
        return error.message;
      }
    } else {
      return 'User ID not available';
    }
  }

  @SubscribeMessage('kickUser')
  async handleKickUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() kickUserDto: KickUserDto,
  ): Promise<any> {
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
              userData.username + ' kicked ' + userMember.username;
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
              throw new Error(
                'Cannot find the channel connection to kick player',
              );
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
          this.server
            .to(String(userIdKick))
            .emit(`${channelId}/channelDeleted`);
          this.server.to(String(userIdKick)).emit('resetChannel', channelId);
          return null;
        }
      } catch (error) {
        return error.message;
      }
    } else {
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
          return false;
        }
      } else {
        return false;
      }
    }
  }

  @SubscribeMessage('changeChannelVisibility')
  async handlechangeChannelVisibility(
    @ConnectedSocket() client: Socket,
    @MessageBody() changeChannelVisibilityDto: ChangeChannelVisibilityDto,
  ): Promise<any> {
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
              user.username + ' has changed the channel visibility';
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
        return error.message;
      }
    } else {
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
        return error.message;
      }
    }
  }

  @SubscribeMessage('banUser')
  async handleBanUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() banUserDto: BanUserDto,
  ): Promise<any> {
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
              userData.username + ' has banned ' + userMember.username;
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
              throw new Error(
                'Cannot find the channel connection to ban player',
              );
            }
            const socketsConnected = this.userConnections.get(
              Number(userIdToBan),
            );
            socketsConnected.forEach((socket) => {
              this.roomService.leaveRoom(socket, channelId);
              connectedUsersSet.delete(socket.id);
            });
          }
          this.server.to(channelId).emit('refreshPage', channelId);
          this.server
            .to(channelId)
            .emit(`${channelId}/memberDeleted`, userIdToBan);
          this.server
            .to(String(userIdToBan))
            .emit(`${channelId}/channelDeleted`);
          this.server.to(String(userIdToBan)).emit('resetChannel', channelId);
          return null;
        }
      } catch (error) {
        return error.message;
      }
    } else {
      return 'User ID not available.';
    }
  }

  @SubscribeMessage('unbanUser')
  async handleUnbanUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() banUserDto: UnbanUserDto,
  ): Promise<any> {
    const userId = Number(client.handshake.auth.userId);
    if (userId) {
      try {
        const { channelId, userToUnban } = banUserDto;
        const userToBanStatus = await this.userService.findUserByUsername(
          userToUnban,
          false,
        );
        const userIdToUnban = userToBanStatus.id;
        if (channelId && userIdToUnban) {
          const userRole = await this.chatService.findMemberRoleInChannel(
            channelId,
            userId,
          );
          if (userRole === 'ADMIN' || userRole === 'OWNER') {
            await this.chatService.unbanUser(channelId, userIdToUnban);
            const userMember = await this.getOrAddUserData(
              Number(userIdToUnban),
            );
            const userData = await this.getOrAddUserData(userId);
            const message =
              userData.username + ' has unbaned ' + userMember.username;
            const messageSend = await this.chatService.addMessage(
              userId,
              channelId,
              message,
            );
            if (!messageSend) throw new Error('Message cannot be send');
            const messageData: Messages = messageSend;
            messageData.user = userData;
            this.server.to(channelId).emit(`${channelId}/message`, messageData);
            this.server.to(channelId).emit('refreshPage', channelId);
            return '';
          } else {
            throw new Error('Permission denied');
          }
        }
      } catch (error) {
        return error.message;
      }
    } else {
      return 'User ID not available.';
    }
  }

  @SubscribeMessage('muteUser')
  async handleMuteUser(
    @ConnectedSocket() client: Socket,
    @MessageBody() muteUserDto: MuteUserDto,
  ): Promise<any> {
    const userId = Number(client.handshake.auth.userId);
    const { addMinutes } = require('date-fns');
    if (userId) {
      try {
        const { channelId, userIdToMute, timeToMute } = muteUserDto;
        if (channelId && userIdToMute && timeToMute > 0) {
          const userRole = await this.chatService.findMemberRoleInChannel(
            channelId,
            userId,
          );
          const userRoleToMute = await this.chatService.findMemberRoleInChannel(
            channelId,
            userIdToMute,
          );
          if (
            (userRoleToMute === 'ADMIN' && userRole === 'ADMIN') ||
            userRoleToMute === 'OWNER'
          ) {
            throw new Error('Permission denied');
          }
          if (userRole === 'ADMIN' || userRole === 'OWNER') {
            const muteTime = addMinutes(new Date(), timeToMute);
            await this.chatService.muteMember(
              channelId,
              userIdToMute,
              muteTime,
            );
            const userMember = await this.getOrAddUserData(
              Number(userIdToMute),
            );
            const userData = await this.getOrAddUserData(userId);
            const message =
              userData.username +
              ' has muted ' +
              userMember.username +
              ' for ' +
              timeToMute +
              ' minutes';
            const messageSend = await this.chatService.addMessage(
              userId,
              channelId,
              message,
            );
            if (!messageSend) throw new Error('Message cannot be send');
            const messageData: Messages = messageSend;
            messageData.user = userData;
            this.server.to(channelId).emit(`${channelId}/message`, messageData);
            this.server.to(channelId).emit('refreshPage', channelId);
            return null;
          } else {
            throw new Error('Permission denied');
          }
        }
      } catch (error) {
        return error.message;
      }
    } else {
      return 'User ID not available.';
    }
  }

  @SubscribeMessage('changeChannelname')
  async handleChangeChannelname(
    @ConnectedSocket() client: Socket,
    @MessageBody() changeChannelNameDto: ChangeChannelNameDto,
  ): Promise<any> {
    const userId = Number(client.handshake.auth.userId);
    if (userId) {
      try {
        const { channelName, channelId } = changeChannelNameDto;
        const isChannelNameValid =
          !!channelName &&
          typeof channelName === 'string' &&
          channelName.length >= 3 &&
          channelName.length <= 16;
        if (!isChannelNameValid) {
          throw new Error('Invalid input');
        }
        await this.chatService.changeChannelName(
          userId,
          channelId,
          channelName,
        );

        const userData = await this.getOrAddUserData(userId);
        const message =
          userData.username +
          ' has changed the name of the channel to ' +
          channelName;

        const messageSend = await this.chatService.addMessage(
          userId,
          channelId,
          message,
        );
        if (!messageSend) throw new Error('Message cannot be send');
        const messageData: Messages = messageSend;
        messageData.user = userData;
        this.server.to(channelId).emit(`${channelId}/message`, messageData);

        this.server.to(channelId).emit('refreshPage', channelId);

        this.server.emit('resetChannel', channelId);
      } catch (error) {
        return error.message;
      }
    } else {
      return 'User ID not available.';
    }
  }

  @SubscribeMessage('privateMessage')
  async handlePrivateMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() userIdToConnect: number,
  ): Promise<any> {
    const userId = Number(client.handshake.auth.userId);
    if (userId) {
      try {
        let channelId: string = await this.chatService.findPrivateChannel(
          userId,
          userIdToConnect,
        );
        if (!channelId) {
          channelId = await this.chatService.createPrivateChannel(
            userId,
            userIdToConnect,
          );
        }
        return channelId;
      } catch (error) {
        return error.message;
      }
    } else {
      return 'User ID not available.';
    }
  }

  @SubscribeMessage('sendPrivateMessage')
  async handlePrivateSendMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() messageDto: SendMessageDto,
  ): Promise<string> {
    const userId = client.handshake.auth.userId;
    const { channelId, message } = messageDto;
    const isChannelIdValid =
      !!channelId &&
      typeof channelId === 'string' &&
      channelId.length >= 1 &&
      channelId.length <= 2000;
    const isMessageValid =
      !!message &&
      typeof message === 'string' &&
      message.length >= 1 &&
      message.length <= 2000;
    const isDtoValid = isChannelIdValid && isMessageValid;
    if (isDtoValid) {
      try {
        const messageSend = await this.chatService.addPrivateMessage(
          userId,
          channelId,
          message,
        );
        if (!messageSend) throw new Error('Message cannot be send');
        const messageData: Messages = messageSend;
        messageData.user = await this.getOrAddUserData(userId);
        this.server.emit(`${channelId}/message`, messageData);
      } catch (error) {
        return error.message;
      }
    } else {
      return 'invalid input';
    }
    return;
  }

  @SubscribeMessage('getPrivateChannelData')
  async handleGetPrivateChannelData(
    @ConnectedSocket() client: Socket,
    @MessageBody() channelId: string,
  ): Promise<PrivateChannelData> {
    const userId = client.handshake.auth.userId;
    const canConnect = await this.chatService.canConnectToPrivateChannel(
      channelId,
      userId,
    );
    if (canConnect) {
      try {
        const channel = await this.chatService.getPrivateChannelData(channelId);
        const messagesRaw = await this.chatService.getPrivateMessages(
          channelId,
        );
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
        const channelData = new PrivateChannelData();
        channelData.id = channel.id;
        if (channel.receiverId === userId) {
          const user = await this.getOrAddUserData(channel.senderId);
          channelData.name = user.username + ' private channel';
        } else {
          const user = await this.getOrAddUserData(channel.receiverId);
          channelData.name = user.username + ' private channel';
        }
        channelData.messages = messages;
        return channelData;
      } catch (error) {
        return null;
      }
    } else {
      return null;
    }
    return;
  }

  @SubscribeMessage('createGame')
  async handleCreateGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() channelId: string,
  ): Promise<any> {
    const userId = client.handshake.auth.userId;
    if (userId) {
      try {
        let createGameInfo: CreateGameInfo = new CreateGameInfo();
        createGameInfo.channelId = channelId;
        createGameInfo.socket = client;
        createGameInfo.userId = userId;
        let channel = await this.chatService.getChannelById(channelId);
        if (channel) {
          createGameInfo.privateChannel = false;
        } else {
          channel = await this.chatService.getPrivateChannelData(channelId);
          if (channel) {
            createGameInfo.privateChannel = true;
          } else {
            throw new Error('channel not found');
          }
        }
        if (!this.waitingUsers.has(userId)) {
          if (!createGameInfo.privateChannel) {
            const messageSend = await this.chatService.addMessage(
              userId,
              channelId,
              'Can you beat me?',
              true,
            );
            if (!messageSend) throw new Error('Message cannot be send');
            createGameInfo.messageId = messageSend.id;
            const messageData: Messages = messageSend;
            messageData.user = await this.getOrAddUserData(userId);
            messageData.gameInvit = true;
            this.server.to(channelId).emit(`${channelId}/message`, messageData);
          } else {
            channel = await this.chatService.getPrivateChannelData(channelId);
            if (channel) {
              const messageSend = await this.chatService.addPrivateMessage(
                userId,
                channelId,
                'Can you beat me?',
                true,
              );
              if (!messageSend) throw new Error('Message cannot be send');
              createGameInfo.messageId = messageSend.id;
              const messageData: Messages = messageSend;
              messageData.user = await this.getOrAddUserData(userId);
              messageData.gameInvit = true;
              this.server.emit(`${channelId}/message`, messageData);
            }
          }
          this.waitingUsers.set(userId, createGameInfo);
        } else {
          try {
            this.removeGameRequest(this.waitingUsers.get(userId));
          } catch {
            return 'failed to delete game request';
          }
          if (!createGameInfo.privateChannel) {
            const messageSend = await this.chatService.addMessage(
              userId,
              channelId,
              'Can you beat me?',
              true,
            );
            if (!messageSend) throw new Error('Message cannot be send');
            createGameInfo.messageId = messageSend.id;
            const messageData: Messages = messageSend;
            messageData.user = await this.getOrAddUserData(userId);
            messageData.gameInvit = true;
            this.server.to(channelId).emit(`${channelId}/message`, messageData);
          } else {
            channel = await this.chatService.getPrivateChannelData(channelId);
            if (channel) {
              const messageSend = await this.chatService.addPrivateMessage(
                userId,
                channelId,
                'Can you beat me?',
                true,
              );
              if (!messageSend) throw new Error('Message cannot be send');
              createGameInfo.messageId = messageSend.id;
              const messageData: Messages = messageSend;
              messageData.user = await this.getOrAddUserData(userId);
              messageData.gameInvit = true;
              this.server.emit(`${channelId}/message`, messageData);
            }
          }
          this.waitingUsers.set(userId, createGameInfo);
          return 'New game request done';
        }
      } catch (error) {
        return 'failed to create a new game';
      }
    }
  }

  async removeGameRequest(request: CreateGameInfo): Promise<any> {
    if (request) {
      const { userId, channelId, privateChannel, messageId } = request;
      if (!privateChannel) {
        const message = await this.chatService.deleteGameMessage(messageId);
        if (message) {
          this.server
            .to(channelId)
            .emit(`${channelId}/messageDeleted`, messageId);
        }
      } else {
        const message = await this.chatService.deletePrivateMessage(messageId);
        if (message) {
          this.server.emit(`${channelId}/messageDeleted`, messageId);
        }
      }
    }
  }

  @SubscribeMessage('joinGame')
  async handleJoinGame(
    @ConnectedSocket() client: Socket,
    @MessageBody() acceptingUserId: number,
  ): Promise<any> {
    const userId = client.handshake.auth.userId;
    if (userId) {
      if (userId === acceptingUserId) {
        return 'You cannot join your game';
      }
      const initiatingSocket = this.waitingUsers.get(acceptingUserId);
      if (initiatingSocket) {
				try {
					this.gameService.externalCreateGame(acceptingUserId, userId);
				} catch (busyId) {
					if (busyId === acceptingUserId) {
						return 'your opponent is already busy';
					} else {
						return 'you are already busy';
					}
				}
        try {
          this.removeGameRequest(initiatingSocket);
        } catch {
          return 'failed to delete game request';
        }
        this.server.to(String(acceptingUserId)).emit('joinGame');
        this.server.to(String(userId)).emit('joinGame');
        this.waitingUsers.delete(acceptingUserId);
        return '';
      } else {
        return 'Failed to join the game';
      }
    } else {
      return 'UserId not found';
    }
  }
}
