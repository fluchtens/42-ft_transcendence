import { IsNotEmpty, IsNumber } from 'class-validator';

export class FriendshipDto {
  @IsNotEmpty({ message: 'receiverId cannot be empty' })
  @IsNumber({}, { message: 'receiverId must be a number' })
  receiverId: number;
}
