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
    <main className="page stack">
      <section className="page-card stack" style={{ padding: "1.5rem" }}>
        <h1 className="title">대진표</h1>
        <p className="subtitle">{tournament.topic}</p>
        <div className="grid-auto">
          {rounds.map((round) => (
            <section key={round} className="preview-item stack" style={{ gap: "0.45rem" }}>
              <h2 style={{ margin: 0 }}>{round === 4 ? "준결승" : round === 2 ? "결승" : `${round}강`}</h2>
              <ul className="preview-list">
                {(tournament.rounds[round] ?? []).map((match, index) => {
                  const left = itemMap.get(match.leftItemId)?.name ?? "-";
                  const right = itemMap.get(match.rightItemId)?.name ?? "-";
                  const winner = match.winnerItemId ? itemMap.get(match.winnerItemId)?.name : "미결정";

                  return (
                    <li key={match.id} style={{ borderTop: index === 0 ? "none" : "1px solid #eee", paddingTop: "0.5rem" }}>
                      <p className="helper-text" style={{ fontSize: 12 }}>
                        Match {index + 1}
                      </p>
                      <p style={{ margin: 0 }}>
                        {left} vs {right}
                      </p>
                      <p style={{ margin: 0, fontWeight: 700 }}>승자: {winner}</p>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>

        <div className="actions">
          <Link to="/match" className="button-link secondary">
            매치로 돌아가기
          </Link>
          <Link to="/result" className="button-link secondary">
            결과 보기
          </Link>
        </div>
      </section>
    </main>
  );
}
