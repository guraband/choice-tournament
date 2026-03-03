import { createContext, PropsWithChildren, useContext, useMemo, useState } from "react";

import { createTournament, selectWinner as selectWinnerInTournament, undoSelection } from "../domain/tournament";
import { Item, Tournament } from "../types";

type CreateTournamentInput = {
  topic: string;
  items: Item[];
  round: 16 | 32;
  seed: number;
  shuffleEnabled: boolean;
};

type TournamentContextValue = {
  tournament: Tournament | null;
  createFromDraft: (input: CreateTournamentInput) => void;
  selectWinner: (winnerItemId: string) => void;
  undo: () => void;
  reset: () => void;
};

const TournamentContext = createContext<TournamentContextValue | null>(null);

export function TournamentProvider({ children }: PropsWithChildren) {
  const [tournament, setTournament] = useState<Tournament | null>(null);

  const value = useMemo<TournamentContextValue>(
    () => ({
      tournament,
      createFromDraft: (input) => {
        setTournament(createTournament(input));
      },
      selectWinner: (winnerItemId) => {
        setTournament((prev) => (prev ? selectWinnerInTournament(prev, winnerItemId) : prev));
      },
      undo: () => {
        setTournament((prev) => (prev ? undoSelection(prev) : prev));
      },
      reset: () => {
        setTournament(null);
      },
    }),
    [tournament],
  );

  return <TournamentContext.Provider value={value}>{children}</TournamentContext.Provider>;
}

export function useTournament() {
  const context = useContext(TournamentContext);

  if (!context) {
    throw new Error("useTournament은 TournamentProvider 내부에서 사용해야 합니다.");
  }

  return context;
}
