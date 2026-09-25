import assert from "node:assert/strict";
import test from "node:test";
import {
  createChord,
  pathFromSample,
  resampleGesture,
  SAMPLE_LINES,
  solveCausalGesture,
  solveGesture,
} from "./musicModel.js";

const chordCases = {
  major: [
    ["G", [0, 4, 7]],
    ["G6", [0, 4, 7, 9]],
    ["Gadd9", [0, 2, 4, 7]],
    ["Gmaj7", [0, 4, 7, 11]],
    ["Gmaj9", [0, 2, 4, 7, 11]],
    ["G6/9", [0, 2, 4, 7, 9]],
  ],
  minor: [
    ["Gm", [0, 3, 7]],
    ["Gm6", [0, 3, 7, 9]],
    ["Gm(add9)", [0, 2, 3, 7]],
    ["Gm7", [0, 3, 7, 10]],
    ["Gm9", [0, 2, 3, 7, 10]],
    ["Gm11", [0, 2, 3, 5, 7, 10]],
  ],
  dominant: [
    ["G", [0, 4, 7]],
    ["Gsus4", [0, 5, 7]],
    ["G7", [0, 4, 7, 10]],
    ["G9", [0, 2, 4, 7, 10]],
    ["G13", [0, 2, 4, 7, 9, 10]],
    ["G7(♭9,♯9)", [0, 1, 3, 4, 7, 10]],
  ],
  halfDim: [
    ["Gdim", [0, 3, 6]],
    ["Gm7♭5", [0, 3, 6, 10]],
    ["Gm9♭5", [0, 2, 3, 6, 10]],
    ["Gm11♭5", [0, 2, 3, 5, 6, 10]],
    ["Gm11♭5(add13)", [0, 2, 3, 5, 6, 9, 10]],
    ["Gm11♭5(♭13)", [0, 2, 3, 5, 6, 8, 10]],
  ],
  sus: [
    ["Gsus2", [0, 2, 7]],
    ["Gsus4", [0, 5, 7]],
    ["Gsus2/add4", [0, 2, 5, 7]],
    ["G7sus4", [0, 5, 7, 10]],
    ["G9sus4", [0, 2, 5, 7, 10]],
    ["G13sus4", [0, 2, 5, 7, 9, 10]],
  ],
};

test("chord labels describe their pitch classes", () => {
  Object.entries(chordCases).forEach(([family, cases]) => {
    cases.forEach(([label, expectedIntervals], level) => {
      const chord = createChord(7, family, level);
      const relativePitchClasses = chord.pitchClasses
        .map((pitch) => (pitch - chord.rootPc + 12) % 12)
        .sort((left, right) => left - right);
      assert.equal(chord.label, label);
      assert.deepEqual(relativePitchClasses, expectedIntervals);
    });
  });
});

test("sample labels and pitches stay aligned", () => {
  SAMPLE_LINES.forEach((sample) => {
    sample.chords.forEach((chord) => {
      assert.equal(chord.label, `${chord.rootName}${chord.suffix}`);
    });
  });
  const blueHour = SAMPLE_LINES.find((sample) => sample.id === "blue-hour-loop");
  const suspended = blueHour.chords.find((chord) => chord.label === "Dsus4");
  assert.deepEqual([...suspended.pitchClasses].sort((left, right) => left - right), [2, 7, 9]);
});

