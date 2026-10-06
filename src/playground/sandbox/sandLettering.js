const ASCENDER = -0.8;

function line(...points) {
  return { points, smooth: false };
}

function curve(...points) {
  return { points, smooth: true };
}

function loop(cx, cy, rx, ry, fromDeg, toDeg) {
  const steps = 28;
  const points = Array.from({ length: steps + 1 }, (_, i) => {
    const angle = ((fromDeg + ((toDeg - fromDeg) * i) / steps) * Math.PI) / 180;
    return [cx + rx * Math.cos(angle), cy + ry * Math.sin(angle)];
  });
  return { points, smooth: false };
}

const GLYPHS = {
  s: {
    width: 0.72,
    strokes: [
      curve([0.66, 0.12], [0.42, 0], [0.16, 0.08], [0.12, 0.28], [0.36, 0.47], [0.6, 0.62], [0.66, 0.84], [0.44, 1], [0.16, 0.98], [0.02, 0.86]),
    ],
  },
  a: {
    width: 0.9,
    strokes: [loop(0.4, 0.52, 0.36, 0.48, -15, -360), line([0.78, 0.02], [0.78, 0.88], [0.86, 1])],
  },
  n: {
    width: 0.84,
    strokes: [line([0.08, 0], [0.08, 1]), curve([0.08, 0.4], [0.24, 0.08], [0.46, 0], [0.66, 0.08], [0.74, 0.3], [0.74, 1])],
  },
  d: {
    width: 0.88,
    strokes: [loop(0.4, 0.52, 0.36, 0.48, -15, -360), line([0.78, ASCENDER], [0.78, 1])],
  },
  b: {
    width: 0.9,
    strokes: [line([0.1, ASCENDER], [0.1, 1]), loop(0.48, 0.52, 0.36, 0.48, 195, 525)],
  },
  o: {
    width: 0.86,
    strokes: [loop(0.42, 0.5, 0.38, 0.5, -100, -465)],
  },
  x: {
    width: 0.76,
    strokes: [line([0.04, 0], [0.7, 1]), line([0.7, 0], [0.04, 1])],
  },
  c: {
    width: 0.74,
    strokes: [curve([0.68, 0.14], [0.44, 0], [0.16, 0.1], [0.04, 0.48], [0.16, 0.88], [0.42, 1], [0.68, 0.86])],
  },
  t: {
    width: 0.6,
    strokes: [curve([0.26, -0.6], [0.26, 0.5], [0.28, 0.86], [0.4, 0.99], [0.56, 0.94]), line([0.02, 0.02], [0.54, 0])],
  },
  r: {
    width: 0.62,
    strokes: [line([0.08, 0], [0.08, 1]), curve([0.08, 0.42], [0.2, 0.12], [0.38, 0], [0.58, 0.04])],
  },
  l: {
    width: 0.42,
    strokes: [curve([0.14, ASCENDER], [0.14, 0.7], [0.2, 0.95], [0.34, 1])],
  },
  "+": {
    width: 0.74,
    strokes: [line([0.04, 0.5], [0.68, 0.5]), line([0.36, 0.18], [0.36, 0.82])],
  },
  z: {
    width: 0.78,
    strokes: [line([0.04, 0.02], [0.7, 0.02], [0.04, 1], [0.72, 1])],
  },
};

