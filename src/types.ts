export type Round = 32 | 16 | 8 | 4 | 2;

export type Item = {
  id: string;
  name: string;
  imageBase64?: string;
};

export type Match = {
  id: string;
  round: Round;
  leftItemId: string;
  rightItemId: string;
  winnerItemId?: string;
  decidedAt?: number;
};

export type Tournament = {
  id: string;
  topic: string;
  seed: number;
  createdAt: number;
  updatedAt: number;
  items: Item[];
  rounds: Partial<Record<Round, Match[]>>;
  cursor: {
    round: Round;
    matchIndex: number;
  };
  history: Array<{
    round: Round;
    matchId: string;
    winnerItemId: string;
  }>;
};
