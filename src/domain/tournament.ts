import { Item, Match, Round, Tournament } from "../types";

type CreateTournamentParams = {
  topic: string;
  items: Item[];
  round: 8 | 16 | 32;
  seed: number;
  shuffleEnabled: boolean;
};

const ROUND_ORDER: Round[] = [32, 16, 8, 4, 2];

function mulberry32(seed: number) {
  let value = seed >>> 0;
  return () => {
    value += 0x6d2b79f5;
    let t = value;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffleBySeed<T>(items: T[], seed: number): T[] {
  const next = [...items];
  const random = mulberry32(seed);

  for (let index = next.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1));
    [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
  }

  return next;
}

function createRoundMatches(round: Round, itemIds: string[]): Match[] {
  const matches: Match[] = [];

  for (let index = 0; index < itemIds.length; index += 2) {
    const matchIndex = index / 2;
    matches.push({
      id: `${round}-${matchIndex}`,
      round,
      leftItemId: itemIds[index],
      rightItemId: itemIds[index + 1],
    });
  }

  return matches;
}

export function getRoundSequence(startRound: 8 | 16 | 32): Round[] {
  return ROUND_ORDER.filter((round) => round <= startRound);
}

function resolveCursor(tournament: Tournament): Tournament["cursor"] {
  const rounds = getRoundSequence(tournament.items.length as 8 | 16 | 32);

  for (const round of rounds) {
    const matches = tournament.rounds[round] ?? [];
    const matchIndex = matches.findIndex((match) => !match.winnerItemId);
    if (matchIndex >= 0) {
      return { round, matchIndex };
    }
  }

  return { round: 2, matchIndex: 0 };
}

function rebuildLaterRounds(tournament: Tournament, fromRound: Round): Tournament {
  const rounds = getRoundSequence(tournament.items.length as 8 | 16 | 32);
  const fromIndex = rounds.indexOf(fromRound);

  let nextRounds: Tournament["rounds"] = { ...tournament.rounds };

  for (let index = fromIndex; index < rounds.length - 1; index += 1) {
    const currentRound = rounds[index];
    const nextRound = rounds[index + 1];
    const currentMatches = nextRounds[currentRound] ?? [];

    if (currentMatches.some((match) => !match.winnerItemId)) {
      delete nextRounds[nextRound];
      continue;
    }

    const winnerIds = currentMatches.map((match) => match.winnerItemId!) as string[];
    nextRounds = {
      ...nextRounds,
      [nextRound]: createRoundMatches(nextRound, winnerIds),
    };
  }

  const nextTournament: Tournament = {
    ...tournament,
    rounds: nextRounds,
  };

  return {
    ...nextTournament,
    cursor: resolveCursor(nextTournament),
    updatedAt: Date.now(),
  };
}

export function createTournament(params: CreateTournamentParams): Tournament {
  const orderedItems = params.shuffleEnabled ? shuffleBySeed(params.items, params.seed) : [...params.items];
  const initialMatches = createRoundMatches(params.round, orderedItems.map((item) => item.id));
  const now = Date.now();

  const tournament: Tournament = {
    id: `tournament-${now}`,
    topic: params.topic,
    seed: params.seed,
    createdAt: now,
    updatedAt: now,
    items: orderedItems,
    rounds: {
      [params.round]: initialMatches,
    },
    cursor: {
      round: params.round,
      matchIndex: 0,
    },
    history: [],
  };

  return tournament;
}

export function getCurrentMatch(tournament: Tournament): Match | null {
  const matches = tournament.rounds[tournament.cursor.round] ?? [];
  return matches[tournament.cursor.matchIndex] ?? null;
}

export function selectWinner(tournament: Tournament, winnerItemId: string): Tournament {
  const { round, matchIndex } = tournament.cursor;
  const matches = tournament.rounds[round] ?? [];
  const targetMatch = matches[matchIndex];

  if (!targetMatch || targetMatch.winnerItemId) {
    return tournament;
  }

  if (winnerItemId !== targetMatch.leftItemId && winnerItemId !== targetMatch.rightItemId) {
    return tournament;
  }

  const nextMatches = matches.map((match, index) => {
    if (index !== matchIndex) {
      return match;
    }

    return {
      ...match,
      winnerItemId,
      decidedAt: Date.now(),
    };
  });

  const nextTournament: Tournament = {
    ...tournament,
    rounds: {
      ...tournament.rounds,
      [round]: nextMatches,
    },
    history: [
      ...tournament.history,
      {
        round,
        matchId: targetMatch.id,
        winnerItemId,
      },
    ],
    updatedAt: Date.now(),
  };

  return rebuildLaterRounds(nextTournament, round);
}

export function undoSelection(tournament: Tournament): Tournament {
  const last = tournament.history[tournament.history.length - 1];
  if (!last) {
    return tournament;
  }

  const roundMatches = tournament.rounds[last.round] ?? [];
  const revertedRound = roundMatches.map((match) => {
    if (match.id !== last.matchId) {
      return match;
    }

    return {
      ...match,
      winnerItemId: undefined,
      decidedAt: undefined,
    };
  });

  const nextTournament: Tournament = {
    ...tournament,
    rounds: {
      ...tournament.rounds,
      [last.round]: revertedRound,
    },
    history: tournament.history.slice(0, -1),
    updatedAt: Date.now(),
  };

  return rebuildLaterRounds(nextTournament, last.round);
}

export function isTournamentComplete(tournament: Tournament): boolean {
  const finalMatch = tournament.rounds[2]?.[0];
  return Boolean(finalMatch?.winnerItemId);
}

export function getItemMap(items: Item[]): Map<string, Item> {
  return new Map(items.map((item) => [item.id, item]));
}
