import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <main className="page stack">
      <section className="page-card home-hero stack">
        <h1 className="title">Choice Tournament</h1>
        <p className="subtitle">8강/16강/32강 토너먼트로 빠르게 결정을 내리세요.</p>
        <div className="actions">
          <Link className="button-link" to="/create">
            새 토너먼트 만들기
          </Link>
        </div>
      </section>
    </main>
  );
}
