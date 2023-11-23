import { Friendship } from "./friendship.interface";

export interface User {
  id: number;
  username: string;
  avatar: string;
  avatarUrl: string;
  twoFa: boolean;
  status: string;
  createdAt: string;
  updatedAt: string;
  friendship: Friendship;
}
