import { useEffect, useState } from "react";
import SandboxScene from "./SandboxScene";
import MobileCardStack from "./MobileCardStack";
import "./sandbox.css";

function useMediaQuery(query) {
  const [matches, setMatches] = useState(() => window.matchMedia(query).matches);
  useEffect(() => {
    const list = window.matchMedia(query);
    const onChange = () => setMatches(list.matches);
    list.addEventListener("change", onChange);
    return () => list.removeEventListener("change", onChange);
  }, [query]);
  return matches;
}

function useCardFontsReady() {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let cancelled = false;
    const fonts = ['400 25px "Hedvig Letters Sans"', '400 15.6px "Hedvig Letters Sans"'];
    Promise.all(fonts.map((font) => document.fonts.load(font)))
      .catch(() => undefined)
      .then(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  return ready;
}

export default function SandboxPage() {
  const isMobile = useMediaQuery("(max-width: 1023px)");
  const reducedMotion = useMediaQuery("(prefers-reduced-motion: reduce)");
  const fontsReady = useCardFontsReady();

  useEffect(() => {
    const previous = document.title;
    document.title = "quan's playground";
    return () => {
      document.title = previous;
    };
  }, []);

  if (isMobile) return <MobileCardStack />;

  return (
    <div className="pg-root">
      {fontsReady && <SandboxScene reducedMotion={reducedMotion} />}
    </div>
  );
}
