import { IsNotEmpty, IsNumber } from 'class-validator';

export class UserIdDto {
  @IsNotEmpty({ message: 'userId cannot be empty' })
  @IsNumber({}, { message: 'userId must be a number' })
  userId: number;
}
