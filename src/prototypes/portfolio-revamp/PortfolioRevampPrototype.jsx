import { useCallback, useEffect } from "react";
import { AnimatePresence, MotionConfig, motion as Motion } from "motion/react";
import { useSearchParams } from "react-router-dom";
import ChordStudio from "./ChordStudio";
import HomeVariants from "./HomeVariants";
import useGuitarEngine from "./useGuitarEngine";
import "./portfolio-revamp.css";

export default function PortfolioRevampPrototype() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = searchParams.get("page") === "sound" ? "sound" : "home";
  const { playLogoSignature, playReverseSignature, stopSequence } = useGuitarEngine();

  const updateParams = useCallback((changes) => {
    const nextParams = new URLSearchParams(searchParams);
    Object.entries(changes).forEach(([key, value]) => nextParams.set(key, value));
    setSearchParams(nextParams, { replace: true });
  }, [searchParams, setSearchParams]);

  useEffect(() => {
    const previousTitle = document.title;
    document.title = "Portfolio revamp prototype";
    return () => {
      document.title = previousTitle;
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <div className="portfolio-prototype variant-c" data-variant="C">
        <div className="prototype-badge">throwaway prototype · not production</div>
        <AnimatePresence mode="sync" initial={false}>
          {page === "home" ? (
            <Motion.div className="prototype-page" key="home" exit={{ opacity: 0 }}>
              <HomeVariants
                onOpenStudio={() => {
                  stopSequence();
                  updateParams({ page: "sound" });
                }}
                onReplayLogo={playLogoSignature}
                onReverseLogo={playReverseSignature}
                onStopLogo={stopSequence}
              />
            </Motion.div>
          ) : (
            <Motion.div className="prototype-page" key="sound" exit={{ opacity: 0 }}>
              <ChordStudio variant="C" onBack={() => updateParams({ page: "home" })} />
            </Motion.div>
          )}
        </AnimatePresence>
      </div>
    </MotionConfig>
  );
}
