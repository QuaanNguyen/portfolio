import { createHash } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";

const SOURCE_BASE_URL = "https://theremin.music.uiowa.edu/sound%20files/MIS/Piano_Other/guitar";
const PERMISSION_URL = "https://theremin.music.uiowa.edu/MIS.html";
const DEFAULT_SOURCE_ROOT = "/private/tmp/portfolio-guitar-iowa";
const DEFAULT_OUTPUT_ROOT = resolve("public/audio/guitar-physical");
const OUTPUT_DURATION_SECONDS = 3.4;
const MIN_OUTPUT_DURATION_SECONDS = 3.0;
const NEXT_ATTACK_MARGIN_SECONDS = 0.04;
const FADE_IN_SECONDS = 0.004;
const FADE_OUT_SECONDS = 0.18;
const STRUM_INTERVAL_SECONDS = 0.021;
const TARGET_RMS_DB = -30;
const MIN_GAIN_COMPENSATION_DB = -18;
const MAX_GAIN_COMPENSATION_DB = 12;
const NORMALIZED_PEAK_LIMIT = 0.9;
const MAX_TUNING_DEVIATION_CENTS = 90;
const alternates = [
  { alternateIndex: 0, dynamic: "mf" },
  { alternateIndex: 1, dynamic: "ff" },
];

const stringSources = [
  {
    stringIndex: 0,
    stringName: "low E",
    openMidi: 40,
    recordings: [
      { fileTemplate: "Guitar.{dynamic}.sulE.E2B2.mono.aif", firstFret: 0, noteCount: 8 },
      { fileTemplate: "Guitar.{dynamic}.sulE.C3B3.mono.aif", firstFret: 8, noteCount: 12 },
    ],
  },
  {
    stringIndex: 1,
    stringName: "A",
    openMidi: 45,
    recordings: [
      { fileTemplate: "Guitar.{dynamic}.sulA.A2B2.mono.aif", firstFret: 0, noteCount: 3 },
      { fileTemplate: "Guitar.{dynamic}.sulA.C3B3.mono.aif", firstFret: 3, noteCount: 12 },
    ],
  },
  {
    stringIndex: 2,
    stringName: "D",
    openMidi: 50,
    recordings: [
      { fileTemplate: "Guitar.{dynamic}.sulD.D3B3.mono.aif", firstFret: 0, noteCount: 10 },
      { fileTemplate: "Guitar.{dynamic}.sulD.C4Ab4.mono.aif", firstFret: 10, noteCount: 9 },
    ],
  },
  {
    stringIndex: 3,
    stringName: "G",
    openMidi: 55,
    recordings: [
      { fileTemplate: "Guitar.{dynamic}.sulG.G3B3.mono.aif", firstFret: 0, noteCount: 5 },
      { fileTemplate: "Guitar.{dynamic}.sulG.C4B4.mono.aif", firstFret: 5, noteCount: 12 },
    ],
  },
  {
    stringIndex: 4,
    stringName: "B",
    openMidi: 59,
    recordings: [
      { fileTemplate: "Guitar.{dynamic}.sulB.B3.mono.aif", firstFret: 0, noteCount: 1 },
      { fileTemplate: "Guitar.{dynamic}.sulB.C4B4.mono.aif", firstFret: 1, noteCount: 12 },
    ],
  },
  {
    stringIndex: 5,
    stringName: "high E",
    openMidi: 64,
    recordings: [
      { fileTemplate: "Guitar.{dynamic}.sul_E.E4B4.mono.aif", firstFret: 0, noteCount: 8 },
      {
        fileTemplate: "Guitar.{dynamic}.sul_E.C5B5.mono.aif",
        fileByDynamic: { ff: "Guitar.ff.sul_E.C5Bb5.mono.aif" },
        firstFret: 8,
        noteCount: 12,
        noteCountByDynamic: { ff: 11 },
      },
    ],
  },
];

function readExtended80(buffer, offset) {
  const exponentWord = buffer.readUInt16BE(offset);
  const sign = exponentWord & 0x8000 ? -1 : 1;
  const exponent = exponentWord & 0x7fff;
  const high = buffer.readUInt32BE(offset + 2);
  const low = buffer.readUInt32BE(offset + 6);
  if (exponent === 0 && high === 0 && low === 0) return 0;
  const mantissa = high * 2 ** 32 + low;
  return sign * mantissa * 2 ** (exponent - 16383 - 63);
}

