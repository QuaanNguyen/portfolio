import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router-dom";
import PortfolioHomePage from "./prototypes/portfolio-revamp/PortfolioHomePage";

const PortfolioRevampPrototype = import.meta.env.DEV
  ? lazy(() => import("./prototypes/portfolio-revamp/PortfolioRevampPrototype"))
  : null;

function App() {
  return (
    <Suspense fallback={null}>
      <Routes>
        <Route path="/" element={<PortfolioHomePage />} />
        {PortfolioRevampPrototype && (
          <Route
            path="/prototype/portfolio-revamp"
            element={<PortfolioRevampPrototype />}
          />
        )}
        <Route path="*" element={<PortfolioHomePage />} />
      </Routes>
    </Suspense>
  );
}

export default App;
