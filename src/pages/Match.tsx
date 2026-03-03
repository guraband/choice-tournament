import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { getCurrentMatch, getItemMap, isTournamentComplete } from "../domain/tournament";
import { useTournament } from "../state/TournamentContext";

const ROUND_LABEL: Record<number, string> = {
  32: "32강",
  16: "16강",
  8: "8강",
  4: "준결승",
  2: "결승",
};

function getRoundLabel(round: number) {
  return ROUND_LABEL[round] ?? `${round}강`;
}

export function MatchPage() {
  const navigate = useNavigate();
  const { tournament, selectWinner, undo } = useTournament();
  const [roundBanner, setRoundBanner] = useState<string | null>(null);
  const previousRoundRef = useRef<number | null>(null);

  useEffect(() => {
    if (!tournament) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const match = getCurrentMatch(tournament);
      if (!match) {
        return;
      }

      if (event.key === "1" || event.key === "ArrowLeft") {
        event.preventDefault();
        selectWinner(match.leftItemId);
      } else if (event.key === "2" || event.key === "ArrowRight") {
        event.preventDefault();
        selectWinner(match.rightItemId);
      } else if (event.key === "Backspace") {
        event.preventDefault();
        undo();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [selectWinner, tournament, undo]);

  useEffect(() => {
    if (!tournament) {
      previousRoundRef.current = null;
      return;
    }

    const currentRound = tournament.cursor.round;
    if (previousRoundRef.current === currentRound) {
      return;
    }

    previousRoundRef.current = currentRound;
    setRoundBanner(getRoundLabel(currentRound));

    const timeoutId = window.setTimeout(() => setRoundBanner(null), 1200);
    return () => window.clearTimeout(timeoutId);
  }, [tournament]);

  if (!tournament) {
    return <Navigate to="/create" replace />;
  }

  if (isTournamentComplete(tournament)) {
    return <Navigate to="/result" replace />;
  }

  const match = getCurrentMatch(tournament);
  if (!match) {
    return <Navigate to="/result" replace />;
  }

  const itemMap = getItemMap(tournament.items);
  const left = itemMap.get(match.leftItemId);
  const right = itemMap.get(match.rightItemId);

  if (!left || !right) {
    return <Navigate to="/create" replace />;
  }

  const totalMatchCount = tournament.items.length - 1;
  const decidedCount = tournament.history.length;
  const progress = totalMatchCount === 0 ? 0 : Math.round((decidedCount / totalMatchCount) * 100);

  return (
    <main className="page stack">
      <section className="page-card stack" style={{ padding: "1.5rem" }}>
        <header className="stack" style={{ gap: "0.4rem" }}>
          <h1 style={{ margin: 0 }}>{tournament.topic}</h1>
          <p className="subtitle">
            현재 라운드: <strong>{getRoundLabel(match.round)}</strong> · 진행률: <strong>{progress}%</strong> ({decidedCount}/
            {totalMatchCount})
          </p>
          <div className="actions">
            <button type="button" onClick={undo} disabled={tournament.history.length === 0} className="secondary">
              되돌리기 (Backspace)
            </button>
            <button type="button" onClick={() => navigate("/bracket")} className="secondary">
              대진표 보기
            </button>
            <Link to="/result">결과 화면</Link>
          </div>
        </header>

        <section className="grid-auto">
          {[left, right].map((item, index) => (
            <button key={item.id} type="button" onClick={() => selectWinner(item.id)} className="match-choice">
              <p className="helper-text">
                선택 {index + 1}
              </p>
              {item.imageBase64 ? (
                <img
                  src={item.imageBase64}
                  alt={item.name}
                  style={{ width: "100%", maxHeight: 180, objectFit: "cover", borderRadius: 8 }}
                />
              ) : null}
              <h2 style={{ marginBottom: 0 }}>{item.name}</h2>
            </button>
          ))}
        </section>

        <p className="helper-text">단축키: 1/2, ←/→, Backspace(되돌리기)</p>
      </section>

      {roundBanner ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "grid",
            placeItems: "center",
            background: "rgba(0, 0, 0, 0.72)",
            color: "#fff",
            fontSize: "clamp(3rem, 15vw, 9rem)",
            fontWeight: 800,
            letterSpacing: "0.04em",
            zIndex: 9999,
            pointerEvents: "none",
            animation: "round-banner-fade 1.2s ease forwards",
          }}
        >
          {roundBanner}
        </div>
      ) : null}
      <style>
        {`@keyframes round-banner-fade {
          0% { opacity: 0; transform: scale(0.92); }
          15% { opacity: 1; transform: scale(1); }
          70% { opacity: 1; transform: scale(1.02); }
          100% { opacity: 0; transform: scale(1.08); }
        }`}
      </style>
    </main>
  );
}
