import { User } from "./user.interface";

export interface Stats {
  wonMatches: number;
  lostMatches: number;
}

export interface Game {
  id: number;
  finished: string;
  winner: User;
  winnerId: number;
  winnerRatingBefore: number;
  winnerRatingAfter: number;
  loser: User;
  loserId: number;
  loserRatingBefore: number;
  loserRatingAfter: number;
}
