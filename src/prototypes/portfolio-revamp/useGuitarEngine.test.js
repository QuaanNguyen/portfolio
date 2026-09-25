import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import { createChord } from "./musicModel.js";
import {
  LOGO_HOLD_SECONDS,
  LOGO_RESOLVE_SECONDS,
  LOGO_STRING_DELAYS,
  LOGO_STRING_INTERVAL_SECONDS,
} from "./logoTiming.js";
import {
  createPhysicalSampleIndex,
  eventStrums,
  GUITAR_STRINGS,
  LOGO_G_MINOR_VOICING,
  resolvePhysicalRecording,
  selectPlayableVoicing,
  STRUM_STRING_INTERVAL_SECONDS,
  transportEndTime,
  tuningCorrectedPlaybackRate,
} from "./useGuitarEngine.js";

test("logo signature uses the requested G minor shape", () => {
  assert.deepEqual(
    LOGO_G_MINOR_VOICING.map((midi, index) => midi - GUITAR_STRINGS[index]),
    [3, 5, 5, 3, 3, 3],
  );
  assert.deepEqual(
    [...new Set(LOGO_G_MINOR_VOICING.map((midi) => midi % 12))].sort((left, right) => left - right),
    [2, 7, 10],
  );
});

test("every acoustic strum uses a fixed natural string interval", () => {
  assert.equal(STRUM_STRING_INTERVAL_SECONDS, 0.021);
  assert.ok(Math.abs(STRUM_STRING_INTERVAL_SECONDS * 5 - 0.105) < 1e-9);
  assert.equal(LOGO_STRING_INTERVAL_SECONDS, STRUM_STRING_INTERVAL_SECONDS);
  assert.equal(LOGO_STRING_DELAYS.length, 6);
  assert.ok(Math.abs(LOGO_RESOLVE_SECONDS - LOGO_HOLD_SECONDS) < 1e-9);
});

test("generated chord voicings stay on playable strings and within a four-fret span", () => {
  let previous = null;
  const families = ["major", "minor", "dominant", "halfDim", "sus"];

  families.forEach((family) => {
    for (let level = 0; level < 6; level += 1) {
      const chord = createChord(7, family, level);
      const voicing = selectPlayableVoicing(chord, previous);
      const frets = [];
      const pitchClasses = new Set();
      let sounding = 0;

      voicing.forEach((midi, index) => {
        if (midi === null) return;
        sounding += 1;
        const fret = midi - GUITAR_STRINGS[index];
        assert.ok(fret >= 0 && fret <= 12);
        assert.ok(chord.pitchClasses.includes(midi % 12));
        pitchClasses.add(midi % 12);
        if (fret > 0) frets.push(fret);
      });

      assert.ok(sounding >= 4);
      assert.ok(pitchClasses.has(chord.rootPc));
      assert.ok(Math.max(...frets) - Math.min(...frets) <= 4);
      previous = voicing;
    }
  });
});

test("physical-string bank covers frets zero through twelve on every string", async () => {
  const manifestUrl = new URL("../../../public/audio/guitar-physical/manifest.json", import.meta.url);
  const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));

  assert.equal(manifest.samples.length, 156);
  assert.equal(manifest.alternateCount, 2);
  assert.match(manifest.source, /physical-string recordings/);
  assert.match(manifest.permissionUrl, /^https:\/\//);

  for (let stringIndex = 0; stringIndex < GUITAR_STRINGS.length; stringIndex += 1) {
    const samples = manifest.samples.filter((sample) => sample.stringIndex === stringIndex);
    assert.equal(samples.length, 26);
    for (let fret = 0; fret <= 12; fret += 1) {
      const alternates = samples.filter((sample) => sample.fret === fret);
      assert.deepEqual(alternates.map((sample) => sample.alternateIndex), [0, 1]);
      assert.deepEqual(alternates.map((sample) => sample.dynamic), ["mf", "ff"]);
    }
    for (const sample of samples) {
      assert.equal(sample.midi, GUITAR_STRINGS[stringIndex] + sample.fret);
      assert.ok(Number.isFinite(sample.validationCents));
      assert.ok(sample.validationCents >= -90 && sample.validationCents <= 90);
      assert.ok(sample.gainCompensation >= 10 ** (-18 / 20));
      assert.ok(sample.gainCompensation <= 10 ** (12 / 20) + 0.0001);
      assert.ok(sample.durationSeconds >= 3 && sample.durationSeconds <= 3.4);
      assert.match(sample.sha256, /^[a-f0-9]{64}$/);
      await access(new URL(`../../../public/audio/guitar-physical/${sample.file}`, import.meta.url));
    }
  }
});

test("physical recording alternates are exact and deterministic", async () => {
  const manifestUrl = new URL("../../../public/audio/guitar-physical/manifest.json", import.meta.url);
  const raw = JSON.parse(await readFile(manifestUrl, "utf8"));
  const manifest = { ...raw, mode: "test", sampleIndex: createPhysicalSampleIndex(raw.samples) };
  const reversed = {
    ...raw,
    mode: "test",
    sampleIndex: createPhysicalSampleIndex([...raw.samples].reverse()),
  };

  for (let stringIndex = 0; stringIndex < GUITAR_STRINGS.length; stringIndex += 1) {
    for (let fret = 0; fret <= 12; fret += 1) {
      const midi = GUITAR_STRINGS[stringIndex] + fret;
      const first = resolvePhysicalRecording(manifest, stringIndex, midi, 0);
      const second = resolvePhysicalRecording(manifest, stringIndex, midi, 1);
      const third = resolvePhysicalRecording(manifest, stringIndex, midi, 2);
      assert.notEqual(first.url, second.url);
      assert.equal(first.url, third.url);
      assert.equal(first.url, resolvePhysicalRecording(reversed, stringIndex, midi, 0).url);
      assert.equal(first.fret, fret);
      assert.equal(second.fret, fret);
    }
  }
});

test("recorded tuning cents are corrected in playback rate", () => {
  const flat = { midi: 60, validationCents: -40 };
  const sharp = { midi: 60, validationCents: 20 };
  assert.ok(Math.abs(tuningCorrectedPlaybackRate(flat, 60) - 2 ** (40 / 1200)) < 1e-12);
  assert.ok(Math.abs(tuningCorrectedPlaybackRate(sharp, 60) - 2 ** (-20 / 1200)) < 1e-12);
});

test("beat-level strums sort deterministically inside the chord", () => {
  const strokes = eventStrums({
    durationBeats: 2,
    strums: [
      { beatOffset: 1.5, direction: -1, velocity: 0.4 },
      { beatOffset: 0, direction: 1, velocity: 0.62 },
      { beatOffset: 0.5, direction: -1, velocity: 0.48 },
      { beatOffset: 2, direction: 1, velocity: 0.9 },
    ],
  });
  assert.deepEqual(strokes.map((stroke) => stroke.beatOffset), [0, 0.5, 1.5]);
  assert.deepEqual(strokes.map((stroke) => stroke.direction), [1, -1, -1]);
});

test("transport follows the later of score time and audible decay", () => {
  assert.equal(transportEndTime(20, [{ endTime: 18 }, { endTime: 21.4 }]), 21.4);
  assert.equal(transportEndTime(20, [{ endTime: 18 }, { endTime: 19.2 }]), 20);
});
