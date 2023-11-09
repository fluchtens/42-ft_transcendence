import { Friendship } from "./friendship.interface";

export interface User {
  id: number;
  username: string;
  avatar: string;
  avatarUrl: string;
  twoFa: boolean;
  createdAt: string;
  updatedAt: string;
  friendship: Friendship;
}
