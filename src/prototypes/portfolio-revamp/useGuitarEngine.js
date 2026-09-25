import { useCallback, useEffect, useRef, useState } from "react";
import {
  LOGO_RESOLVE_PAUSE_SECONDS,
  LOGO_STRING_INTERVAL_SECONDS,
  LOGO_STRING_START_SECONDS,
} from "./logoTiming.js";

export const GUITAR_STRINGS = [40, 45, 50, 55, 59, 64];
export const STRUM_STRING_INTERVAL_SECONDS = 0.021;
export const LOGO_G_MINOR_VOICING = [43, 50, 55, 58, 62, 67];

const MAX_FRET = 12;
const MAX_FRET_SPAN = 4;
const MAX_SAMPLE_CACHE_SIZE = 72;
const SHAPE_CACHE = new Map();
const SAMPLE_MANIFEST_URL = "/audio/guitar-physical/manifest.json";

let manifestPromise;

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
const mod = (value, divisor) => ((value % divisor) + divisor) % divisor;

function requiredPitchClasses(chord) {
  const required = new Set([chord.rootPc]);
  const relative = (interval) => mod(chord.rootPc + interval, 12);

  if (chord.family === "major" || chord.family === "dominant") {
    if (chord.pitchClasses.includes(relative(4))) required.add(relative(4));
  } else if (chord.family === "minor" || chord.family === "halfDim") {
    required.add(relative(3));
  } else if (chord.family === "sus") {
    required.add(chord.pitchClasses.includes(relative(5)) ? relative(5) : relative(2));
  }

  if (chord.pitchClasses.includes(relative(10))) required.add(relative(10));
  if (chord.pitchClasses.includes(relative(11))) required.add(relative(11));
  return [...required];
}

function shapeKey(chord) {
  return `${chord.rootPc}:${chord.family}:${chord.level ?? "x"}:${chord.pitchClasses.join(",")}`;
}

function generatePlayableShapes(chord) {
  const key = shapeKey(chord);
  if (SHAPE_CACHE.has(key)) return SHAPE_CACHE.get(key);

  const shapes = new Map();
  for (let windowStart = 1; windowStart <= MAX_FRET - MAX_FRET_SPAN; windowStart += 1) {
    const windowEnd = windowStart + MAX_FRET_SPAN;
    const options = GUITAR_STRINGS.map((openMidi) => {
      const notes = [null];
      for (let fret = 0; fret <= MAX_FRET; fret += 1) {
        const inWindow = fret === 0 || (fret >= windowStart && fret <= windowEnd);
        if (inWindow && chord.pitchClasses.includes(mod(openMidi + fret, 12))) {
          notes.push(openMidi + fret);
        }
      }
      return notes;
    });

    const visit = (stringIndex, current) => {
      if (stringIndex === GUITAR_STRINGS.length) {
        const sounding = current.filter((midi) => midi !== null);
        if (sounding.length < 4) return;
        const frets = current
          .map((midi, index) => midi === null ? null : midi - GUITAR_STRINGS[index])
          .filter((fret) => fret > 0);
        if (frets.length && Math.max(...frets) - Math.min(...frets) > MAX_FRET_SPAN) return;
        for (let index = 1; index < current.length; index += 1) {
          const previous = current[index - 1];
          const next = current[index];
          if (previous !== null && next !== null && previous > next + 2) return;
        }
        shapes.set(current.map((midi) => midi ?? "x").join("-"), [...current]);
        return;
      }

      options[stringIndex].forEach((midi) => {
        current.push(midi);
        visit(stringIndex + 1, current);
        current.pop();
      });
    };

    visit(0, []);
  }

  const result = [...shapes.values()];
  SHAPE_CACHE.set(key, result);
  return result;
}

