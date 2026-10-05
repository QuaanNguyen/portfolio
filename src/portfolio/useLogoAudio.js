import { useCallback, useEffect, useRef, useState } from "react";
import {
  LOGO_RESOLVE_PAUSE_SECONDS,
  LOGO_STRING_INTERVAL_SECONDS,
  LOGO_STRING_START_SECONDS,
} from "./logoTiming.js";

export const GUITAR_STRINGS = [40, 45, 50, 55, 59, 64];
export const STRUM_STRING_INTERVAL_SECONDS = 0.021;
export const LOGO_G_MINOR_VOICING = [43, 50, 55, 58, 62, 67];

const LOGO_SAMPLE_MANIFEST_URL = "/audio/logo-guitar/manifest.json";

let manifestPromise;
let audioContextInstance;

const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));

function createSampleIndex(samples) {
  const index = new Map();
  samples.forEach((sample) => {
    const key = `${sample.stringIndex}:${sample.fret}`;
    const list = index.get(key) ?? [];
    list.push(sample);
    index.set(key, list);
  });
  return index;
}

function validateLogoManifest(manifest) {
  if (!Array.isArray(manifest.samples)) throw new Error("Logo guitar manifest has no samples");
  const sampleIndex = createSampleIndex(manifest.samples);
  LOGO_G_MINOR_VOICING.forEach((midi, stringIndex) => {
    const fret = midi - GUITAR_STRINGS[stringIndex];
    const candidates = sampleIndex.get(`${stringIndex}:${fret}`) ?? [];
    if (!candidates.length) {
      throw new Error(`Logo guitar manifest is incomplete at string ${stringIndex}, fret ${fret}`);
    }
  });
  return {
    ...manifest,
    sampleIndex,
    mode: "recorded G minor logo signature",
  };
}

async function loadLogoManifest() {
  if (!manifestPromise) {
    manifestPromise = fetch(LOGO_SAMPLE_MANIFEST_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`Logo guitar manifest returned ${response.status}`);
        return response.json();
      })
      .then(validateLogoManifest)
      .catch((error) => {
        manifestPromise = null;
        throw error;
      });
  }
  return manifestPromise;
}

function tuningCorrectedPlaybackRate(sample, midi) {
  const baseRate = 2 ** ((midi - sample.midi) / 12);
  const centsOffset = typeof sample.tuningCents === "number" ? sample.tuningCents : 0;
  return baseRate * 2 ** (-centsOffset / 1200);
}

function resolveSampleRecording(manifest, stringIndex, midi) {
  const fret = midi - GUITAR_STRINGS[stringIndex];
  const candidates = manifest.sampleIndex.get(`${stringIndex}:${fret}`) ?? [];
  const sample = candidates[0];
  if (!sample) throw new Error(`Missing logo sample for string ${stringIndex}, fret ${fret}`);
  const baseUrl = manifest.baseUrl ?? "/audio/logo-guitar";
  const url = sample.file.startsWith("/") ? sample.file : `${baseUrl}/${sample.file}`;
  return {
    sourceMidi: sample.midi,
    url,
    playbackRate: tuningCorrectedPlaybackRate(sample, midi),
    gainCompensation: clamp(Number(sample.gainCompensation) || 1, 0.1, 4),
    durationSeconds: clamp(Number(sample.durationSeconds) || 3.4, 0.1, 4),
    stringIndex,
    fret,
  };
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

  const compressor = context.createDynamicsCompressor();
  compressor.threshold.value = -16;
  compressor.knee.value = 10;
  compressor.ratio.value = 2.4;
  compressor.attack.value = 0.008;
  compressor.release.value = 0.18;

  const output = context.createGain();
  output.gain.value = 0.94;

  input.connect(highpass);
  highpass.connect(warmth);
  warmth.connect(compressor);
  compressor.connect(output);
  output.connect(context.destination);

  return { input, output };
}

