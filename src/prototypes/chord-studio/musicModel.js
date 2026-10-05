const NOTE_NAMES = ["C", "D♭", "D", "E♭", "E", "F", "G♭", "G", "A♭", "A", "B♭", "B"];

const COMPLEXITY_LEVELS = [0.06, 0.24, 0.42, 0.58, 0.76, 0.94];

const HARMONIC_BASES = [
  { id: "i", offset: 0, family: "minor", fn: "T", brightness: -1, tension: 0.04 },
  { id: "I", offset: 0, family: "major", fn: "T", brightness: 1, tension: 0.04 },
  { id: "Isus", offset: 0, family: "sus", fn: "T", brightness: 0, tension: 0.12 },
  { id: "bIII", offset: 3, family: "major", fn: "T", brightness: -0.25, tension: 0.2 },
  { id: "vi", offset: 9, family: "minor", fn: "T", brightness: 0.1, tension: 0.2 },
  { id: "iiø", offset: 2, family: "halfDim", fn: "PD", brightness: -0.9, tension: 0.56 },
  { id: "iv", offset: 5, family: "minor", fn: "PD", brightness: -0.75, tension: 0.48 },
  { id: "bVI", offset: 8, family: "major", fn: "PD", brightness: -0.4, tension: 0.44 },
  { id: "ii", offset: 2, family: "minor", fn: "PD", brightness: 0.15, tension: 0.48 },
  { id: "IV", offset: 5, family: "major", fn: "PD", brightness: 0.75, tension: 0.42 },
  { id: "v", offset: 7, family: "minor", fn: "D", brightness: -0.55, tension: 0.76 },
  { id: "bVII", offset: 10, family: "major", fn: "D", brightness: -0.1, tension: 0.72 },
  { id: "V", offset: 7, family: "dominant", fn: "D", brightness: 0.45, tension: 0.86 },
];

const FUNCTION_COST = {
  T: { T: 0.25, PD: 0, D: 0.2 },
  PD: { T: 0.45, PD: 0.25, D: 0 },
  D: { T: 0, PD: 0.7, D: 0.25 },
};

const SUFFIXES = {
  major: ["", "6", "add9", "maj7", "maj9", "6/9"],
  minor: ["m", "m6", "m(add9)", "m7", "m9", "m11"],
  dominant: ["", "sus4", "7", "9", "13", "7(♭9,♯9)"],
  halfDim: ["dim", "m7♭5", "m9♭5", "m11♭5", "m11♭5(add13)", "m11♭5(♭13)"],
  sus: ["sus2", "sus4", "sus2/add4", "7sus4", "9sus4", "13sus4"],
};

const CHORD_INTERVALS = {
  major: [
    [0, 4, 7],
    [0, 4, 7, 9],
    [0, 4, 7, 14],
    [0, 4, 7, 11],
    [0, 4, 7, 11, 14],
    [0, 4, 7, 9, 14],
  ],
  minor: [
    [0, 3, 7],
    [0, 3, 7, 9],
    [0, 3, 7, 14],
    [0, 3, 7, 10],
    [0, 3, 7, 10, 14],
    [0, 3, 7, 10, 14, 17],
  ],
  dominant: [
    [0, 4, 7],
    [0, 5, 7],
    [0, 4, 7, 10],
    [0, 4, 7, 10, 14],
    [0, 4, 7, 10, 14, 21],
    [0, 4, 7, 10, 13, 15],
  ],
  halfDim: [
    [0, 3, 6],
    [0, 3, 6, 10],
    [0, 3, 6, 10, 14],
    [0, 3, 6, 10, 14, 17],
    [0, 3, 6, 10, 14, 17, 21],
    [0, 3, 6, 10, 14, 17, 20],
  ],
  sus: [
    [0, 2, 7],
    [0, 5, 7],
    [0, 2, 5, 7],
    [0, 5, 7, 10],
    [0, 5, 7, 10, 14],
    [0, 5, 7, 10, 14, 21],
  ],
};

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const mod = (value, divisor) => ((value % divisor) + divisor) % divisor;

