import { useEffect } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { getCurrentMatch, getItemMap, getRoundSequence, isTournamentComplete } from "../domain/tournament";
import { useTournament } from "../state/TournamentContext";

export function MatchPage() {
  const navigate = useNavigate();
  const { tournament, selectWinner, undo } = useTournament();

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

  const rounds = getRoundSequence(tournament.items.length as 16 | 32);
  const totalMatchCount = rounds.reduce((sum, round) => sum + (tournament.rounds[round]?.length ?? 0), 0);
  const decidedCount = tournament.history.length;
  const progress = totalMatchCount === 0 ? 0 : Math.round((decidedCount / totalMatchCount) * 100);

  return (
    <main style={{ margin: "0 auto", maxWidth: 960, padding: "2rem 1rem", display: "grid", gap: "1rem" }}>
      <header style={{ display: "grid", gap: "0.4rem" }}>
        <h1 style={{ margin: 0 }}>{tournament.topic}</h1>
        <p style={{ margin: 0 }}>
          현재 라운드: <strong>{match.round}강</strong> · 진행률: <strong>{progress}%</strong> ({decidedCount}/{totalMatchCount})
        </p>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          <button type="button" onClick={undo} disabled={tournament.history.length === 0}>
            되돌리기 (Backspace)
          </button>
          <button type="button" onClick={() => navigate("/bracket")}>대진표 보기</button>
          <Link to="/result">결과 화면</Link>
        </div>
      </header>

      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
          gap: "1rem",
        }}
      >
        {[left, right].map((item, index) => (
          <button
            key={item.id}
            type="button"
            onClick={() => selectWinner(item.id)}
            style={{
              minHeight: 260,
              border: "1px solid #ddd",
              borderRadius: 12,
              padding: "1rem",
              textAlign: "left",
              background: "#fff",
              cursor: "pointer",
            }}
          >
            <p style={{ marginTop: 0, color: "#666" }}>선택 {index + 1}</p>
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

      <p style={{ margin: 0, color: "#666" }}>단축키: 1/2, ←/→, Backspace(되돌리기)</p>
    </main>
  );
}