function scoreShape(shape, chord, previousVoicing) {
  const sounding = shape.filter((midi) => midi !== null);
  const pitchClasses = new Set(sounding.map((midi) => mod(midi, 12)));
  const required = requiredPitchClasses(chord);
  const missingRequired = required.filter((pitch) => !pitchClasses.has(pitch)).length;
  const missingColor = chord.pitchClasses.filter((pitch) => !pitchClasses.has(pitch)).length;
  const firstMidi = shape.find((midi) => midi !== null);
  const frets = shape
    .map((midi, index) => midi === null ? null : midi - GUITAR_STRINGS[index])
    .filter((fret) => fret > 0);
  const uniqueFrets = new Set(frets).size;
  const span = frets.length ? Math.max(...frets) - Math.min(...frets) : 0;
  const averageFret = frets.length ? frets.reduce((sum, fret) => sum + fret, 0) / frets.length : 0;
  const duplicateCount = sounding.length - pitchClasses.size;
  const openCount = shape.reduce((count, midi, index) => count + (midi === GUITAR_STRINGS[index] ? 1 : 0), 0);
  let movement = 0;

  if (previousVoicing) {
    shape.forEach((midi, index) => {
      const previous = previousVoicing[index];
      if (midi === null || previous === null || previous === undefined) {
        if (midi !== previous) movement += 1.8;
      } else {
        movement += Math.abs(midi - previous) * 0.32;
      }
    });
  }

  return missingRequired * 24
    + missingColor * 3.6
    + Math.abs(5 - sounding.length) * 0.7
    + duplicateCount * 0.22
    + span * 0.18
    + Math.max(0, uniqueFrets - 3) * 3.4
    + Math.max(0, frets.length - 4) * 0.75
    + averageFret * 0.07
    + movement
    - openCount * 0.12
    - (mod(firstMidi, 12) === chord.rootPc ? 3.2 : 0);
}

export function selectPlayableVoicing(chord, previousVoicing = null) {
  const shapes = generatePlayableShapes(chord);
  if (!shapes.length) {
    return GUITAR_STRINGS.map((openMidi) => {
      for (let fret = 0; fret <= MAX_FRET; fret += 1) {
        const midi = openMidi + fret;
        if (chord.pitchClasses.includes(mod(midi, 12))) return midi;
      }
      return null;
    });
  }

  return shapes.reduce((best, shape) => {
    const score = scoreShape(shape, chord, previousVoicing);
    return score < best.score ? { shape, score } : best;
  }, { shape: shapes[0], score: Number.POSITIVE_INFINITY }).shape;
}

export function createPhysicalSampleIndex(samples) {
  const index = new Map();
  samples.forEach((sample) => {
    const key = `${sample.stringIndex}:${sample.fret}`;
    const entries = index.get(key) ?? [];
    entries.push(sample);
    index.set(key, entries);
  });
  index.forEach((entries) => entries.sort((left, right) => (
    (left.alternateIndex ?? 0) - (right.alternateIndex ?? 0)
      || (left.dynamic ?? "").localeCompare(right.dynamic ?? "")
      || left.file.localeCompare(right.file)
  )));
  return index;
}

export function tuningCorrectedPlaybackRate(sample, midi) {
  const cents = clamp(Number(sample.validationCents) || 0, -90, 90);
  return 2 ** ((midi - sample.midi) / 12 - cents / 1200);
}

export function resolvePhysicalRecording(manifest, stringIndex, midi, occurrence = 0) {
  const fret = midi - GUITAR_STRINGS[stringIndex];
  if (!Number.isInteger(fret) || fret < 0 || fret > MAX_FRET) {
    throw new Error(`Guitar note ${midi} is outside string ${stringIndex} fret coverage`);
  }
  const candidates = manifest.sampleIndex.get(`${stringIndex}:${fret}`) ?? [];
  if (!candidates.length) throw new Error(`Missing physical guitar sample for string ${stringIndex}, fret ${fret}`);
  const phase = mod(stringIndex * 13 + fret, candidates.length);
  const sample = candidates[mod(phase + occurrence, candidates.length)];
  const url = sample.file.startsWith("/") ? sample.file : `/audio/guitar-physical/${sample.file}`;
  return {
    sourceMidi: sample.midi,
    url,
    playbackRate: tuningCorrectedPlaybackRate(sample, midi),
    gainCompensation: clamp(Number(sample.gainCompensation) || 1, 0.1, 4),
    durationSeconds: clamp(Number(sample.durationSeconds) || 3.4, 0.1, 4),
    mode: manifest.mode,
    stringIndex,
    fret,
    alternateIndex: sample.alternateIndex ?? 0,
    dynamic: sample.dynamic,
  };
}