const smoothstep = (edge0, edge1, value) => {
  const x = clamp((value - edge0) / (edge1 - edge0));
  return x * x * (3 - 2 * x);
};

const square = (value) => value * value;

const circularDistance = (left, right) => {
  const direct = Math.abs(left - right);
  return Math.min(direct, 12 - direct);
};

const unique = (values) => [...new Set(values.map((value) => mod(value, 12)))];

function intervalsFor(family, level) {
  return unique(CHORD_INTERVALS[family][level]);
}

export function createChord(rootPc, family, level) {
  const normalizedLevel = Math.round(clamp(level, 0, COMPLEXITY_LEVELS.length - 1));
  const normalizedRoot = mod(rootPc, 12);
  const intervals = intervalsFor(family, normalizedLevel);
  const pitchClasses = intervals.map((interval) => mod(normalizedRoot + interval, 12));
  const suffix = SUFFIXES[family][normalizedLevel];

  return {
    rootPc: normalizedRoot,
    rootName: NOTE_NAMES[normalizedRoot],
    family,
    level: normalizedLevel,
    suffix,
    label: `${NOTE_NAMES[normalizedRoot]}${suffix}`,
    pitchClasses,
    complexity: COMPLEXITY_LEVELS[normalizedLevel],
  };
}

function createCandidate(base, level, tonicPc, catalogIndex) {
  const rootPc = mod(tonicPc + base.offset, 12);
  const chord = createChord(rootPc, base.family, level);

  return {
    ...chord,
    id: `${base.id}-${level}`,
    degree: base.id,
    catalogIndex,
    fn: base.fn,
    brightness: base.brightness,
    tension: clamp(base.tension + level * 0.025),
  };
}

export function tonicFromPoint(point, columns = 24, rows = 16) {
  const column = Math.min(columns - 1, Math.floor(clamp(point.x) * columns));
  const row = Math.min(rows - 1, Math.floor(clamp(point.y) * rows));
  return mod(7 * column + 3 * row, 12);
}

export function tonicName(tonicPc) {
  return NOTE_NAMES[mod(tonicPc, 12)];
}

export function tilePitchClass(column, row) {
  return mod(7 * column + 3 * row, 12);
}

export function resampleGesture(points, step = 0.055, options = {}) {
  if (!points.length) return [];
  const includeEndpoint = typeof options === "boolean"
    ? options
    : options.includeEndpoint ?? true;
  if (points.length < 2) return [points[0]];

  const result = [points[0]];
  let previous = points[0];
  let carry = 0;

  for (let index = 1; index < points.length; index += 1) {
    const next = points[index];
    const dx = next.x - previous.x;
    const dy = next.y - previous.y;
    const segmentLength = Math.hypot(dx, dy);
    if (segmentLength === 0) continue;

    let cursor = step - carry;
    while (cursor <= segmentLength) {
      const ratio = cursor / segmentLength;
      result.push({
        x: previous.x + dx * ratio,
        y: previous.y + dy * ratio,
        direction: next.direction ?? 1,
        velocity: next.velocity ?? 0.5,
      });
      cursor += step;
    }

    carry = segmentLength - (cursor - step);
    previous = next;
  }

  const last = points[points.length - 1];
  const resultLast = result[result.length - 1];
  if (includeEndpoint) {
    if (Math.hypot(last.x - resultLast.x, last.y - resultLast.y) > 1e-7) {
      result.push(last);
    } else {
      result[result.length - 1] = last;
    }
  }

  return result;
}

function curvatureAt(points, index) {
  if (index === 0 || index === points.length - 1) return 0;
  const before = points[index - 1];
  const point = points[index];
  const after = points[index + 1];
  const firstAngle = Math.atan2(point.y - before.y, point.x - before.x);
  const secondAngle = Math.atan2(after.y - point.y, after.x - point.x);
  const delta = Math.atan2(Math.sin(secondAngle - firstAngle), Math.cos(secondAngle - firstAngle));
  return Math.min(1, Math.abs(delta) / Math.PI);
}

