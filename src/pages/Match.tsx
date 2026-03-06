import { useEffect, useRef, useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";

import { getCurrentMatch, getItemMap, isTournamentComplete } from "../domain/tournament";
import { useTournament } from "../state/TournamentContext";

const INTRO_TOTAL_DURATION_MS = 2000;

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
  const [winnerBanner, setWinnerBanner] = useState<string | null>(null);
  const [introIndex, setIntroIndex] = useState<number | null>(null);
  const [isIntroPlaying, setIsIntroPlaying] = useState(false);
  const [isResultRedirectReady, setIsResultRedirectReady] = useState(false);
  const previousRoundRef = useRef<number | null>(null);
  const wasCompleteRef = useRef(false);

  useEffect(() => {
    if (!tournament) {
      setIsIntroPlaying(false);
      setIntroIndex(null);
      wasCompleteRef.current = false;
      setWinnerBanner(null);
      setIsResultRedirectReady(false);
      return;
    }

    const complete = isTournamentComplete(tournament);
    if (complete && !wasCompleteRef.current) {
      const itemMap = getItemMap(tournament.items);
      const finalMatch = tournament.rounds[2]?.[0];
      const winnerName = finalMatch?.winnerItemId ? itemMap.get(finalMatch.winnerItemId)?.name : null;

      if (!winnerName) {
        setIsResultRedirectReady(true);
      } else {
        setWinnerBanner(winnerName);
        setIsResultRedirectReady(false);

        const timeoutId = window.setTimeout(() => {
          setWinnerBanner(null);
          setIsResultRedirectReady(true);
        }, 1400);
        return () => window.clearTimeout(timeoutId);
      }
    }

    if (!complete) {
      setWinnerBanner(null);
      setIsResultRedirectReady(false);
    }

    wasCompleteRef.current = complete;
  }, [tournament]);

  useEffect(() => {
    if (!tournament || tournament.history.length > 0 || typeof window === "undefined") {
      return;
    }

    const introSessionKey = `intro-played:${tournament.topic}:${tournament.items.map((item) => item.id).join(",")}`;
    const isAlreadyPlayed = window.sessionStorage.getItem(introSessionKey);
    if (isAlreadyPlayed) {
      return;
    }

    const introLength = tournament.items.length;
    if (introLength === 0) {
      return;
    }

    const stepDuration = Math.max(80, Math.round(INTRO_TOTAL_DURATION_MS / introLength));
    let index = 0;

    setIsIntroPlaying(true);
    setIntroIndex(0);

    const intervalId = window.setInterval(() => {
      index += 1;

      if (index >= introLength) {
        window.clearInterval(intervalId);
        setIsIntroPlaying(false);
        setIntroIndex(null);
        window.sessionStorage.setItem(introSessionKey, "1");
        return;
      }

      setIntroIndex(index);
    }, stepDuration);

    return () => window.clearInterval(intervalId);
  }, [tournament]);

  useEffect(() => {
    if (!tournament) {
      return;
    }

    const onKeyDown = (event: KeyboardEvent) => {
      const match = getCurrentMatch(tournament);
      if (!match) {
        return;
      }

      if (isIntroPlaying) {
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
  }, [isIntroPlaying, selectWinner, tournament, undo]);

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
    if (isResultRedirectReady && !winnerBanner) {
      return <Navigate to="/result" replace />;
    }

    return (
      <main className="page stack">
        {winnerBanner ? (
          <div
            style={{
              position: "fixed",
              inset: 0,
              display: "grid",
              placeItems: "center",
              background: "rgba(0, 0, 0, 0.78)",
              color: "#fff",
              fontSize: "clamp(2.4rem, 10vw, 6.5rem)",
              fontWeight: 800,
              letterSpacing: "0.03em",
              textAlign: "center",
              zIndex: 10000,
              pointerEvents: "none",
              animation: "winner-banner-fade 1.4s ease forwards",
              padding: "1rem",
            }}
          >
            {winnerBanner}
          </div>
        ) : null}
        <style>
          {`@keyframes winner-banner-fade {
            0% { opacity: 0; transform: scale(0.9); }
            15% { opacity: 1; transform: scale(1); }
            75% { opacity: 1; transform: scale(1.04); }
            100% { opacity: 0; transform: scale(1.08); }
          }`}
        </style>
      </main>
    );
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
  const introItem = introIndex !== null ? tournament.items[introIndex] : null;

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
            <Link to="/result" className="button-link secondary">
              결과 화면
            </Link>
          </div>
        </header>

        <section className="grid-auto">
          {[left, right].map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={() => selectWinner(item.id)}
              className="match-choice"
              disabled={isIntroPlaying}
            >
              <p className="helper-text">선택 {index + 1}</p>
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
      {isIntroPlaying && introItem ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "grid",
            placeItems: "center",
            backgroundImage: introItem.imageBase64
              ? `linear-gradient(rgba(0, 0, 0, 0.42), rgba(0, 0, 0, 0.62)), url(${introItem.imageBase64})`
              : "linear-gradient(135deg, rgba(20, 26, 38, 0.95), rgba(43, 53, 74, 0.95))",
            backgroundSize: "cover",
            backgroundPosition: "center",
            zIndex: 10001,
            padding: "1rem",
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "#fff",
              fontSize: "clamp(2.2rem, 11vw, 6.8rem)",
              lineHeight: 1.1,
              fontWeight: 900,
              letterSpacing: "0.03em",
              textAlign: "center",
              textShadow: "0 0.1em 0.35em rgba(0, 0, 0, 0.78)",
              background: "rgba(0, 0, 0, 0.35)",
              borderRadius: "0.6rem",
              padding: "0.35em 0.55em",
              boxShadow: "0 1.2rem 2rem rgba(0, 0, 0, 0.35)",
            }}
          >
            {introItem.name}
          </h2>
        </div>
      ) : null}
      {winnerBanner ? (
        <div
          style={{
            position: "fixed",
            inset: 0,
            display: "grid",
            placeItems: "center",
            background: "rgba(0, 0, 0, 0.78)",
            color: "#fff",
            fontSize: "clamp(2.4rem, 10vw, 6.5rem)",
            fontWeight: 800,
            letterSpacing: "0.03em",
            textAlign: "center",
            zIndex: 10000,
            pointerEvents: "none",
            animation: "winner-banner-fade 1.4s ease forwards",
            padding: "1rem",
          }}
        >
          {winnerBanner}
        </div>
      ) : null}
      <style>
        {`@keyframes round-banner-fade {
          0% { opacity: 0; transform: scale(0.92); }
          15% { opacity: 1; transform: scale(1); }
          70% { opacity: 1; transform: scale(1.02); }
          100% { opacity: 0; transform: scale(1.08); }
        }

        @keyframes winner-banner-fade {
          0% { opacity: 0; transform: scale(0.9); }
          15% { opacity: 1; transform: scale(1); }
          75% { opacity: 1; transform: scale(1.04); }
          100% { opacity: 0; transform: scale(1.08); }
        }`}
      </style>
    </main>
  );
}