function parseAiff(filePath) {
  const buffer = readFileSync(filePath);
  if (buffer.toString("ascii", 0, 4) !== "FORM") throw new Error(`${basename(filePath)} is not AIFF`);
  let channels;
  let frameCount;
  let bitDepth;
  let sampleRate;
  let dataStart;
  let dataLength;
  let cursor = 12;

  while (cursor + 8 <= buffer.length) {
    const id = buffer.toString("ascii", cursor, cursor + 4);
    const size = buffer.readUInt32BE(cursor + 4);
    const body = cursor + 8;
    if (id === "COMM") {
      channels = buffer.readUInt16BE(body);
      frameCount = buffer.readUInt32BE(body + 2);
      bitDepth = buffer.readUInt16BE(body + 6);
      sampleRate = readExtended80(buffer, body + 8);
    }
    if (id === "SSND") {
      const soundOffset = buffer.readUInt32BE(body);
      dataStart = body + 8 + soundOffset;
      dataLength = size - 8 - soundOffset;
    }
    cursor = body + size + (size % 2);
  }

  if (channels !== 1 || bitDepth !== 24 || !dataStart || !dataLength) {
    throw new Error(`${basename(filePath)} must be mono 24-bit PCM AIFF`);
  }
  if (Math.abs(sampleRate - 96000) > 1) throw new Error(`${basename(filePath)} must be 96 kHz`);
  const availableFrames = Math.floor(dataLength / 3);
  if (availableFrames < frameCount) throw new Error(`${basename(filePath)} has truncated audio data`);

  return {
    buffer,
    dataStart,
    frameCount,
    sampleRate: Math.round(sampleRate),
    sampleAt(frame) {
      if (frame < 0 || frame >= frameCount) return 0;
      return buffer.readIntBE(dataStart + frame * 3, 3) / 8388608;
    },
  };
}

function energyEnvelope(audio) {
  const hopFrames = Math.round(audio.sampleRate * 0.005);
  const blocks = Math.floor(audio.frameCount / hopFrames);
  const values = new Float64Array(blocks);
  for (let block = 0; block < blocks; block += 1) {
    let sumSquares = 0;
    const start = block * hopFrames;
    for (let frame = 0; frame < hopFrames; frame += 1) {
      const sample = audio.sampleAt(start + frame);
      sumSquares += sample * sample;
    }
    values[block] = 20 * Math.log10(Math.max(1e-9, Math.sqrt(sumSquares / hopFrames)));
  }
  return { values, hopFrames, hopSeconds: hopFrames / audio.sampleRate };
}

function mean(values, start, end) {
  let total = 0;
  let count = 0;
  for (let index = Math.max(0, start); index < Math.min(values.length, end); index += 1) {
    total += values[index];
    count += 1;
  }
  return count ? total / count : -180;
}

function refineOnset(envelope, peakIndex) {
  const { values, hopSeconds } = envelope;
  const searchFrames = Math.round(0.24 / hopSeconds);
  const baselineEnd = Math.max(0, peakIndex - Math.round(0.075 / hopSeconds));
  const baseline = mean(values, peakIndex - searchFrames, baselineEnd);
  const threshold = Math.max(baseline + 7, values[peakIndex] - 24);
  const start = Math.max(0, peakIndex - searchFrames);
  for (let index = start; index <= peakIndex; index += 1) {
    let sustained = 0;
    for (let offset = 0; offset < 4 && index + offset < values.length; offset += 1) {
      if (values[index + offset] >= threshold) sustained += 1;
    }
    if (sustained >= 3) return index * hopSeconds;
  }
  return peakIndex * hopSeconds;
}