function trailingCurvatureAt(points, index) {
  if (index < 2) return 0;
  const before = points[index - 2];
  const previous = points[index - 1];
  const point = points[index];
  const firstAngle = Math.atan2(previous.y - before.y, previous.x - before.x);
  const secondAngle = Math.atan2(point.y - previous.y, point.x - previous.x);
  const delta = Math.atan2(Math.sin(secondAngle - firstAngle), Math.cos(secondAngle - firstAngle));
  return Math.min(1, Math.abs(delta) / Math.PI);
}

function complexityTarget(point) {
  const complexity = smoothstep(0.05, 0.95, 1 - point.y);
  return {
    complexity,
    level: Math.round(complexity * (COMPLEXITY_LEVELS.length - 1)),
  };
}

function targetAt(points, index) {
  const point = points[index];
  const phrasePosition = points.length === 1 ? 0 : index / (points.length - 1);
  const brightness = 2 * smoothstep(0.05, 0.95, point.x) - 1;
  const { complexity, level } = complexityTarget(point);
  const phraseTension = phrasePosition < 0.72
    ? smoothstep(0, 0.72, phrasePosition)
    : 1 - smoothstep(0.72, 1, phrasePosition);
  const tension = clamp(phraseTension + 0.15 * curvatureAt(points, index));

  return { brightness, complexity, level, tension };
}

function causalTargetAt(points, index) {
  const point = points[index];
  const brightness = 2 * smoothstep(0.05, 0.95, point.x) - 1;
  const { complexity, level } = complexityTarget(point);
  const phaseTension = [0.04, 0.42, 0.82, 0.18][index % 4];
  const tension = clamp(phaseTension + 0.15 * trailingCurvatureAt(points, index));
  return { brightness, complexity, level, tension };
}

function emissionCost(candidate, target) {
  if (candidate.level !== target.level) return Number.POSITIVE_INFINITY;
  return 2.8 * square(candidate.brightness - target.brightness)
    + 2 * square(candidate.complexity - target.complexity)
    + 1.6 * square(candidate.tension - target.tension);
}

function voiceLeadingCost(left, right) {
  const distances = left.pitchClasses.map((pitch) => (
    Math.min(...right.pitchClasses.map((nextPitch) => circularDistance(pitch, nextPitch)))
  ));
  return distances.reduce((sum, distance) => sum + distance, 0) / Math.max(1, distances.length * 6);
}

function transitionCost(left, right) {
  const rootMotion = mod(right.rootPc - left.rootPc, 12);
  const rootCost = rootMotion === 5 || rootMotion === 7
    ? 0
    : rootMotion === 2 || rootMotion === 10
      ? 0.08
      : rootMotion === 0
        ? 0.12
        : 0.2;
  const commonTones = left.pitchClasses.filter((pitch) => right.pitchClasses.includes(pitch)).length;
  const sameChordPenalty = left.id === right.id ? 0.38 : 0;

  return FUNCTION_COST[left.fn][right.fn]
    + rootCost
    + voiceLeadingCost(left, right)
    + sameChordPenalty
    - commonTones * 0.045;
}

const CATALOG_CACHE = new Map();

function getCandidateCatalog(tonicPc) {
  const normalizedTonic = mod(tonicPc, 12);
  if (CATALOG_CACHE.has(normalizedTonic)) return CATALOG_CACHE.get(normalizedTonic);

  const candidates = [];
  HARMONIC_BASES.forEach((base) => {
    COMPLEXITY_LEVELS.forEach((_, level) => {
      candidates.push(createCandidate(base, level, normalizedTonic, candidates.length));
    });
  });

  const byLevel = COMPLEXITY_LEVELS.map((_, level) => (
    candidates.filter((candidate) => candidate.level === level)
  ));
  const transitions = new Float64Array(candidates.length * candidates.length);
  candidates.forEach((left) => {
    candidates.forEach((right) => {
      transitions[left.catalogIndex * candidates.length + right.catalogIndex] = transitionCost(left, right);
    });
  });
  const catalog = { candidates, byLevel, transitions };
  CATALOG_CACHE.set(normalizedTonic, catalog);
  return catalog;
}

