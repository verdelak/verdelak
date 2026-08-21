export interface BoardGame {
  gameID: number;
  title: string;
  isExpansion: boolean;
  baseGameID: number | null;
  bgg_Rating: number | null;
  personalRating: number | null;
  owns: boolean;
  wishlist: boolean;
  notes?: string;
}

export interface GamePlay {
  playID: number;
  gameID: number;
  playDate: string;
  playCount: number;
  notes?: string;
}

export interface GamePlay {
  playID: number;
  gameID: number;
  playDate: string;
  playCount: number;
  notes?: string;
}