import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";
import {
  GUITAR_STRINGS,
  LOGO_G_MINOR_VOICING,
  STRUM_STRING_INTERVAL_SECONDS,
} from "./useLogoAudio.js";

test("logo signature uses the requested G minor shape", () => {
  assert.deepEqual(LOGO_G_MINOR_VOICING, [43, 50, 55, 58, 62, 67]);
  assert.deepEqual(
    LOGO_G_MINOR_VOICING.map((midi, stringIndex) => midi - GUITAR_STRINGS[stringIndex]),
    [3, 5, 5, 3, 3, 3],
  );
});

test("release logo audio contains only the six required guitar notes", async () => {
  const manifestUrl = new URL("../../public/audio/logo-guitar/manifest.json", import.meta.url);
  const manifest = JSON.parse(await readFile(manifestUrl, "utf8"));

  assert.equal(manifest.baseUrl, "/audio/logo-guitar");
  assert.equal(manifest.samples.length, GUITAR_STRINGS.length);
  assert.match(manifest.source, /physical-string recordings/);
  assert.match(manifest.permissionUrl, /^https:\/\//);

  for (let stringIndex = 0; stringIndex < GUITAR_STRINGS.length; stringIndex += 1) {
    const sample = manifest.samples.find((candidate) => candidate.stringIndex === stringIndex);
    assert.ok(sample);
    assert.equal(sample.midi, LOGO_G_MINOR_VOICING[stringIndex]);
    assert.equal(sample.fret, LOGO_G_MINOR_VOICING[stringIndex] - GUITAR_STRINGS[stringIndex]);
    await access(new URL(`../../public/audio/logo-guitar/${sample.file}`, import.meta.url));
  }
});

test("every acoustic strum uses a fixed natural string interval", () => {
  assert.equal(STRUM_STRING_INTERVAL_SECONDS, 0.021);
  assert.ok(Math.abs(STRUM_STRING_INTERVAL_SECONDS * 5 - 0.105) < 1e-9);
});