function detectOnsets(audio, expectedMidis) {
  const envelope = energyEnvelope(audio);
  const { values, hopSeconds } = envelope;
  const averageSlot = audio.frameCount / audio.sampleRate / expectedMidis.length;
  const lookbackStart = Math.round(0.42 / hopSeconds);
  const lookbackEnd = Math.round(0.045 / hopSeconds);
  const localRadius = Math.round(0.035 / hopSeconds);
  const candidates = [];

  for (let index = 1; index < values.length - 1; index += 1) {
    const background = mean(values, index - lookbackStart, index - lookbackEnd);
    const score = values[index] - background;
    if (values[index] < -38 || score < 5.5) continue;
    let localMaximum = true;
    for (let offset = -localRadius; offset <= localRadius; offset += 1) {
      if (values[index + offset] > values[index]) {
        localMaximum = false;
        break;
      }
    }
    if (localMaximum) candidates.push({ index, score, level: values[index] });
  }

  const clustered = [];
  for (const candidate of [...candidates].sort((a, b) => a.index - b.index)) {
    const previous = clustered.at(-1);
    if (previous && (candidate.index - previous.lastIndex) * hopSeconds < 0.32) {
      previous.lastIndex = candidate.index;
      if (candidate.score > previous.score) Object.assign(previous, candidate, { lastIndex: candidate.index });
    } else {
      clustered.push({ ...candidate, lastIndex: candidate.index });
    }
  }

  const minimumGap = 0.5;
  const refined = clustered.map((candidate, candidateIndex) => ({
    ...candidate,
    candidateIndex,
    peakSeconds: candidate.index * hopSeconds,
    seconds: refineOnset(envelope, candidate.index),
  }));
  const options = expectedMidis.map((midi, noteIndex) => refined.flatMap((candidate) => {
    const validation = measurePitch(audio, candidate.seconds, midi);
    if (process.env.DEBUG_ONSETS === "2") {
      process.stdout.write(`m${midi} t${candidate.seconds.toFixed(3)} c${validation.cents.toFixed(1)} r${validation.correlation.toFixed(3)}\n`);
    }
    if (validation.correlation < 0.15 || Math.abs(validation.cents) > MAX_TUNING_DEVIATION_CENTS) return [];
    const targetSeconds = noteIndex * averageSlot;
    const localCost = Math.abs(validation.cents) / 18
      + (1 - validation.correlation) * 2
      + Math.abs(candidate.seconds - targetSeconds) / averageSlot * 0.22
      - Math.log1p(candidate.score) * 3;
    return [{ ...candidate, validation, cost: localCost, previous: null }];
  }));

  if (options.some((entries) => !entries.length)) {
    const missing = options.flatMap((entries, index) => entries.length ? [] : [expectedMidis[index]]);
    throw new Error(`Could not find pitch-validated onset candidates for MIDI ${missing.join(", ")}`);
  }

  for (let noteIndex = 1; noteIndex < options.length; noteIndex += 1) {
    for (const option of options[noteIndex]) {
      let best = null;
      for (const previous of options[noteIndex - 1]) {
        const gap = option.seconds - previous.seconds;
        if (gap < minimumGap || !Number.isFinite(previous.cost)) continue;
        const transitionCost = Math.abs(gap - averageSlot) / averageSlot * 0.18;
        const cost = previous.cost + option.cost + transitionCost;
        if (!best || cost < best.cost) best = { cost, previous };
      }
      if (best) {
        option.cost = best.cost;
        option.previous = best.previous;
      } else {
        option.cost = Number.POSITIVE_INFINITY;
      }
    }
  }

  let cursor = options.at(-1).reduce((best, option) => option.cost < best.cost ? option : best, {
    cost: Number.POSITIVE_INFINITY,
  });
  if (!Number.isFinite(cursor.cost)) {
    const candidatesByMidi = options.map((entries, index) => (
      `${expectedMidis[index]}=[${entries.map((entry) => entry.seconds.toFixed(3)).join(",")}]`
    )).join(" ");
    throw new Error(`Could not resolve an ordered pitch-validated onset sequence: ${candidatesByMidi}`);
  }
  const selected = Array(options.length);
  for (let noteIndex = options.length - 1; noteIndex >= 0; noteIndex -= 1) {
    selected[noteIndex] = cursor;
    cursor = cursor.previous;
  }

  if (process.env.DEBUG_ONSETS === "1") {
    process.stdout.write(`${clustered.map((candidate) => `${(candidate.index * hopSeconds).toFixed(3)}:${candidate.score.toFixed(1)}:${candidate.level.toFixed(1)}`).join(" ")}\n`);
    process.stdout.write(`selected ${selected.map((candidate) => `${candidate.seconds.toFixed(3)}:${candidate.validation.cents.toFixed(1)}`).join(" ")}\n`);
  }

  return selected;
}

