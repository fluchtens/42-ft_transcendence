import { Prisma } from "@prisma/client";
import { Exclude } from "class-transformer";

export class User implements Prisma.UserCreateInput {
  userName: string;
  password: string;
  imageUrl?: string;
}

export class serializedUser implements Prisma.UserCreateInput{
  userName: string;
  @Exclude()
  password: string;

  constructor(partial: Partial<serializedUser>){
    Object.assign(this, partial);
  }
}