function validateManifest(manifest) {
  if (!Array.isArray(manifest.samples)) throw new Error("Guitar sample manifest has no samples");
  const sampleIndex = createPhysicalSampleIndex(manifest.samples);
  for (let stringIndex = 0; stringIndex < GUITAR_STRINGS.length; stringIndex += 1) {
    for (let fret = 0; fret <= MAX_FRET; fret += 1) {
      const candidates = sampleIndex.get(`${stringIndex}:${fret}`) ?? [];
      if (candidates.length < 2) {
        throw new Error(`Guitar manifest is incomplete at string ${stringIndex}, fret ${fret}`);
      }
    }
  }
  return {
    ...manifest,
    sampleIndex,
    mode: `${manifest.alternateCount ?? 2}-take recorded physical strings`,
  };
}

async function loadManifest() {
  if (!manifestPromise) {
    manifestPromise = fetch(SAMPLE_MANIFEST_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`Guitar sample manifest returned ${response.status}`);
        return response.json();
      })
      .then(validateManifest)
      .catch((error) => {
        manifestPromise = null;
        throw error;
      });
  }
  return manifestPromise;
}

function createAudioGraph(context) {
  const input = context.createGain();
  const highpass = context.createBiquadFilter();
  highpass.type = "highpass";
  highpass.frequency.value = 58;
  highpass.Q.value = 0.55;

  const warmth = context.createBiquadFilter();
  warmth.type = "peaking";
  warmth.frequency.value = 210;
  warmth.Q.value = 0.8;
  warmth.gain.value = 1.4;

  const air = context.createBiquadFilter();
  air.type = "lowpass";
  air.frequency.value = 9400;
  air.Q.value = 0.2;

  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -10;
  compressor.knee.value = 12;
  compressor.ratio.value = 2.2;
  compressor.attack.value = 0.004;
  compressor.release.value = 0.24;

  const master = context.createGain();
  master.gain.value = 0.74;

  input.connect(highpass);
  highpass.connect(warmth);
  warmth.connect(air);
  air.connect(compressor);
  compressor.connect(master);
  master.connect(context.destination);

  return { input, master };
}

async function loadRecording(context, recording, cache) {
  if (cache.has(recording.url)) {
    const cached = cache.get(recording.url);
    cache.delete(recording.url);
    cache.set(recording.url, cached);
    return cached;
  }
  if (cache.size >= MAX_SAMPLE_CACHE_SIZE) cache.delete(cache.keys().next().value);
  const promise = fetch(recording.url)
    .then((response) => {
      if (!response.ok) throw new Error(`Guitar sample returned ${response.status}`);
      return response.arrayBuffer();
    })
    .then((data) => context.decodeAudioData(data));
  cache.set(recording.url, promise);
  try {
    return await promise;
  } catch (error) {
    if (cache.get(recording.url) === promise) cache.delete(recording.url);
    throw error;
  }
}

async function prepareVoicings(context, voicings, occurrences, manifest, cache) {
  const recordings = voicings.map((voicing, voicingIndex) => voicing.map((midi, stringIndex) => (
    midi === null ? null : resolvePhysicalRecording(
      manifest,
      stringIndex,
      midi,
      occurrences[voicingIndex] ?? 0,
    )
  )));
  const unique = new Map();
  recordings.flat().filter(Boolean).forEach((recording) => unique.set(recording.url, recording));
  const buffers = new Map(await Promise.all([...unique.values()].map(async (recording) => (
    [recording.url, await loadRecording(context, recording, cache)]
  ))));
  return { recordings, buffers };
}

function scheduleRelease(voice, when, duration = 0.055) {
  if (!voice) return;
  voice.endTime = Math.min(voice.endTime, when + duration + 0.04);
  voice.gain.gain.cancelScheduledValues(when);
  voice.gain.gain.setValueAtTime(Math.max(0.0001, voice.amplitude), when);
  voice.gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  try {
    voice.source.stop(when + duration + 0.04);
  } catch {
    return;
  }
}

