import { Prisma } from "@prisma/client";
import { Length, Matches } from "class-validator";

export class CreateUserDto implements Prisma.UserCreateInput{
  @Length(3, 16)
  @Matches('a-zA-Z0-9-_')
  userName: string;
  imageUrl: string;
}