import { useState } from "react";
import LeagueImpostor from "../components/LeagueImpostor";
import LegacyLayout from "./LegacyLayout";

export default function LegacyLeaguePage() {
  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  return (
    <LegacyLayout isOverlayOpen={isOverlayOpen}>
      <LeagueImpostor setIsOverlayOpen={setIsOverlayOpen} />
    </LegacyLayout>
  );
}