function measurePitch(audio, onsetSeconds, midi) {
  const sourceStart = Math.round((onsetSeconds + 0.18) * audio.sampleRate);
  const decimation = 4;
  const analysisRate = audio.sampleRate / decimation;
  const sampleCount = Math.round(analysisRate * 0.38);
  const samples = new Float64Array(sampleCount);
  let average = 0;
  for (let index = 0; index < sampleCount; index += 1) {
    const sample = audio.sampleAt(sourceStart + index * decimation);
    samples[index] = sample;
    average += sample;
  }
  average /= sampleCount;
  for (let index = 0; index < sampleCount; index += 1) samples[index] -= average;

  const expectedFrequency = 440 * 2 ** ((midi - 69) / 12);
  const expectedLag = analysisRate / expectedFrequency;
  const minimumLag = Math.max(2, Math.floor(expectedLag * 0.93));
  const maximumLag = Math.ceil(expectedLag * 1.07);
  const correlations = new Map();

  for (let lag = minimumLag; lag <= maximumLag; lag += 1) {
    let cross = 0;
    let leftEnergy = 0;
    let rightEnergy = 0;
    for (let index = 0; index < sampleCount - lag; index += 1) {
      const left = samples[index];
      const right = samples[index + lag];
      cross += left * right;
      leftEnergy += left * left;
      rightEnergy += right * right;
    }
    correlations.set(lag, cross / Math.sqrt(Math.max(1e-12, leftEnergy * rightEnergy)));
  }

  let bestLag = minimumLag;
  for (let lag = minimumLag + 1; lag <= maximumLag; lag += 1) {
    if (correlations.get(lag) > correlations.get(bestLag)) bestLag = lag;
  }
  const left = correlations.get(bestLag - 1) ?? correlations.get(bestLag);
  const center = correlations.get(bestLag);
  const right = correlations.get(bestLag + 1) ?? correlations.get(bestLag);
  const denominator = left - 2 * center + right;
  const offset = Math.abs(denominator) > 1e-9 ? 0.5 * (left - right) / denominator : 0;
  const refinedLag = bestLag + Math.max(-0.5, Math.min(0.5, offset));
  const frequency = analysisRate / refinedLag;
  const cents = 1200 * Math.log2(frequency / expectedFrequency);

  return { frequency, cents, correlation: center };
}

function noteName(midi) {
  const names = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];
  return `${names[midi % 12]}${Math.floor(midi / 12) - 1}`;
}

function segmentFrames(audio, onsetSeconds, durationSeconds) {
  const startFrame = Math.max(0, Math.round((onsetSeconds - 0.012) * audio.sampleRate));
  const frameCount = Math.round(durationSeconds * audio.sampleRate);
  const samples = new Float64Array(frameCount);
  const fadeInFrames = Math.round(FADE_IN_SECONDS * audio.sampleRate);
  const fadeOutFrames = Math.round(FADE_OUT_SECONDS * audio.sampleRate);

  for (let frame = 0; frame < frameCount; frame += 1) {
    let gain = 1;
    if (frame < fadeInFrames) gain *= Math.sin((frame / fadeInFrames) * Math.PI * 0.5) ** 2;
    if (frame >= frameCount - fadeOutFrames) {
      const remaining = (frameCount - frame - 1) / fadeOutFrames;
      gain *= Math.sin(Math.max(0, remaining) * Math.PI * 0.5) ** 2;
    }
    samples[frame] = audio.sampleAt(startFrame + frame) * gain;
  }
  return { samples, startFrame };
}

