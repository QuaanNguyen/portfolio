import { motion as Motion } from "motion/react";

const LABELS = {
  A: "Signal",
  B: "Field notes",
  C: "Instrument",
};

export default function PrototypeSwitcher({ current, onNext, onPrevious, page }) {
  return (
    <Motion.div
      className="prototype-switcher"
      initial={{ y: 30, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay: 0.45, type: "spring", stiffness: 300, damping: 26 }}
      role="group"
      aria-label="Prototype direction switcher"
    >
      <button type="button" onClick={onPrevious} aria-label="Previous design direction">←</button>
      <div>
        <small>{page} · direction</small>
        <strong>{current} / {LABELS[current]}</strong>
      </div>
      <button type="button" onClick={onNext} aria-label="Next design direction">→</button>
    </Motion.div>
  );
}
