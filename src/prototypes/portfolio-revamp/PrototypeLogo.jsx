import { useEffect, useRef, useState } from "react";
import {
  animate,
  motion as Motion,
  useMotionValue,
  useReducedMotion,
  useTransform,
} from "motion/react";
import qAsset from "../../../logo/q.svg";
import uAsset from "../../../logo/u.svg";
import aAsset from "../../../logo/a.svg";
import nAsset from "../../../logo/n.svg";
import lnNAsset from "../../../logo/last_name/n.svg";
import lnGAsset from "../../../logo/last_name/g.svg";
import lnUAsset from "../../../logo/last_name/u.svg";
import lnYAsset from "../../../logo/last_name/y.svg";
import lnEAsset from "../../../logo/last_name/e.svg";
import {
  LOGO_HOLD_SECONDS,
  LOGO_STRING_INTERVAL_SECONDS,
  LOGO_STRING_START_SECONDS,
} from "./logoTiming.js";

const COMPACT_BOUNDS = {
  width: 115.57555934867287,
  height: 217.6500797931907,
};

const EXPANDED_WIDTH = 556;

const ASSETS = {
  q: {
    id: "q",
    source: qAsset,
    x: 0,
    y: 0,
    width: 64.44234670939501,
    height: 217.65007979319074,
    finalX: 0,
    finalY: 0,
  },
  u: {
    id: "u",
    source: uAsset,
    x: 22.9614879835752,
    y: 64.1137712856923,
    width: 30.144107652796905,
    height: 36.29267542770506,
    finalX: 69,
    finalY: 9,
  },
  a: {
    id: "a",
    source: aAsset,
    x: 60.5696306600854,
    y: 0.62428519222403,
    width: 55.00592868858747,
    height: 56.37350161174163,
    finalX: 105,
    finalY: 0.62428519222403,
  },
  n: {
    id: "n",
    source: nAsset,
    x: 63.1830657214739,
    y: 61.8960638998596,
    width: 29.01431849865223,
    height: 36.235138392378964,
    finalX: 165,
    finalY: 9,
  },
};

export const DEFAULT_CHARACTER_ANIMATIONS = {
  q: {
    progressInput: [0, 0.46, 1],
    scaleInput: [0, 0.18, 0.46, 1],
    x: (dx) => [0, dx, dx],
    y: (dy) => [0, dy, dy],
    scale: [1, 1, 1, 1],
    rotate: [0, 0, 0],
    opacity: [1, 1, 1],
    transformOrigin: "center",
  },
  u: {
    progressInput: [0, 0.46, 1],
    scaleInput: [0, 0.18, 0.46, 1],
    x: (dx) => [0, dx, dx],
    y: (dy) => [0, dy, dy],
    scale: [1, 1.1, 1.3, 1.3],
    rotate: [0, 0, 0],
    opacity: [1, 1, 1],
    transformOrigin: "center",
  },
  a: {
    progressInput: [0, 0.46, 1],
    scaleInput: [0, 0.18, 0.46, 1],
    rotateInput: [0, 0.5, 1],
    x: (dx) => [0, dx, dx],
    y: (dy) => [0, dy, dy],
    scale: [1, 1, 0.95, 0.9],
    rotate: [0, -50, -180],
    opacity: [1, 1, 1],
    transformOrigin: "center",
  },
  n: {
    progressInput: [0, 0.46, 1],
    scaleInput: [0, 0.18, 0.46, 1],
    x: (dx) => [0, dx, dx],
    y: (dy) => [0, dy, dy],
    scale: [1, 1, 1.3, 1.3],
    rotate: [0, 0, 0],
    opacity: [1, 1, 1],
    transformOrigin: "center",
  },
};

const DOTS = [
  { x: 47.999, y: 190.795, size: 5.7 },
  { x: 69.077, y: 190.295, size: 6.3 },
  { x: 47.999, y: 200.173, size: 5.96 },
  { x: 70.064, y: 199.715, size: 6.12 },
  { x: 47.999, y: 209.177, size: 6.36 },
  { x: 70.556, y: 211.471, size: 6.14 },
];

const SURNAME_ASSETS = [
  { source: lnNAsset, width: 49.14, height: 54.20, finalX: 220.5, finalY: 1.5 },
  { source: lnGAsset, width: 66.21, height: 228.21, finalX: 263.5, finalY: 1.5 },
  { source: lnUAsset, width: 46.13, height: 47.37, finalX: 324.9, finalY: 6.5 },
  { source: lnYAsset, width: 58.42, height: 220.52, finalX: 369.1, finalY: 6.5 },
  { source: lnEAsset, width: 53.22, height: 47.16, finalX: 438.8, finalY: 3.5 },
  { source: lnNAsset, width: 49.14, height: 54.20, finalX: 497.0, finalY: 1.5 },
];

