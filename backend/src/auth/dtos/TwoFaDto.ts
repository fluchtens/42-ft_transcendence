import { IsString, IsNotEmpty, IsNumberString, Length } from 'class-validator';

export class TwoFaDto {
  @IsNotEmpty({ message: '2FA code cannot be empty' })
  @IsString({ message: '2FA code must be a string' })
  @IsNumberString(
    { no_symbols: true },
    { message: '2FA code must contain only numbers' },
  )
  @Length(6, 6, { message: '2FA code must be exactly 6 digits long' })
  code: string;
}
