import { IsString, Length, IsNotEmpty, Matches } from 'class-validator';

export class UpdatePwdDto {
  @IsNotEmpty({ message: 'Password cannot be empty' })
  @IsString({ message: 'Password must be a string' })
  password: string;

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
  newPassword: string;
}
