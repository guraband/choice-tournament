import { BrowserRouter } from "react-router-dom";

import { AppRouter } from "../routes/AppRouter";
import { TournamentProvider } from "../state/TournamentContext";

export function App() {
  return (
    <TournamentProvider>
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </TournamentProvider>
  );
}