function measureSegment(samples, sampleRate) {
  const start = Math.round(sampleRate * 0.02);
  const end = Math.min(samples.length, Math.round(sampleRate * 0.95));
  let sumSquares = 0;
  let peak = 0;
  for (const sample of samples) peak = Math.max(peak, Math.abs(sample));
  for (let index = start; index < end; index += 1) {
    const sample = samples[index];
    sumSquares += sample * sample;
  }
  const rms = Math.sqrt(sumSquares / Math.max(1, end - start));
  const rmsDb = 20 * Math.log10(Math.max(1e-9, rms));
  const targetGain = 10 ** ((TARGET_RMS_DB - rmsDb) / 20);
  const minimumGain = 10 ** (MIN_GAIN_COMPENSATION_DB / 20);
  const maximumGain = 10 ** (MAX_GAIN_COMPENSATION_DB / 20);
  const peakLimitedGain = peak > 0 ? NORMALIZED_PEAK_LIMIT / peak : maximumGain;
  const gainCompensation = Math.min(
    maximumGain,
    Math.max(minimumGain, targetGain),
    peakLimitedGain,
  );
  return {
    rmsDb: Number(rmsDb.toFixed(2)),
    peakDb: Number((20 * Math.log10(Math.max(1e-9, peak))).toFixed(2)),
    gainCompensation: Number(gainCompensation.toFixed(4)),
  };
}

function writeWav24(filePath, samples, sampleRate) {
  const bytesPerSample = 3;
  const dataSize = samples.length * bytesPerSample;
  const output = Buffer.alloc(44 + dataSize);
  output.write("RIFF", 0, "ascii");
  output.writeUInt32LE(36 + dataSize, 4);
  output.write("WAVE", 8, "ascii");
  output.write("fmt ", 12, "ascii");
  output.writeUInt32LE(16, 16);
  output.writeUInt16LE(1, 20);
  output.writeUInt16LE(1, 22);
  output.writeUInt32LE(sampleRate, 24);
  output.writeUInt32LE(sampleRate * bytesPerSample, 28);
  output.writeUInt16LE(bytesPerSample, 32);
  output.writeUInt16LE(24, 34);
  output.write("data", 36, "ascii");
  output.writeUInt32LE(dataSize, 40);
  for (let index = 0; index < samples.length; index += 1) {
    const value = Math.max(-8388608, Math.min(8388607, Math.round(samples[index] * 8388607)));
    output.writeIntLE(value, 44 + index * bytesPerSample, bytesPerSample);
  }
  writeFileSync(filePath, output);
}

function encodeMp3(wavPath, outputPath) {
  const result = spawnSync("lame", [
    "--silent",
    "-b",
    "96",
    "-h",
    "-m",
    "m",
    "--resample",
    "44.1",
    "--noreplaygain",
    wavPath,
    outputPath,
  ], { encoding: "utf8" });
  if (result.status !== 0) throw new Error(result.stderr || result.stdout || `lame failed for ${outputPath}`);
}

function sha256(filePath) {
  return createHash("sha256").update(readFileSync(filePath)).digest("hex");
}

function analyzeSources(sourceRoot) {
  const recordings = new Map();
  const samples = [];

  for (const string of stringSources) {
    for (const alternate of alternates) {
      for (const recording of string.recordings) {
        const file = recording.fileByDynamic?.[alternate.dynamic]
          ?? recording.fileTemplate.replace("{dynamic}", alternate.dynamic);
        const path = join(sourceRoot, file);
        if (!existsSync(path)) throw new Error(`Missing ${path}`);
        const audio = parseAiff(path);
        const noteCount = recording.noteCountByDynamic?.[alternate.dynamic] ?? recording.noteCount;
        const expectedMidis = Array.from(
          { length: noteCount },
          (_, noteIndex) => string.openMidi + recording.firstFret + noteIndex,
        );
        const onsets = detectOnsets(audio, expectedMidis);
        const validations = onsets.map((onset) => onset.validation);
        recordings.set(file, { audio, onsets, validations });
        process.stdout.write(`${file}: ${onsets.map((onset) => onset.seconds.toFixed(3)).join(", ")}\n`);

        onsets.forEach((onset, noteIndex) => {
          const fret = recording.firstFret + noteIndex;
          if (fret > 12) return;
          const midi = string.openMidi + fret;
          const nextOnset = onsets[noteIndex + 1]?.seconds;
          const durationSeconds = nextOnset === undefined
            ? OUTPUT_DURATION_SECONDS
            : Math.min(OUTPUT_DURATION_SECONDS, nextOnset - onset.seconds - NEXT_ATTACK_MARGIN_SECONDS);
          if (durationSeconds < MIN_OUTPUT_DURATION_SECONDS) {
            throw new Error(`${file} MIDI ${midi} has only ${durationSeconds.toFixed(3)} seconds before the next attack`);
          }
          samples.push({
            stringIndex: string.stringIndex,
            stringName: string.stringName,
            fret,
            midi,
            note: noteName(midi),
            dynamic: alternate.dynamic,
            alternateIndex: alternate.alternateIndex,
            sourceFile: file,
            sourceUrl: `${SOURCE_BASE_URL}/${file}`,
            onsetSeconds: onset.seconds,
            durationSeconds,
            validation: validations[noteIndex],
          });
        });
      }
    }
  }

  for (const string of stringSources) {
    for (const alternate of alternates) {
      const frets = samples
        .filter((sample) => sample.stringIndex === string.stringIndex && sample.alternateIndex === alternate.alternateIndex)
        .map((sample) => sample.fret);
      const expected = Array.from({ length: 13 }, (_, index) => index);
      if (frets.length !== expected.length || frets.some((fret, index) => fret !== expected[index])) {
        throw new Error(`${string.stringName} ${alternate.dynamic} coverage is ${frets.join(", ")}, expected 0 through 12`);
      }
    }
  }

  return { recordings, samples };
}