const COLORS = {
  green: "#4cb05e",
  blue: "#3976d9",
  ink: "#111827",
  white: "#f6f7f1",
};

const SCALES = {
  compact: 0.25,
  regular: 0.44,
  hero: 0.69,
};

function getAssetStyle(asset, color) {
  return {
    position: "absolute",
    display: "block",
    left: asset.x,
    top: asset.y,
    width: asset.width,
    height: asset.height,
    backgroundColor: color,
    maskImage: `url("${asset.source}")`,
    WebkitMaskImage: `url("${asset.source}")`,
    maskPosition: "center",
    WebkitMaskPosition: "center",
    maskRepeat: "no-repeat",
    WebkitMaskRepeat: "no-repeat",
    maskSize: "contain",
    WebkitMaskSize: "contain",
    pointerEvents: "none",
  };
}

function LogoAsset({ id, asset, color, progress, animation = {} }) {
  const dx = asset.finalX - asset.x;
  const dy = asset.finalY - asset.y;

  const defaultAnim = DEFAULT_CHARACTER_ANIMATIONS[id] ?? {};
  const config = { ...defaultAnim, ...animation };

  const xInput = config.xInput ?? config.progressInput ?? [0, 0.46, 1];
  const xOutput =
    typeof config.x === "function" ? config.x(dx) : (config.x ?? [0, dx, dx]);

  const yInput = config.yInput ?? config.progressInput ?? [0, 0.46, 1];
  const yOutput =
    typeof config.y === "function" ? config.y(dy) : (config.y ?? [0, dy, dy]);

  const scaleInput = config.scaleInput ??
    config.progressInput ?? [0, 0.18, 0.46, 1];
  const scaleOutput =
    typeof config.scale === "function"
      ? config.scale()
      : (config.scale ?? [1, 1.075, 1, 1]);

  const rotateInput = config.rotateInput ?? config.progressInput ?? [0, 1];
  const rotateOutput =
    typeof config.rotate === "function"
      ? config.rotate()
      : (config.rotate ?? [0, 0]);

  const opacityInput = config.opacityInput ?? config.progressInput ?? [0, 1];
  const opacityOutput =
    typeof config.opacity === "function"
      ? config.opacity()
      : (config.opacity ?? [1, 1]);

  const x = useTransform(progress, xInput, xOutput);
  const y = useTransform(progress, yInput, yOutput);
  const scale = useTransform(progress, scaleInput, scaleOutput);
  const rotate = useTransform(progress, rotateInput, rotateOutput);
  const opacity = useTransform(progress, opacityInput, opacityOutput);

  return (
    <Motion.span
      style={{
        ...getAssetStyle(asset, color),
        x,
        y,
        scale,
        rotate,
        opacity,
        transformOrigin: config.transformOrigin ?? "center",
      }}
    />
  );
}

function SurnameGlyph({ dot, surnameAsset, index, color, progress }) {
  const start =
    (LOGO_STRING_START_SECONDS + index * LOGO_STRING_INTERVAL_SECONDS) /
    LOGO_HOLD_SECONDS;
  const duration = 0.32;
  const end = Math.min(1, start + duration);

  const dx = surnameAsset.finalX - dot.x;
  const dy = surnameAsset.finalY - dot.y;

  // Gentle initial takeoff: at 30% of time, dot has moved only 14% of the distance (~20% slower departure)
  const tStart = start;
  const tMid1 = start + duration * 0.30;
  const tMid2 = start + duration * 0.70;
  const tEnd = end;

  const x = useTransform(
    progress,
    [0, tStart, tMid1, tMid2, tEnd, 1],
    [0, 0, dx * 0.14, dx * 0.75, dx, dx],
  );
  const y = useTransform(
    progress,
    [0, tStart, tMid1, tMid2, tEnd, 1],
    [0, 0, dy * 0.14, dy * 0.75, dy, dy],
  );

  const dotOpacity = useTransform(
    progress,
    [0, tStart, tMid1, tEnd],
    [1, 1, 0.7, 0],
  );
  const dotScale = useTransform(
    progress,
    [0, tStart, tEnd],
    [1, 1, 1.7],
  );

  const glyphOpacity = useTransform(
    progress,
    [0, tStart + duration * 0.18, tEnd],
    [0, 0, 1],
  );
  const glyphScale = useTransform(
    progress,
    [0, tStart + duration * 0.12, tEnd],
    [0.35, 0.35, 1],
  );

  return (
    <Motion.span
      aria-hidden="true"
      style={{
        position: "absolute",
        left: dot.x,
        top: dot.y,
        width: surnameAsset.width,
        height: surnameAsset.height,
        x,
        y,
        pointerEvents: "none",
      }}
    >
      <Motion.i
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: dot.size,
          height: dot.size,
          translate: "-50% -50%",
          borderRadius: "50%",
          background: color,
          opacity: dotOpacity,
          scale: dotScale,
        }}
      />
      <Motion.span
        style={{
          position: "absolute",
          inset: 0,
          backgroundColor: color,
          maskImage: `url("${surnameAsset.source}")`,
          WebkitMaskImage: `url("${surnameAsset.source}")`,
          maskPosition: "center",
          WebkitMaskPosition: "center",
          maskRepeat: "no-repeat",
          WebkitMaskRepeat: "no-repeat",
          maskSize: "contain",
          WebkitMaskSize: "contain",
          opacity: glyphOpacity,
          scale: glyphScale,
          transformOrigin: "left top",
        }}
      />
    </Motion.span>
  );
}