test("I Wish You Love matches the linked G-shape reference", () => {
  const sample = SAMPLE_LINES.find((entry) => entry.id === "wish-you-love-study");
  const expectedLabels = [
    "Cmaj7", "D7", "Gmaj7", "Em7", "Cmaj7", "D7", "Gmaj7", "G7",
    "Cmaj7", "B7", "Gmaj7", "E7", "Cmaj7", "E7", "Am7", "D7",
    "Cmaj7", "D7", "Gmaj7", "Em7", "Cmaj7", "D7", "Gmaj7", "G7",
    "Cmaj7", "D7", "Gmaj7",
  ];

  assert.equal(sample.artist, "Laufey study");
  assert.equal(sample.referenceArtist, "Michael Bublé");
  assert.equal(sample.sourceName, "Hợp Âm Chuẩn");
  assert.equal(sample.sourceUrl, "https://hopamchuan.com/song/35157/i-wish-you-love/");
  assert.equal(sample.capo, 6);
  assert.equal(sample.tonicPc, 7);
  assert.equal(sample.closed, false);
  assert.deepEqual(sample.chords.map((chord) => chord.label), expectedLabels);
  assert.deepEqual(sample.chords.map((chord) => chord.point.durationBeats), [
    ...Array(26).fill(2),
    4,
  ]);
  assert.deepEqual(sample.chords.slice(0, -1).map((chord) => chord.strums.length), Array(26).fill(4));
  assert.equal(sample.chords.at(-1).strums.length, 8);
  sample.chords.forEach((chord) => {
    assert.ok(chord.strums.every((stroke) => stroke.beatOffset < chord.point.durationBeats));
    assert.deepEqual(chord.strums.slice(0, 4).map((stroke) => stroke.direction), [1, -1, 1, -1]);
  });
  assert.deepEqual(sample.sections, [
    { id: "verse", label: "Verse", startIndex: 0, endIndex: 7 },
    { id: "bridge", label: "Bridge", startIndex: 8, endIndex: 15 },
    { id: "final-verse", label: "Final verse", startIndex: 16, endIndex: 26 },
  ]);

  const path = pathFromSample(sample);
  assert.deepEqual(path.sections, sample.sections);
  assert.equal(path.sourceName, sample.sourceName);
  assert.equal(path.sourceUrl, sample.sourceUrl);
  assert.equal(path.referenceArtist, sample.referenceArtist);
  assert.equal(path.capo, sample.capo);
  assert.deepEqual(path.events[0].strums, sample.chords[0].strums);
});

test("sample timing is expressed only in beats", () => {
  SAMPLE_LINES.forEach((sample) => {
    sample.chords.forEach((chord) => {
      assert.equal(Number.isFinite(chord.point.durationBeats), true);
      assert.equal(chord.point.durationBeats > 0, true);
      assert.equal("durationMs" in chord.point, false);
      assert.equal("durationSeconds" in chord.point, false);
    });
  });
});

test("vertical position strictly selects harmonic complexity", () => {
  const xs = [0.1, 0.26, 0.42, 0.58, 0.74, 0.9];
  const rows = [
    [0.98, 0],
    [0.5, 3],
    [0.02, 5],
  ];
  rows.forEach(([y, expectedLevel]) => {
    const points = xs.map((x) => ({ x, y }));
    assert.deepEqual(
      solveGesture(points, 0).map((chord) => chord.level),
      points.map(() => expectedLevel),
    );
  });
});

test("causal solving keeps every emitted prefix stable", () => {
  const points = [
    { x: 0.1, y: 0.55 },
    { x: 0.4, y: 0.25 },
    { x: 0.7, y: 0.25 },
    { x: 0.1, y: 0.9 },
    { x: 0.1, y: 0.25 },
    { x: 0.4, y: 0.55 },
  ];
  const full = solveCausalGesture(points, 5).map((chord) => chord.id);
  let committed = [];

  points.forEach((_, index) => {
    const before = [...committed];
    const next = solveCausalGesture(points.slice(0, index + 1), 5, committed);
    assert.deepEqual(committed, before);
    assert.deepEqual(next.slice(0, committed.length), committed);
    committed = next;
  });

  assert.deepEqual(committed.map((chord) => chord.id), full);
});

test("live resampling commits stable steps and finalization preserves the endpoint", () => {
  const step = 0.055;
  const start = { x: 0, y: 0 };
  const p30 = { x: 0.03, y: 0 };
  const p55 = { x: 0.055, y: 0 };
  const p80 = { x: 0.08, y: 0 };

  assert.deepEqual(resampleGesture([start, p30], step, { includeEndpoint: false }), [start]);
  const at55 = resampleGesture([start, p30, p55], step, { includeEndpoint: false });
  assert.equal(at55.at(-1).x, 0.055);
  const at80 = resampleGesture([start, p30, p55, p80], step, { includeEndpoint: false });
  assert.deepEqual(at80.slice(0, at55.length), at55);
  const finalized = resampleGesture([start, p30, p55, p80], step, { includeEndpoint: true });
  assert.strictEqual(finalized.at(-1), p80);
  assert.deepEqual(resampleGesture([start, p30], step), [start, p30]);

  const longEnd = { x: 1, y: 0 };
  const longFinalized = resampleGesture([start, longEnd], step);
  assert.strictEqual(longFinalized.at(-1), longEnd);
  assert.ok(longFinalized.length > 18);
});