function releaseNow(context, voice, duration = 0.1) {
  if (!context || !voice) return;
  const when = context.currentTime;
  voice.gain.gain.cancelScheduledValues(when);
  voice.gain.gain.setValueAtTime(Math.max(0.0001, voice.gain.gain.value), when);
  voice.gain.gain.exponentialRampToValueAtTime(0.0001, when + duration);
  try {
    voice.source.stop(when + duration + 0.04);
  } catch {
    return;
  }
}

function scheduleRecordedNote(context, destination, buffer, recording, stringIndex, when, velocity) {
  const source = context.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.value = recording.playbackRate;

  const gain = context.createGain();
  const stringBalance = [1.02, 1, 0.98, 0.96, 0.91, 0.87][stringIndex];
  const amplitude = (0.095 + clamp(velocity) * 0.09)
    * stringBalance
    * recording.gainCompensation;
  gain.gain.setValueAtTime(0.0001, when);
  gain.gain.exponentialRampToValueAtTime(amplitude, when + 0.004);

  const panner = context.createStereoPanner ? context.createStereoPanner() : null;
  if (panner) panner.pan.value = -0.1 + stringIndex * 0.04;
  source.connect(gain);
  if (panner) {
    gain.connect(panner);
    panner.connect(destination);
  } else {
    gain.connect(destination);
  }
  source.start(when);
  const contentDuration = Math.min(buffer.duration, recording.durationSeconds) / recording.playbackRate;
  return { source, gain, amplitude, stringIndex, endTime: when + contentDuration };
}

function scheduleStrumAt(
  context,
  destination,
  voicing,
  recordings,
  buffers,
  when,
  options,
  activeByString,
) {
  const direction = options.direction === -1 ? -1 : 1;
  const velocity = clamp(options.velocity ?? 0.55);
  const strings = voicing
    .map((midi, stringIndex) => ({ midi, stringIndex }))
    .filter(({ midi }) => midi !== null);
  if (direction === -1) strings.reverse();
  const sounding = new Set(strings.map(({ stringIndex }) => stringIndex));

  activeByString.forEach((voice, stringIndex) => {
    if (voice && !sounding.has(stringIndex)) {
      scheduleRelease(voice, when, 0.06);
      activeByString[stringIndex] = null;
    }
  });

  const voices = [];
  strings.forEach(({ stringIndex }, orderIndex) => {
    const noteTime = when + orderIndex * STRUM_STRING_INTERVAL_SECONDS;
    if (activeByString[stringIndex]) scheduleRelease(activeByString[stringIndex], noteTime, 0.055);
    const recording = recordings[stringIndex];
    const buffer = buffers.get(recording.url);
    const stringVelocity = clamp(velocity * (0.91 + orderIndex * 0.025));
    const voice = scheduleRecordedNote(
      context,
      destination,
      buffer,
      recording,
      stringIndex,
      noteTime,
      stringVelocity,
    );
    activeByString[stringIndex] = voice;
    voices.push(voice);
  });

  return voices;
}

function eventDuration(event, bpm) {
  const beats = event.durationBeats ?? event.point?.durationBeats ?? 1;
  return Math.max(0.25, beats) * 60 / clamp(bpm, 40, 160);
}

export function eventStrums(event, fallbackDirection = 1, fallbackVelocity = 0.55) {
  const durationBeats = Math.max(0.25, event.durationBeats ?? event.point?.durationBeats ?? 1);
  const source = event.strums?.length ? event.strums : [{
    beatOffset: 0,
    direction: event.point?.direction ?? fallbackDirection,
    velocity: event.point?.velocity ?? fallbackVelocity,
  }];
  return source
    .map((stroke, index) => ({
      beatOffset: Math.max(0, Number(stroke.beatOffset) || 0),
      direction: stroke.direction === -1 ? -1 : 1,
      velocity: clamp(Number(stroke.velocity) || fallbackVelocity),
      index,
    }))
    .filter((stroke) => stroke.beatOffset < durationBeats)
    .sort((left, right) => left.beatOffset - right.beatOffset || left.index - right.index);
}

export function transportEndTime(scoreEnd, voices) {
  return voices.reduce((end, voice) => Math.max(end, voice.endTime), scoreEnd);
}

