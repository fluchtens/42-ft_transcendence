import { IsString, Length, IsNotEmpty, Matches } from 'class-validator';

export class UsernameDto {
  @IsNotEmpty({ message: 'Username cannot be empty' })
  @IsString({ message: 'Username must be a string' })
  @Length(3, 16, {
    message: 'Username must be between 3 and 16 characters long',
  })
  @Matches(/^[a-zA-Z0-9\-_]+$/, {
    message: 'Username can only contain: letter, number, -, _',
  })
  username: string;
}