async function decodeAudioUrl(context, url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Failed to fetch audio sample ${url}`);
  const data = await response.arrayBuffer();
  return context.decodeAudioData(data);
}

export default function useLogoAudio() {
  const [audioReady, setAudioReady] = useState(false);
  const graphRef = useRef(null);
  const sampleCacheRef = useRef(new Map());
  const playbackRef = useRef(null);
  const playbackTokenRef = useRef(0);
  const preparationRef = useRef(null);

  const getContext = useCallback(() => {
    if (typeof window === "undefined") return null;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    if (!audioContextInstance) {
      audioContextInstance = new AudioContextClass();
    }
    if (!graphRef.current && audioContextInstance) {
      graphRef.current = createAudioGraph(audioContextInstance);
    }
    return audioContextInstance;
  }, []);

  const ensureContext = useCallback(async () => {
    const context = getContext();
    if (!context) return null;
    if (context.state === "suspended") {
      try {
        await context.resume();
      } catch {
        return null;
      }
    }
    return context;
  }, [getContext]);

  const cancelPlayback = useCallback(() => {
    playbackTokenRef.current += 1;
    if (playbackRef.current) {
      const { timers = [], voices = [] } = playbackRef.current;
      timers.forEach((timer) => clearTimeout(timer));
      voices.forEach((voice) => {
        try {
          voice.stop();
          voice.disconnect();
        } catch {
          // ignore already stopped voices
        }
      });
      playbackRef.current = null;
    }
  }, []);

  const activateLogoAudio = useCallback(async () => {
    const context = await ensureContext();
    return context?.state === "running";
  }, [ensureContext]);

  const prepareLogoSignature = useCallback(async () => {
    if (preparationRef.current) return preparationRef.current;
    const context = getContext();
    if (!context) return false;

    preparationRef.current = (async () => {
      try {
        const manifest = await loadLogoManifest();
        const urls = LOGO_G_MINOR_VOICING.map((midi, stringIndex) =>
          resolveSampleRecording(manifest, stringIndex, midi).url
        );
        await Promise.all(
          urls.map(async (url) => {
            if (!sampleCacheRef.current.has(url)) {
              const buffer = await decodeAudioUrl(context, url);
              sampleCacheRef.current.set(url, buffer);
            }
          })
        );
        setAudioReady(true);
        return true;
      } catch {
        setAudioReady(false);
        return false;
      }
    })();
    return preparationRef.current;
  }, [getContext]);

  const playLogoSignature = useCallback(
    async (options = {}) => {
      const callbacks = typeof options === "function" ? { onBeat: options } : options;
      cancelPlayback();
      const token = playbackTokenRef.current;
      const context = await ensureContext();
      if (!context || !graphRef.current || playbackTokenRef.current !== token) return null;

      if (context.state !== "running") return null;

      try {
        const manifest = await loadLogoManifest();
        const recordings = LOGO_G_MINOR_VOICING.map((midi, stringIndex) =>
          resolveSampleRecording(manifest, stringIndex, midi)
        );
        await Promise.all(
          recordings.map(async (recording) => {
            if (!sampleCacheRef.current.has(recording.url)) {
              const buffer = await decodeAudioUrl(context, recording.url);
              sampleCacheRef.current.set(recording.url, buffer);
            }
          })
        );
        if (playbackTokenRef.current !== token || context.state !== "running") return null;

        setAudioReady(true);
        const startTime = context.currentTime + LOGO_STRING_START_SECONDS;
        const voices = [];
        const timers = [];

        LOGO_G_MINOR_VOICING.forEach((midi, stringIndex) => {
          const when = startTime + stringIndex * LOGO_STRING_INTERVAL_SECONDS;
          const recording = recordings[stringIndex];
          const buffer = sampleCacheRef.current.get(recording.url);
          if (!buffer || !recording) return;

          const source = context.createBufferSource();
          const gain = context.createGain();
          source.buffer = buffer;
          source.playbackRate.setValueAtTime(recording.playbackRate, when);

          gain.gain.setValueAtTime(recording.gainCompensation * 0.9, when);
          gain.gain.exponentialRampToValueAtTime(
            0.0001,
            when + recording.durationSeconds + LOGO_RESOLVE_PAUSE_SECONDS
          );

          source.connect(gain);
          gain.connect(graphRef.current.input);
          source.start(when);
          voices.push(source);

          const delayMs = Math.max(0, (when - context.currentTime) * 1000);
          const timer = setTimeout(() => {
            if (playbackTokenRef.current === token) {
              callbacks.onBeat?.(stringIndex, { midi, stringIndex });
            }
          }, delayMs);
          timers.push(timer);
        });

        playbackRef.current = { timers, voices };
        return { chordIndex: 0, duration: 2.8 };
      } catch {
        return null;
      }
    },
    [cancelPlayback, ensureContext]
  );

  useEffect(() => () => cancelPlayback(), [cancelPlayback]);

  return {
    activateLogoAudio,
    audioReady,
    playLogoSignature,
    prepareLogoSignature,
  };
}