export default function useGuitarEngine() {
  const contextRef = useRef(null);
  const graphRef = useRef(null);
  const sampleCacheRef = useRef(new Map());
  const previousVoicingRef = useRef(null);
  const playbackTokenRef = useRef(0);
  const playbackRef = useRef(null);
  const liveVoicesRef = useRef(Array(6).fill(null));
  const liveOccurrenceRef = useRef(0);
  const [audioReady, setAudioReady] = useState(false);
  const [sampleMode, setSampleMode] = useState("recorded guitar sleeps");

  const ensureContext = useCallback(async () => {
    if (!contextRef.current) {
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      if (!AudioContextClass) return null;
      contextRef.current = new AudioContextClass();
      graphRef.current = createAudioGraph(contextRef.current);
    }
    if (contextRef.current.state === "suspended") await contextRef.current.resume();
    return contextRef.current;
  }, []);

  const cancelPlayback = useCallback(() => {
    playbackTokenRef.current += 1;
    const context = contextRef.current;
    const playback = playbackRef.current;
    if (playback) {
      playback.timers.forEach((timer) => window.clearTimeout(timer));
      playback.voices.forEach((voice) => releaseNow(context, voice, 0.1));
      playback.onState?.("idle");
    }
    playbackRef.current = null;
    liveVoicesRef.current.forEach((voice) => releaseNow(context, voice, 0.1));
    liveVoicesRef.current = Array(6).fill(null);
  }, []);

  const strum = useCallback(async (chord, options = {}) => {
    const context = await ensureContext();
    if (!context || !graphRef.current || !chord) return;
    const occurrence = liveOccurrenceRef.current;
    liveOccurrenceRef.current += 1;
    try {
      const manifest = await loadManifest();
      const voicing = selectPlayableVoicing(chord, previousVoicingRef.current);
      const prepared = await prepareVoicings(
        context,
        [voicing],
        [occurrence],
        manifest,
        sampleCacheRef.current,
      );
      setSampleMode(manifest.mode);
      setAudioReady(true);
      scheduleStrumAt(
        context,
        graphRef.current.input,
        voicing,
        prepared.recordings[0],
        prepared.buffers,
        context.currentTime + 0.035,
        options,
        liveVoicesRef.current,
      );
      previousVoicingRef.current = voicing;
    } catch {
      setSampleMode("recorded guitar unavailable");
      setAudioReady(false);
    }
  }, [ensureContext]);

  const playSequence = useCallback(async (events, onStep, options = {}) => {
    cancelPlayback();
    const token = playbackTokenRef.current;
    const onState = options.onState;
    onState?.("preparing");
    const context = await ensureContext();
    if (!context || !graphRef.current || playbackTokenRef.current !== token || !events.length) {
      onState?.("idle");
      return;
    }

    try {
      const manifest = await loadManifest();
      const bpm = clamp(options.bpm ?? 66, 40, 160);
      let previousVoicing = previousVoicingRef.current;
      let cursor = 0;
      let occurrence = 0;
      const eventPlans = events.map((event, index) => {
        const voicing = selectPlayableVoicing(event.chord, previousVoicing);
        previousVoicing = voicing;
        const eventStart = cursor;
        const strokes = eventStrums(event, index % 3 === 2 ? -1 : 1).map((stroke) => ({
          ...stroke,
          eventIndex: index,
          offsetSeconds: eventStart + stroke.beatOffset * 60 / bpm,
          occurrence: occurrence++,
          voicing,
        }));
        cursor += eventDuration(event, bpm);
        return { eventStart, index, strokes };
      });
      const strokes = eventPlans.flatMap((plan) => plan.strokes);
      const prepared = await prepareVoicings(
        context,
        strokes.map((stroke) => stroke.voicing),
        strokes.map((stroke) => stroke.occurrence),
        manifest,
        sampleCacheRef.current,
      );
      if (playbackTokenRef.current !== token) return;

      setSampleMode(manifest.mode);
      setAudioReady(true);
      onState?.("playing");
      const voices = [];
      const timers = [];
      const activeByString = Array(6).fill(null);
      const startTime = context.currentTime + 0.035;

      strokes.forEach((stroke, strokeIndex) => {
        voices.push(...scheduleStrumAt(
          context,
          graphRef.current.input,
          stroke.voicing,
          prepared.recordings[strokeIndex],
          prepared.buffers,
          startTime + stroke.offsetSeconds,
          stroke,
          activeByString,
        ));
      });
      eventPlans.forEach((plan) => {
        const when = startTime + plan.eventStart;
        timers.push(window.setTimeout(() => {
          if (playbackTokenRef.current === token) onStep?.(plan.index);
        }, Math.max(0, (when - context.currentTime) * 1000)));
      });

      const transportEnd = transportEndTime(startTime + cursor, voices);
      timers.push(window.setTimeout(() => {
        if (playbackTokenRef.current !== token) return;
        previousVoicingRef.current = previousVoicing;
        onStep?.(-1);
        onState?.("idle");
        playbackRef.current = null;
      }, Math.max(0, (transportEnd + 0.06 - context.currentTime) * 1000)));
      playbackRef.current = { token, timers, voices, onState };
    } catch {
      if (playbackTokenRef.current !== token) return;
      setSampleMode("recorded guitar unavailable");
      setAudioReady(false);
      onState?.("idle");
      playbackRef.current = null;
    }
  }, [cancelPlayback, ensureContext]);

  const stopSequence = useCallback(() => {
    cancelPlayback();
  }, [cancelPlayback]);

  const playLogoSignature = useCallback(async (options = {}) => {
    const callbacks = typeof options === "function" ? { onBeat: options } : options;
    cancelPlayback();
    const token = playbackTokenRef.current;
    const context = await ensureContext();
    if (!context || !graphRef.current || playbackTokenRef.current !== token) return null;

    // Do NOT schedule nodes into a suspended AudioContext.
    // If the browser hasn't granted audio playback yet, scheduling nodes queues
    // them up and causes phantom bursts when switching tabs or focusing.
    if (context.state !== "running") return null;

    try {
      const manifest = await loadManifest();
      const prepared = await prepareVoicings(
        context,
        [LOGO_G_MINOR_VOICING],
        [0],
        manifest,
        sampleCacheRef.current,
      );
      if (playbackTokenRef.current !== token || context.state !== "running") return null;

      setSampleMode(manifest.mode);
      setAudioReady(true);
      const startTime = context.currentTime + LOGO_STRING_START_SECONDS;
      const recordings = prepared.recordings[0];
      const voices = [];
      const timers = [];

      LOGO_G_MINOR_VOICING.forEach((midi, stringIndex) => {
        const when = startTime + stringIndex * LOGO_STRING_INTERVAL_SECONDS;
        const recording = recordings[stringIndex];
        const buffer = prepared.buffers.get(recording.url);
        if (!buffer || !recording) return;

        const voice = scheduleRecordedNote(
          context,
          graphRef.current.input,
          buffer,
          recording,
          stringIndex,
          when,
          0.48 + stringIndex * 0.035,
        );
        voices.push(voice);
        timers.push(window.setTimeout(() => {
          if (playbackTokenRef.current === token) callbacks.onBeat?.(stringIndex);
        }, Math.max(0, (when - context.currentTime) * 1000)));
      });

      const resolveTime = startTime
        + (LOGO_G_MINOR_VOICING.length - 1) * LOGO_STRING_INTERVAL_SECONDS
        + LOGO_RESOLVE_PAUSE_SECONDS;
      timers.push(window.setTimeout(() => {
        if (playbackTokenRef.current === token) callbacks.onResolve?.();
      }, Math.max(0, (resolveTime - context.currentTime) * 1000)));
      const completionTime = voices.reduce((end, voice) => Math.max(end, voice.endTime), resolveTime);
      timers.push(window.setTimeout(() => {
        if (playbackTokenRef.current !== token) return;
        previousVoicingRef.current = [...LOGO_G_MINOR_VOICING];
        playbackRef.current = null;
      }, Math.max(0, (completionTime + 0.06 - context.currentTime) * 1000)));
      playbackRef.current = { token, timers, voices };
      return {
        durationMs: Math.round((completionTime + 0.06 - startTime) * 1000),
        resolveAfterMs: Math.round((resolveTime - startTime) * 1000),
      };
    } catch {
      if (playbackTokenRef.current === token) {
        setSampleMode("recorded guitar unavailable");
        setAudioReady(false);
      }
      return null;
    }
  }, [cancelPlayback, ensureContext]);

  const playReverseSignature = useCallback(async (options = {}) => {
    const callbacks = typeof options === "function" ? { onBeat: options } : options;
    cancelPlayback();
    const token = playbackTokenRef.current;
    const context = await ensureContext();
    if (!context || !graphRef.current || playbackTokenRef.current !== token) return null;
    if (context.state !== "running") return null;

    try {
      const manifest = await loadManifest();
      const prepared = await prepareVoicings(
        context,
        [LOGO_G_MINOR_VOICING],
        [0],
        manifest,
        sampleCacheRef.current,
      );
      if (playbackTokenRef.current !== token || context.state !== "running") return null;

      setSampleMode(manifest.mode);
      setAudioReady(true);
      // Give 45ms scheduling headroom to ensure AudioParam ramp is safely in the future
      const startTime = context.currentTime + 0.045;
      const recordings = prepared.recordings[0];
      const voices = [];
      const timers = [];

      // Reversed strings: from high e (stringIndex 5) down to Bass E (stringIndex 0)
      const reversedIndices = [5, 4, 3, 2, 1, 0];

      reversedIndices.forEach((stringIndex, orderIndex) => {
        const when = startTime + orderIndex * LOGO_STRING_INTERVAL_SECONDS;
        const recording = recordings[stringIndex];
        const buffer = prepared.buffers.get(recording.url);
        if (!buffer || !recording) return;

        const voice = scheduleRecordedNote(
          context,
          graphRef.current.input,
          buffer,
          recording,
          stringIndex,
          when,
          0.50 - orderIndex * 0.02,
        );
        voices.push(voice);
        timers.push(window.setTimeout(() => {
          if (playbackTokenRef.current === token) callbacks.onBeat?.(stringIndex);
        }, Math.max(0, (when - context.currentTime) * 1000)));
      });

      const completionTime = voices.reduce((end, voice) => Math.max(end, voice.endTime), startTime);
      timers.push(window.setTimeout(() => {
        if (playbackTokenRef.current !== token) return;
        playbackRef.current = null;
      }, Math.max(0, (completionTime + 0.06 - context.currentTime) * 1000)));
      playbackRef.current = { token, timers, voices };
      return {
        durationMs: Math.round((completionTime + 0.06 - startTime) * 1000),
      };
    } catch {
      if (playbackTokenRef.current === token) {
        setSampleMode("recorded guitar unavailable");
        setAudioReady(false);
      }
      return null;
    }
  }, [cancelPlayback, ensureContext]);

  // Unlock AudioContext on first user interaction anywhere on the window
  useEffect(() => {
    const unlock = () => {
      ensureContext();
    };
    window.addEventListener("pointerdown", unlock, { capture: true, once: true });
    window.addEventListener("keydown", unlock, { capture: true, once: true });
    window.addEventListener("click", unlock, { capture: true, once: true });
    return () => {
      window.removeEventListener("pointerdown", unlock, { capture: true });
      window.removeEventListener("keydown", unlock, { capture: true });
      window.removeEventListener("click", unlock, { capture: true });
    };
  }, [ensureContext]);

  // Cancel playback if user switches away from the tab to prevent phantom bursts
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        cancelPlayback();
      }
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [cancelPlayback]);

  useEffect(() => () => {
    playbackTokenRef.current += 1;
    const context = contextRef.current;
    if (playbackRef.current) {
      playbackRef.current.timers.forEach((timer) => window.clearTimeout(timer));
      playbackRef.current.voices.forEach((voice) => releaseNow(context, voice, 0.02));
    }
    liveVoicesRef.current.forEach((voice) => releaseNow(context, voice, 0.02));
    contextRef.current?.close();
    contextRef.current = null;
  }, []);

  return {
    audioReady,
    playLogoSignature,
    playReverseSignature,
    playSequence,
    sampleMode,
    stopSequence,
    strum,
  };
}
