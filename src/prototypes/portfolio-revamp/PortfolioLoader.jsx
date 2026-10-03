import { useEffect, useState } from "react";
import { AnimatePresence, motion as Motion } from "motion/react";

const MINIMUM_VISIBLE_MILLISECONDS = 900;
const COMPLETE_HOLD_MILLISECONDS = 350;

function loadImage(source, onComplete) {
  return new Promise((resolve) => {
    const image = new Image();
    let complete = false;
    const finish = () => {
      if (complete) return;
      complete = true;
      onComplete();
      resolve();
    };

    image.addEventListener("load", finish, { once: true });
    image.addEventListener("error", finish, { once: true });
    image.src = source;
    if (image.complete) finish();
  });
}

export default function PortfolioLoader({
  activateSound,
  assets,
  onComplete,
  prepareSound,
}) {
  const [progress, setProgress] = useState(0);
  const [ready, setReady] = useState(false);
  const [entering, setEntering] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let finishedTasks = 0;
    let completionTimer;
    let minimumTimer;
    const totalTasks = assets.length + 2;
    const finishTask = () => {
      finishedTasks += 1;
      if (!cancelled) setProgress(Math.round((finishedTasks / totalTasks) * 100));
    };
    const fontTask = (document.fonts?.ready ?? Promise.resolve()).finally(finishTask);
    const soundTask = Promise.resolve()
      .then(() => prepareSound?.())
      .catch(() => undefined)
      .finally(finishTask);
    const imageTasks = assets.map((source) => loadImage(source, finishTask));
    const minimumTask = new Promise((resolve) => {
      minimumTimer = window.setTimeout(resolve, MINIMUM_VISIBLE_MILLISECONDS);
    });

    Promise.all([...imageTasks, fontTask, soundTask, minimumTask]).then(() => {
      if (cancelled) return;
      setProgress(100);
      completionTimer = window.setTimeout(() => setReady(true), COMPLETE_HOLD_MILLISECONDS);
    });

    return () => {
      cancelled = true;
      if (completionTimer) window.clearTimeout(completionTimer);
      if (minimumTimer) window.clearTimeout(minimumTimer);
    };
  }, [assets, prepareSound]);

  const enterPortfolio = async () => {
    if (entering) return;
    setEntering(true);
    try {
      await activateSound?.();
    } finally {
      onComplete();
    }
  };

  return (
    <div
      className="portfolio-loader"
    >
      <div className="portfolio-loader-content">
        <p role="status" aria-live="polite">
          {ready ? "ready when you are" : "my favorite chord is G minor!"}
        </p>
        <div
          className="portfolio-loader-track"
          role="progressbar"
          aria-label="Loading portfolio"
          aria-valuemin="0"
          aria-valuemax="100"
          aria-valuenow={progress}
        >
          <Motion.span
            animate={{ scaleX: progress / 100 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
          />
        </div>
        <AnimatePresence>
          {ready && (
            <Motion.button
              className="portfolio-loader-action"
              type="button"
              disabled={entering}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 4 }}
              transition={{ duration: 0.24, ease: "easeOut" }}
              onClick={enterPortfolio}
            >
              {entering ? "starting..." : "enter with sound"}
            </Motion.button>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