function transitionFromCatalog(catalog, left, right) {
  return catalog.transitions[left.catalogIndex * catalog.candidates.length + right.catalogIndex];
}

function reconstruct(backPointers, layers, finalIndex) {
  const result = new Array(backPointers.length);
  let cursor = finalIndex;

  for (let eventIndex = backPointers.length - 1; eventIndex >= 0; eventIndex -= 1) {
    result[eventIndex] = layers[eventIndex][cursor];
    cursor = backPointers[eventIndex][cursor];
  }

  return result;
}

function solveOpen(catalog, targets) {
  const layers = targets.map((target) => catalog.byLevel[target.level]);
  let costs = layers[0].map((candidate) => emissionCost(candidate, targets[0]));
  const backPointers = [new Int16Array(layers[0].length).fill(-1)];

  for (let eventIndex = 1; eventIndex < targets.length; eventIndex += 1) {
    const previousLayer = layers[eventIndex - 1];
    const nextLayer = layers[eventIndex];
    const nextCosts = new Array(nextLayer.length).fill(Number.POSITIVE_INFINITY);
    const previousIndices = new Int16Array(nextLayer.length).fill(-1);

    for (let nextIndex = 0; nextIndex < nextLayer.length; nextIndex += 1) {
      const nextCandidate = nextLayer[nextIndex];
      const emission = emissionCost(nextCandidate, targets[eventIndex]);

      for (let previousIndex = 0; previousIndex < previousLayer.length; previousIndex += 1) {
        const cost = costs[previousIndex]
          + transitionFromCatalog(catalog, previousLayer[previousIndex], nextCandidate)
          + emission;
        if (cost < nextCosts[nextIndex]) {
          nextCosts[nextIndex] = cost;
          previousIndices[nextIndex] = previousIndex;
        }
      }
    }

    costs = nextCosts;
    backPointers.push(previousIndices);
  }

  const finalIndex = costs.indexOf(Math.min(...costs));
  return reconstruct(backPointers, layers, finalIndex);
}

function solveClosed(catalog, targets) {
  const layers = targets.map((target) => catalog.byLevel[target.level]);
  const firstLayer = layers[0];
  let bestCost = Number.POSITIVE_INFINITY;
  let bestSequence = [];

  for (let firstIndex = 0; firstIndex < firstLayer.length; firstIndex += 1) {
    const firstCandidate = firstLayer[firstIndex];
    let costs = new Array(firstLayer.length).fill(Number.POSITIVE_INFINITY);
    costs[firstIndex] = emissionCost(firstCandidate, targets[0]);
    const backPointers = [new Int16Array(firstLayer.length).fill(-1)];

    for (let eventIndex = 1; eventIndex < targets.length; eventIndex += 1) {
      const previousLayer = layers[eventIndex - 1];
      const nextLayer = layers[eventIndex];
      const nextCosts = new Array(nextLayer.length).fill(Number.POSITIVE_INFINITY);
      const previousIndices = new Int16Array(nextLayer.length).fill(-1);

      for (let nextIndex = 0; nextIndex < nextLayer.length; nextIndex += 1) {
        const nextCandidate = nextLayer[nextIndex];
        const emission = emissionCost(nextCandidate, targets[eventIndex]);
        for (let previousIndex = 0; previousIndex < previousLayer.length; previousIndex += 1) {
          const cost = costs[previousIndex]
            + transitionFromCatalog(catalog, previousLayer[previousIndex], nextCandidate)
            + emission;
          if (cost < nextCosts[nextIndex]) {
            nextCosts[nextIndex] = cost;
            previousIndices[nextIndex] = previousIndex;
          }
        }
      }

      costs = nextCosts;
      backPointers.push(previousIndices);
    }

    let finalIndex = -1;
    let finalCost = Number.POSITIVE_INFINITY;
    const finalLayer = layers.at(-1);
    for (let candidateIndex = 0; candidateIndex < finalLayer.length; candidateIndex += 1) {
      const cost = costs[candidateIndex]
        + transitionFromCatalog(catalog, finalLayer[candidateIndex], firstCandidate);
      if (cost < finalCost) {
        finalCost = cost;
        finalIndex = candidateIndex;
      }
    }

    if (finalCost < bestCost) {
      bestCost = finalCost;
      bestSequence = reconstruct(backPointers, layers, finalIndex);
    }
  }

  return bestSequence;
}

