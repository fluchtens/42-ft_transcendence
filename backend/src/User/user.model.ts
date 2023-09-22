import { Prisma } from "@prisma/client";

export class User implements Prisma.UserCreateInput {
  userName: string;
  password: string;
  imageUrl?: string;
}
