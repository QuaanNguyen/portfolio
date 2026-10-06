import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import PortfolioPage from "./portfolio/PortfolioPage";
import PlaygroundRoute from "./playground/PlaygroundRoute";

const ChordStudioPrototype = import.meta.env.DEV
  ? lazy(() => import("./prototypes/chord-studio/ChordStudioPrototype"))
  : null;

function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<PortfolioPage />} />
        <Route path="/playground" element={<PlaygroundRoute />} />
        {ChordStudioPrototype && (
          <Route
            path="/prototype/chord-studio"
            element={<ChordStudioPrototype />}
          />
        )}
        <Route path="*" element={<PortfolioPage />} />
      </Routes>
    </Suspense>
  );
}

export default App;
