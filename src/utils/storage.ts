import { Tournament } from "../types";

const STORAGE_KEY = "choice-tournament/current";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function isTournament(value: unknown): value is Tournament {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.id === "string" &&
    typeof value.topic === "string" &&
    Array.isArray(value.items) &&
    isRecord(value.cursor) &&
    Array.isArray(value.history) &&
    isRecord(value.rounds)
  );
}

export function loadTournamentFromStorage(): Tournament | null {
  const raw = window.localStorage.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    const parsed: unknown = JSON.parse(raw);
    return isTournament(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function saveTournamentToStorage(tournament: Tournament | null) {
  if (!tournament) {
    window.localStorage.removeItem(STORAGE_KEY);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tournament));
}