export function solveGesture(points, tonicPc, closed = false) {
  if (!points.length) return [];
  const catalog = getCandidateCatalog(tonicPc);
  const targets = points.map((_, index) => targetAt(points, index));
  return closed
    ? solveClosed(catalog, targets)
    : solveOpen(catalog, targets);
}

export function solveCausalGesture(points, tonicPc, committedChords = []) {
  if (!points.length) return [];
  const catalog = getCandidateCatalog(tonicPc);
  const result = committedChords.slice(0, points.length);

  for (let index = result.length; index < points.length; index += 1) {
    const target = causalTargetAt(points, index);
    const candidates = catalog.byLevel[target.level];
    const previous = result.at(-1);
    let bestCandidate = candidates[0];
    let bestCost = Number.POSITIVE_INFINITY;

    candidates.forEach((candidate) => {
      const cost = emissionCost(candidate, target)
        + (previous ? transitionFromCatalog(catalog, previous, candidate) : 0);
      if (cost < bestCost) {
        bestCost = cost;
        bestCandidate = candidate;
      }
    });
    result.push(bestCandidate);
  }

  return result;
}

export function isLikelyLoop(points, threshold = 0.075) {
  if (points.length < 6) return false;
  const start = points[0];
  const end = points[points.length - 1];
  if (Math.hypot(start.x - end.x, start.y - end.y) > threshold) return false;
  const startNext = points[Math.min(2, points.length - 1)];
  const endPrevious = points[Math.max(0, points.length - 3)];
  const startAngle = Math.atan2(startNext.y - start.y, startNext.x - start.x);
  const endAngle = Math.atan2(end.y - endPrevious.y, end.x - endPrevious.x);
  const alignment = Math.cos(startAngle - endAngle);
  return alignment > -0.2;
}

function sampleChord(label, rootPc, family, level, x, y, durationBeats = 1) {
  const base = { id: label, offset: 0, family, fn: family === "dominant" ? "D" : "T", brightness: 0, tension: 0.4 };
  const chord = createCandidate(base, level, rootPc);
  return { ...chord, label, point: { x, y, direction: 1, durationBeats, velocity: 0.52 } };
}

const WISH_YOU_LOVE_CHORDS = {
  Cmaj7: [0, "major", 3, 0.76, 0.39],
  D7: [2, "dominant", 2, 0.6, 0.52],
  Gmaj7: [7, "major", 3, 0.86, 0.37],
  Em7: [4, "minor", 3, 0.32, 0.4],
  G7: [7, "dominant", 2, 0.55, 0.52],
  B7: [11, "dominant", 2, 0.5, 0.52],
  E7: [4, "dominant", 2, 0.57, 0.52],
  Am7: [9, "minor", 3, 0.27, 0.4],
};

const WISH_YOU_LOVE_SEQUENCE = [
  "Cmaj7", "D7", "Gmaj7", "Em7", "Cmaj7", "D7", "Gmaj7", "G7",
  "Cmaj7", "B7", "Gmaj7", "E7", "Cmaj7", "E7", "Am7", "D7",
  "Cmaj7", "D7", "Gmaj7", "Em7", "Cmaj7", "D7", "Gmaj7", "G7",
  "Cmaj7", "D7", "Gmaj7",
];