const QUOTE_FINGER_RADIUS = 0.0795;
const QUOTE_STROKES = [
  [[-0.908, -1.513], [-0.902, -1.513], [-0.897, -1.49], [-0.891, -1.439], [-0.897, -1.376], [-0.925, -1.274], [-0.965, -1.16], [-0.999, -1.086], [-1.022, -1.041], [-1.039, -1.018], [-1.05, -1.007], [-1.056, -0.995]],
  [[-0.38, -1.456], [-0.374, -1.456], [-0.374, -1.45], [-0.368, -1.422], [-0.368, -1.382], [-0.374, -1.325], [-0.408, -1.251], [-0.448, -1.155], [-0.487, -1.064], [-0.516, -1.007], [-0.527, -0.984], [-0.527, -0.978]],
  [[7.973, -1.495], [7.978, -1.495], [7.978, -1.49], [7.961, -1.444], [7.939, -1.382], [7.899, -1.302], [7.853, -1.211], [7.802, -1.115], [7.763, -1.035], [7.74, -0.995], [7.728, -0.978], [7.728, -0.973], [7.723, -0.973]],
  [[8.535, -1.518], [8.53, -1.518], [8.53, -1.507], [8.484, -1.422], [8.45, -1.359], [8.416, -1.291], [8.376, -1.206], [8.342, -1.132], [8.325, -1.081], [8.308, -1.041], [8.291, -1.018], [8.274, -0.99], [8.257, -0.967], [8.245, -0.944], [8.24, -0.939]],
];

function layoutQuotes({ left, baseline, xHeight }) {
  const strokes = QUOTE_STROKES.map((stroke) => stroke.map(([u, v]) => ({ x: left + u * xHeight, y: baseline + v * xHeight })));
  return { strokes, radiusPx: QUOTE_FINGER_RADIUS * xHeight };
}

function catmullRom(points, samplesPerSegment) {
  const result = [];
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];
    for (let s = 0; s < samplesPerSegment; s++) {
      const t = s / samplesPerSegment;
      const t2 = t * t;
      const t3 = t2 * t;
      result.push(
        [0, 1].map(
          (k) =>
            0.5 *
            (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * t2 + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * t3)
        )
      );
    }
  }
  result.push(points[points.length - 1]);
  return result;
}

function textWidth(text, letterGap) {
  const glyphs = [...text].map((char) => GLYPHS[char]);
  return glyphs.reduce((sum, glyph) => sum + glyph.width, 0) + letterGap * (glyphs.length - 1);
}

export function layoutSandText(text, { left, baseline, xHeight, letterGap }) {
  const strokes = [];
  let cursor = 0;
  for (const char of text) {
    const glyph = GLYPHS[char];
    for (const stroke of glyph.strokes) {
      const unitPoints = stroke.smooth ? catmullRom(stroke.points, 8) : stroke.points;
      strokes.push(unitPoints.map(([x, y]) => ({ x: left + (cursor + x) * xHeight, y: baseline - (1 - y) * xHeight })));
    }
    cursor += glyph.width + letterGap;
  }
  return { strokes };
}

export function sandTextWidth(text, xHeight, letterGap) {
  return textWidth(text, letterGap) * xHeight;
}

export function defaultLettering(viewportW, viewportH) {
  const titleXHeight = Math.min(88, Math.max(48, viewportW * 0.05), viewportH * 0.1);
  const titleGap = 0.24;
  const titleWidth = sandTextWidth("sandbox", titleXHeight, titleGap);
  const titleFrame = {
    left: (viewportW - titleWidth) / 2,
    baseline: viewportH * 0.1 + titleXHeight * 1.8,
    xHeight: titleXHeight,
  };
  const title = layoutSandText("sandbox", { ...titleFrame, letterGap: titleGap });

  const hintXHeight = titleXHeight * 0.72;
  const hintGap = 0.36;
  const hintWidth = sandTextWidth("ctrl+z", hintXHeight, hintGap);
  const hint = layoutSandText("ctrl+z", {
    left: viewportW - hintWidth - 56,
    baseline: viewportH - 48,
    xHeight: hintXHeight,
    letterGap: hintGap,
  });

  return {
    engraved: [
      { ...title, radiusPx: Math.max(6, titleXHeight * 0.09), depth: 1.3 },
      { ...hint, radiusPx: Math.max(4.5, hintXHeight * 0.085), depth: 1.1 },
    ],
    fingerDrawn: [layoutQuotes(titleFrame)],
  };
}
