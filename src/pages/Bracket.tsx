import { Link, Navigate } from "react-router-dom";

import { getItemMap, getRoundSequence } from "../domain/tournament";
import { useTournament } from "../state/TournamentContext";

export function BracketPage() {
  const { tournament } = useTournament();

  if (!tournament) {
    return <Navigate to="/create" replace />;
  }

  const itemMap = getItemMap(tournament.items);
  const rounds = getRoundSequence(tournament.items.length as 8 | 16 | 32);

  return (
    <main style={{ margin: "0 auto", maxWidth: 1080, padding: "2rem 1rem", display: "grid", gap: "1rem" }}>
      <h1 style={{ margin: 0 }}>대진표</h1>
      <p style={{ margin: 0 }}>{tournament.topic}</p>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem" }}>
        {rounds.map((round) => (
          <section key={round} style={{ border: "1px solid #ddd", borderRadius: 12, padding: "0.75rem" }}>
            <h2 style={{ marginTop: 0 }}>{round === 4 ? "준결승" : round === 2 ? "결승" : `${round}강`}</h2>
            <ul style={{ listStyle: "none", margin: 0, padding: 0, display: "grid", gap: "0.5rem" }}>
              {(tournament.rounds[round] ?? []).map((match, index) => {
                const left = itemMap.get(match.leftItemId)?.name ?? "-";
                const right = itemMap.get(match.rightItemId)?.name ?? "-";
                const winner = match.winnerItemId ? itemMap.get(match.winnerItemId)?.name : "미결정";

                return (
                  <li key={match.id} style={{ borderTop: index === 0 ? "none" : "1px solid #eee", paddingTop: "0.5rem" }}>
                    <p style={{ margin: 0, fontSize: 12, color: "#666" }}>Match {index + 1}</p>
                    <p style={{ margin: 0 }}>{left} vs {right}</p>
                    <p style={{ margin: 0, fontWeight: 700 }}>승자: {winner}</p>
                  </li>
                );
              })}
            </ul>
          </section>
        ))}
      </div>

      <div style={{ display: "flex", gap: "0.5rem" }}>
        <Link to="/match">매치로 돌아가기</Link>
        <Link to="/result">결과 보기</Link>
      </div>
    </main>
  );
}
