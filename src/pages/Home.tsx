import { Link } from "react-router-dom";

export function HomePage() {
  return (
    <main>
      <h1>Choice Tournament</h1>
      <p>8강/16강/32강 토너먼트로 빠르게 결정을 내리세요.</p>
      <Link to="/create">새 토너먼트 만들기</Link>
    </main>
  );
}
