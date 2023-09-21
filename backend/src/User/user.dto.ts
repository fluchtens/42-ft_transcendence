import { Prisma } from "@prisma/client";
import { IsString, Length, Matches } from "class-validator";

export class CreateUserDto implements Prisma.UserCreateInput{
  @Length(3, 16)
  @Matches(RegExp('^[a-zA-Z0-9\\-\\_]+$'))
  userName: string;
  @IsString()
  @Length(8, 30)
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {message: 'password too weak'})
  password: string;
  imageUrl?: string;
}