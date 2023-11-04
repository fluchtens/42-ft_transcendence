import { IsNotEmpty, IsNumber } from 'class-validator';

export class FriendshipDto {
  @IsNotEmpty({ message: 'receiverId cannot be empty' })
  @IsNumber({}, { message: 'receiverId must be a number' })
  receiverId: number;
}

export class UserDto {
  @IsNotEmpty({ message: 'senderId cannot be empty' })
  @IsNumber({}, { message: 'senderId must be a number' })
  senderId: number;
}