export default function PrototypeLogo({
  tone = "blue",
  compact = false,
  size,
  characterAnimations = {},
  onReplay,
  onReverse,
  onStop,
  onResolve,
}) {
  const shouldReduceMotion = useReducedMotion();
  const progress = useMotionValue(0);
  const animationRef = useRef(null);
  const strumTimerRef = useRef(null);
  const strumTriggeredRef = useRef(false);
  const [resolved, setResolved] = useState(false);
  const color = COLORS[tone] ?? tone;
  const scale = SCALES[size ?? (compact ? "compact" : "regular")];

  const moveTo = (target) => {
    animationRef.current?.stop();
    if (strumTimerRef.current) clearTimeout(strumTimerRef.current);

    if (target === 1) {
      strumTriggeredRef.current = false;
      onReplay?.();
      strumTimerRef.current = setTimeout(() => {
        strumTriggeredRef.current = true;
      }, LOGO_STRING_START_SECONDS * 1000);
    }

    const current = progress.get();

    if (shouldReduceMotion) {
      progress.set(target);
      if (target === 1) {
        setResolved(true);
        onResolve?.();
      } else {
        setResolved(false);
      }
      return;
    }

    const duration = target === 1
      ? Math.max(0.12, (1 - current) * LOGO_HOLD_SECONDS)
      : Math.max(0.15, current * 1.35);

    animationRef.current = animate(progress, target, {
      duration,
      ease: target === 1 ? [0.34, 0.02, 0.18, 1] : [0.45, 0, 0.72, 1],
      onComplete: () => {
        if (target === 1) {
          setResolved(true);
          onResolve?.();
        } else {
          setResolved(false);
        }
      },
    });
  };

  const reverse = () => {
    if (strumTimerRef.current) clearTimeout(strumTimerRef.current);
    const wasTriggered =
      resolved ||
      strumTriggeredRef.current ||
      progress.get() >= (LOGO_STRING_START_SECONDS / LOGO_HOLD_SECONDS) * 0.85;

    if (wasTriggered) {
      onReverse?.();
    } else {
      onStop?.();
    }
    strumTriggeredRef.current = false;
    moveTo(0);
  };

  useEffect(() => () => {
    animationRef.current?.stop();
    if (strumTimerRef.current) clearTimeout(strumTimerRef.current);
  }, []);

  return (
    <Motion.button
      type="button"
      className={`prototype-logo size-${size ?? (compact ? "compact" : "regular")} ${resolved ? "is-resolved" : ""}`}
      aria-label="Quan Nguyen logo"
      onPointerEnter={() => moveTo(1)}
      onPointerLeave={reverse}
      onPointerDown={() => {
        onReplay?.();
        moveTo(1);
      }}
      onFocus={() => moveTo(1)}
      onBlur={reverse}
      style={{
        position: "relative",
        display: "block",
        flex: "0 0 auto",
        width: EXPANDED_WIDTH * scale,
        height: COMPACT_BOUNDS.height * scale,
        padding: 0,
        border: 0,
        background: "transparent",
        cursor: "pointer",
        touchAction: "manipulation",
      }}
    >
      <span
        aria-hidden="true"
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width: EXPANDED_WIDTH,
          height: COMPACT_BOUNDS.height,
          display: "block",
          transform: `scale(${scale})`,
          transformOrigin: "left top",
        }}
      >
        {Object.values(ASSETS).map((asset) => (
          <LogoAsset
            key={asset.id}
            id={asset.id}
            asset={asset}
            color={color}
            progress={progress}
            animation={characterAnimations[asset.id]}
          />
        ))}
        {DOTS.map((dot, index) => (
          <SurnameGlyph
            key={`${dot.x}-${dot.y}`}
            dot={dot}
            surnameAsset={SURNAME_ASSETS[index]}
            index={index}
            color={color}
            progress={progress}
          />
        ))}
      </span>
    </Motion.button>
  );
}