const WISH_YOU_LOVE_SECTIONS = [
  { id: "verse", label: "Verse", startIndex: 0, endIndex: 7 },
  { id: "bridge", label: "Bridge", startIndex: 8, endIndex: 15 },
  { id: "final-verse", label: "Final verse", startIndex: 16, endIndex: 26 },
];

const WISH_YOU_LOVE_BRUSH = [
  { beatOffset: 0, direction: 1, velocity: 0.52 },
  { beatOffset: 0.75, direction: -1, velocity: 0.34 },
  { beatOffset: 1.25, direction: 1, velocity: 0.43 },
  { beatOffset: 1.75, direction: -1, velocity: 0.31 },
];

function wishYouLoveChord(label, index) {
  const [rootPc, family, level, x, y] = WISH_YOU_LOVE_CHORDS[label];
  const durationBeats = index === WISH_YOU_LOVE_SEQUENCE.length - 1 ? 4 : 2;
  const chord = sampleChord(label, rootPc, family, level, x, y, durationBeats);
  const strums = durationBeats === 4
    ? [
      ...WISH_YOU_LOVE_BRUSH,
      ...WISH_YOU_LOVE_BRUSH.map((stroke) => ({ ...stroke, beatOffset: stroke.beatOffset + 2 })),
    ]
    : WISH_YOU_LOVE_BRUSH;
  return { ...chord, strums };
}

export const SAMPLE_LINES = [
  {
    id: "wish-you-love-study",
    title: "I Wish You Love",
    artist: "Laufey study",
    referenceArtist: "Michael Bublé",
    note: "Gentle bossa-style brush using the linked Michael Bublé G-shape chart, capo 6.",
    sourceName: "Hợp Âm Chuẩn",
    sourceUrl: "https://hopamchuan.com/song/35157/i-wish-you-love/",
    capo: 6,
    closed: false,
    tonicPc: 7,
    sections: WISH_YOU_LOVE_SECTIONS,
    chords: WISH_YOU_LOVE_SEQUENCE.map(wishYouLoveChord),
  },
  {
    id: "ii-v-i-loop",
    title: "ii V I study",
    artist: "harmonic loop",
    note: "closed turnaround",
    closed: true,
    tonicPc: 0,
    chords: [
      sampleChord("Dm7", 2, "minor", 3, 0.38, 0.33),
      sampleChord("G9", 7, "dominant", 3, 0.65, 0.28),
      sampleChord("Cmaj9", 0, "major", 4, 0.82, 0.21, 2),
      sampleChord("A7", 9, "dominant", 2, 0.6, 0.52),
      sampleChord("Dm7", 2, "minor", 3, 0.38, 0.33),
    ],
  },
  {
    id: "blue-hour-loop",
    title: "Blue hour",
    artist: "four-chord loop",
    note: "closed modal loop",
    closed: true,
    tonicPc: 4,
    chords: [
      sampleChord("Em9", 4, "minor", 4, 0.25, 0.2, 2),
      sampleChord("Cmaj7", 0, "major", 3, 0.72, 0.34, 2),
      sampleChord("G6", 7, "major", 1, 0.82, 0.64, 2),
      sampleChord("Dsus4", 2, "sus", 1, 0.52, 0.58, 2),
      sampleChord("Em9", 4, "minor", 4, 0.25, 0.2, 4),
    ],
  },
];

export function pathFromSample(sample) {
  return {
    id: sample.id,
    title: sample.title,
    creator: sample.artist,
    note: sample.note,
    referenceArtist: sample.referenceArtist,
    sections: sample.sections ?? [],
    sourceName: sample.sourceName,
    sourceUrl: sample.sourceUrl,
    capo: sample.capo,
    tonicPc: sample.tonicPc,
    closed: sample.closed,
    points: sample.chords.map((chord) => chord.point),
    events: sample.chords.map((chord) => ({ point: chord.point, chord, strums: chord.strums })),
    source: "sample",
  };
}
