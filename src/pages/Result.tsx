import { Link, Navigate, useNavigate } from "react-router-dom";

import { getItemMap, isTournamentComplete } from "../domain/tournament";
import { useTournament } from "../state/TournamentContext";
import { encodeShareDraft } from "../utils/share";

export function ResultPage() {
  const navigate = useNavigate();
  const { tournament, reset } = useTournament();

  const handleCopyShareLink = async () => {
    if (!tournament) {
      return;
    }

    const payload = encodeShareDraft({
      topic: tournament.topic,
      items: tournament.items.map((item) => item.name),
      seed: tournament.seed,
      round: tournament.items.length === 32 ? 32 : 16,
      shuffleEnabled: false,
    });
    const base = import.meta.env.BASE_URL;
    const url = `${window.location.origin}${base}create?share=${payload}`;

    try {
      await navigator.clipboard.writeText(url);
      window.alert("공유 링크가 클립보드에 복사되었습니다.");
    } catch {
      window.prompt("아래 링크를 복사해 공유해 주세요.", url);
    }
  };

  if (!tournament) {
    return <Navigate to="/create" replace />;
  }

  if (!isTournamentComplete(tournament)) {
    return <Navigate to="/match" replace />;
  }

  const itemMap = getItemMap(tournament.items);
  const finalMatch = tournament.rounds[2]?.[0];

  if (!finalMatch?.winnerItemId) {
    return <Navigate to="/match" replace />;
  }

  const champion = itemMap.get(finalMatch.winnerItemId);
  const runnerUp =
    finalMatch.leftItemId === finalMatch.winnerItemId
      ? itemMap.get(finalMatch.rightItemId)
      : itemMap.get(finalMatch.leftItemId);

  const semifinalists = (tournament.rounds[4] ?? [])
    .flatMap((match) => {
      if (!match.winnerItemId) {
        return [];
      }

      const loserId = match.leftItemId === match.winnerItemId ? match.rightItemId : match.leftItemId;
      return [itemMap.get(loserId)?.name];
    })
    .filter((name): name is string => Boolean(name));

  return (
    <main style={{ margin: "0 auto", maxWidth: 720, padding: "2rem 1rem", display: "grid", gap: "1rem" }}>
      <h1 style={{ margin: 0 }}>결과</h1>
      <section style={{ border: "2px solid #333", borderRadius: 12, padding: "1rem" }}>
        <p style={{ margin: 0, color: "#666" }}>Champion</p>
        <h2 style={{ margin: "0.5rem 0 0" }}>{champion?.name ?? "-"}</h2>
      </section>
      <p style={{ margin: 0 }}>
        <strong>Runner-up:</strong> {runnerUp?.name ?? "-"}
      </p>
      <p style={{ margin: 0 }}>
        <strong>4강:</strong> {semifinalists.join(", ") || "-"}
      </p>

      <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => {
            reset();
            navigate("/create");
          }}
        >
          다시하기
        </button>
        <Link to="/bracket">대진표 보기</Link>
        <button type="button" onClick={() => void handleCopyShareLink()}>
          공유 링크 복사
        </button>
      </div>
    </main>
  );
}