function buildSampleBank(sourceRoot, outputRoot, analysis) {
  mkdirSync(outputRoot, { recursive: true });
  const temporaryRoot = join(sourceRoot, "segments");
  mkdirSync(temporaryRoot, { recursive: true });
  const manifestSamples = [];
  const segments = new Map();

  for (const sample of analysis.samples) {
    const recording = analysis.recordings.get(sample.sourceFile);
    const segment = segmentFrames(recording.audio, sample.onsetSeconds, sample.durationSeconds);
    const measurement = measureSegment(segment.samples, recording.audio.sampleRate);
    const stem = `string-${sample.stringIndex + 1}-fret-${String(sample.fret).padStart(2, "0")}-${sample.dynamic}`;
    const wavPath = join(temporaryRoot, `${stem}.wav`);
    const file = `${stem}.mp3`;
    const outputPath = join(outputRoot, file);
    writeWav24(wavPath, segment.samples, recording.audio.sampleRate);
    encodeMp3(wavPath, outputPath);
    segments.set(`${sample.stringIndex}:${sample.fret}:${sample.alternateIndex}`, {
      samples: segment.samples,
      gainCompensation: measurement.gainCompensation,
      playbackRateCorrection: 2 ** (-sample.validation.cents / 1200),
    });
    manifestSamples.push({
      stringIndex: sample.stringIndex,
      stringName: sample.stringName,
      fret: sample.fret,
      midi: sample.midi,
      dynamic: sample.dynamic,
      alternateIndex: sample.alternateIndex,
      file,
      sourceUrl: sample.sourceUrl,
      trimStartSeconds: Number((segment.startFrame / recording.audio.sampleRate).toFixed(6)),
      durationSeconds: Number(sample.durationSeconds.toFixed(6)),
      sha256: sha256(outputPath),
      note: sample.note,
      validationCents: Number(sample.validation.cents.toFixed(2)),
      validationCorrelation: Number(sample.validation.correlation.toFixed(4)),
      sourceRmsDb: measurement.rmsDb,
      sourcePeakDb: measurement.peakDb,
      gainCompensation: measurement.gainCompensation,
    });
  }

  manifestSamples.sort((a, b) => (
    a.stringIndex - b.stringIndex || a.fret - b.fret || a.alternateIndex - b.alternateIndex
  ));
  const manifest = {
    source: "University of Iowa Electronic Music Studios Musical Instrument Samples, Raimundo 118 guitar, medium and fortissimo dynamic, mono physical-string recordings",
    permissionUrl: PERMISSION_URL,
    alternateCount: alternates.length,
    targetRmsDb: TARGET_RMS_DB,
    samples: manifestSamples,
  };
  writeFileSync(join(outputRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
  return { manifest, segments };
}

function mixEvents(segments, events, durationSeconds, sampleRate = 96000) {
  const output = new Float64Array(Math.ceil(durationSeconds * sampleRate));
  for (const event of events) {
    const segment = segments.get(`${event.stringIndex}:${event.fret}:${event.alternateIndex ?? 0}`);
    if (!segment) throw new Error(`Missing segment ${event.stringIndex}:${event.fret}:${event.alternateIndex ?? 0}`);
    const start = Math.round(event.when * sampleRate);
    const sourceDurationFrames = Math.floor(segment.samples.length / segment.playbackRateCorrection);
    const available = Math.min(
      sourceDurationFrames,
      output.length - start,
      Math.round((event.maxDuration ?? OUTPUT_DURATION_SECONDS) * sampleRate),
    );
    const releaseFrames = Math.min(available, Math.round((event.releaseSeconds ?? 0.08) * sampleRate));
    for (let frame = 0; frame < available; frame += 1) {
      const sourcePosition = frame * segment.playbackRateCorrection;
      const sourceIndex = Math.floor(sourcePosition);
      const fraction = sourcePosition - sourceIndex;
      const first = segment.samples[sourceIndex] ?? 0;
      const second = segment.samples[sourceIndex + 1] ?? first;
      const source = first + (second - first) * fraction;
      let gain = (event.gain ?? 0.22) * segment.gainCompensation;
      if (frame >= available - releaseFrames) {
        gain *= Math.max(0, (available - frame - 1) / releaseFrames);
      }
      output[start + frame] += source * gain;
    }
  }
  let peak = 0;
  for (const sample of output) peak = Math.max(peak, Math.abs(sample));
  const scale = peak > 0.88 ? 0.88 / peak : 1;
  if (scale < 1) {
    for (let index = 0; index < output.length; index += 1) output[index] *= scale;
  }
  return output;
}

function chordEvents(frets, when, gain = 0.22, duration = 1.22, occurrence = 0) {
  return frets.flatMap((fret, stringIndex) => fret === null ? [] : [{
    stringIndex,
    fret,
    alternateIndex: (stringIndex * 13 + fret + occurrence) % alternates.length,
    when: when + stringIndex * STRUM_INTERVAL_SECONDS,
    gain,
    maxDuration: duration,
    releaseSeconds: 0.06,
  }]);
}

function writeEvaluation(outputRoot, sourceRoot, name, samples, durationSeconds) {
  const evaluationRoot = join(outputRoot, "evaluation");
  const temporaryRoot = join(sourceRoot, "evaluation");
  mkdirSync(evaluationRoot, { recursive: true });
  mkdirSync(temporaryRoot, { recursive: true });
  const wavPath = join(temporaryRoot, `${name}.wav`);
  const outputPath = join(evaluationRoot, `${name}.mp3`);
  writeWav24(wavPath, samples, 96000);
  encodeMp3(wavPath, outputPath);
  return { file: `evaluation/${name}.mp3`, sha256: sha256(outputPath), durationSeconds };
}

function buildEvaluations(sourceRoot, outputRoot, segments) {
  const isolatedEvents = Array.from({ length: 6 }, (_, stringIndex) => ({
    stringIndex,
    fret: 0,
    when: 0.25 + stringIndex * 1.1,
    gain: 0.55,
    maxDuration: 3.4,
    releaseSeconds: 0.18,
  }));
  const isolatedDuration = 9.2;

  const repeatedEvents = [];
  for (let repeat = 0; repeat < 5; repeat += 1) {
    repeatedEvents.push(...chordEvents(
      [3, 5, 5, 3, 3, 3],
      0.25 + repeat * 1.45,
      0.23,
      1.52,
      repeat % alternates.length,
    ));
  }
  const repeatedDuration = 10.0;

  const comparisonEvents = [
    ...chordEvents([3, 5, 5, 3, 3, 3], 0.35, 0.21, 1.8, 0),
    ...chordEvents([3, 5, 5, 3, 3, 3], 2.55, 0.21, 1.8, 1),
  ];
  const comparisonDuration = 6.8;

  const progression = [
    { frets: [null, 3, 2, 0, 0, 0], beats: 2 },
    { frets: [null, 5, 0, 2, 1, 2], beats: 2 },
    { frets: [3, 5, 0, 0, 0, 2], beats: 2 },
    { frets: [0, 5, 0, 0, 0, 0], beats: 2 },
    { frets: [null, 3, 2, 0, 0, 0], beats: 2 },
    { frets: [null, 5, 0, 2, 1, 2], beats: 2 },
    { frets: [3, 5, 0, 0, 0, 2], beats: 2 },
    { frets: [3, 5, 0, 0, 0, 1], beats: 2 },
    { frets: [null, 3, 2, 0, 0, 0], beats: 2 },
    { frets: [null, 2, 1, 2, 0, 2], beats: 2 },
    { frets: [3, 2, 0, 0, 0, 2], beats: 2 },
    { frets: [0, 2, 0, 1, 0, 0], beats: 2 },
    { frets: [null, 3, 2, 0, 0, 0], beats: 2 },
    { frets: [0, 2, 0, 1, 0, 0], beats: 2 },
    { frets: [null, 0, 2, 0, 1, 0], beats: 2 },
    { frets: [null, 5, 0, 2, 1, 2], beats: 2 },
    { frets: [null, 3, 2, 0, 0, 3], beats: 2 },
    { frets: [null, 5, 0, 2, 1, 2], beats: 2 },
    { frets: [3, 5, 0, 0, 0, 2], beats: 2 },
    { frets: [0, 5, 0, 0, 0, 0], beats: 2 },
    { frets: [null, 3, 2, 0, 0, 0], beats: 2 },
    { frets: [null, 5, 0, 2, 1, 2], beats: 2 },
    { frets: [3, 5, 0, 0, 0, 2], beats: 2 },
    { frets: [3, 5, 0, 0, 0, 1], beats: 2 },
    { frets: [null, 3, 2, 0, 0, 0], beats: 2 },
    { frets: [null, 5, 0, 2, 1, 2], beats: 2 },
    { frets: [3, 5, 0, 0, 0, 2], beats: 4 },
  ];
  const secondsPerBeat = 60 / 66;
  let songCursor = 0.3;
  const songEvents = progression.flatMap(({ frets, beats }, index) => {
    const duration = beats * secondsPerBeat;
    const events = chordEvents(frets, songCursor, 0.2, duration + 0.08, index % alternates.length);
    songCursor += duration;
    return events;
  });
  const songDuration = songCursor + 3.0;

  return [
    writeEvaluation(outputRoot, sourceRoot, "isolated-strings", mixEvents(segments, isolatedEvents, isolatedDuration), isolatedDuration),
    writeEvaluation(outputRoot, sourceRoot, "repeated-g-minor", mixEvents(segments, repeatedEvents, repeatedDuration), repeatedDuration),
    writeEvaluation(outputRoot, sourceRoot, "fixed-timing-comparison", mixEvents(segments, comparisonEvents, comparisonDuration), comparisonDuration),
    writeEvaluation(outputRoot, sourceRoot, "i-wish-you-love-excerpt", mixEvents(segments, songEvents, songDuration), songDuration),
  ];
}

function main() {
  const sourceRootArgument = process.argv.find((argument) => argument.startsWith("--source-root="));
  const outputRootArgument = process.argv.find((argument) => argument.startsWith("--output-root="));
  const sourceRoot = sourceRootArgument ? resolve(sourceRootArgument.split("=")[1]) : DEFAULT_SOURCE_ROOT;
  const outputRoot = outputRootArgument ? resolve(outputRootArgument.split("=")[1]) : DEFAULT_OUTPUT_ROOT;
  const analyzeOnly = process.argv.includes("--analyze-only");
  const analysis = analyzeSources(sourceRoot);
  process.stdout.write(`Validated ${analysis.samples.length} exact physical-string samples across frets 0 through 12.\n`);
  if (analyzeOnly) return;
  const bank = buildSampleBank(sourceRoot, outputRoot, analysis);
  const evaluations = buildEvaluations(sourceRoot, outputRoot, bank.segments);
  const manifestPath = join(outputRoot, "manifest.json");
  const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
  manifest.evaluations = evaluations;
  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);
  process.stdout.write(`Wrote ${bank.manifest.samples.length} MP3 samples and ${evaluations.length} evaluation renders to ${outputRoot}.\n`);
}

main();
