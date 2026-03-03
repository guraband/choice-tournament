import { Navigate, Route, Routes } from "react-router-dom";

import { BracketPage } from "../pages/Bracket";
import { CreatePage } from "../pages/Create";
import { HomePage } from "../pages/Home";
import { MatchPage } from "../pages/Match";
import { ResultPage } from "../pages/Result";

export function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<HomePage />} />
      <Route path="/create" element={<CreatePage />} />
      <Route path="/match" element={<MatchPage />} />
      <Route path="/bracket" element={<BracketPage />} />
      <Route path="/result" element={<ResultPage />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
