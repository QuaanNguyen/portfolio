import { useEffect } from "react";
import ChordStudio from "./ChordStudio";
import "./chord-studio.css";

export default function ChordStudioPrototype() {
  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Chord Studio Prototype";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <div className="portfolio-prototype variant-c" data-variant="C">
      <div className="prototype-page">
        <ChordStudio variant="C" onBack={() => window.history.back()} />
      </div>
    </div>
  );
}
