import { GUITAR_STRINGS, LOGO_G_MINOR_VOICING } from "../../portfolio/useLogoAudio";

const MANIFEST_URL = "/audio/logo-guitar/manifest.json";
const NOTE_NAMES = ["C", "C#", "D", "Eb", "E", "F", "F#", "G", "Ab", "A", "Bb", "B"];

export const STRING_NOTES = LOGO_G_MINOR_VOICING.map((midi, stringIndex) => ({
  stringIndex,
  midi,
  fret: midi - GUITAR_STRINGS[stringIndex],
  name: `${NOTE_NAMES[midi % 12]}${Math.floor(midi / 12) - 1}`,
}));

let context = null;
let output = null;
let loading = null;
const voices = new Map();

function ensureContext() {
  if (typeof window === "undefined") return null;
  if (!context) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;
    context = new AudioContextClass();
    const compressor = context.createDynamicsCompressor();
    compressor.threshold.value = -14;
    compressor.ratio.value = 2.6;
    output = context.createGain();
    output.gain.value = 0.8;
    output.connect(compressor);
    compressor.connect(context.destination);
  }
  return context;
}

export function unlockStringAudio() {
  const ctx = ensureContext();
  if (ctx?.state === "suspended") ctx.resume().catch(() => undefined);
  loadStringSamples();
}

export function stringAudioState() {
  if (!context) return "not created";
  return `${context.state}, ${voices.size}/6 samples`;
}

export function loadStringSamples() {
  const ctx = ensureContext();
  if (!ctx || loading) return loading;
  loading = fetch(MANIFEST_URL)
    .then((response) => response.json())
    .then((manifest) =>
      Promise.all(
        STRING_NOTES.map(async (note) => {
          const sample = manifest.samples.find((s) => s.stringIndex === note.stringIndex && s.fret === note.fret);
          if (!sample) return;
          const response = await fetch(`${manifest.baseUrl}/${sample.file}`);
          const buffer = await ctx.decodeAudioData(await response.arrayBuffer());
          voices.set(note.stringIndex, { buffer, gain: Number(sample.gainCompensation) || 1 });
        })
      )
    )
    .catch(() => {
      loading = null;
    });
  return loading;
}

export function pluckString(stringIndex, delaySeconds = 0, velocity = 1) {
  const ctx = ensureContext();
  const voice = voices.get(stringIndex);
  if (!ctx || ctx.state !== "running" || !voice) return false;
  const when = ctx.currentTime + delaySeconds;
  const source = ctx.createBufferSource();
  source.buffer = voice.buffer;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(voice.gain * 0.85 * velocity, when);
  gain.gain.exponentialRampToValueAtTime(0.0001, when + 3.2);
  source.connect(gain);
  gain.connect(output);
  source.start(when);
  source.stop(when + 3.3);
  return true;
}
