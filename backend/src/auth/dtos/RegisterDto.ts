import { IsString, Length, IsNotEmpty, Matches } from 'class-validator';

export class RegisterDto {
  @IsNotEmpty({ message: 'Username cannot be empty' })
  @IsString({ message: 'Username must be a string' })
  @Length(3, 16, {
    message: 'Username must be between 3 and 16 characters long',
  })
  @Matches(/^[a-zA-Z0-9\-_]+$/, {
    message: 'Username can only contain: letter, number, -, _',
  })
  username: string;

  @IsNotEmpty({ message: 'Password cannot be empty' })
  @IsString({ message: 'Password must be a string' })
  @Length(8, 30, {
    message: 'Password must be between 8 and 30 characters long',
  })
  @Matches(
    /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]+$/,
    {
      message:
        'Password must contain at least one uppercase letter, one lowercase letter, one digit, and one special character',
    },
  )
  password: string;
}
