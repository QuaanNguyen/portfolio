import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const playgroundPath = new URL("./PlaygroundUnderConstruction.jsx", import.meta.url);
const logoPath = new URL("./PrototypeLogo.jsx", import.meta.url);
const homeStylesPath = new URL("./portfolio-home.css", import.meta.url);
const indexPath = new URL("../../../index.html", import.meta.url);
const faviconPath = new URL("../../../logo/favicon.svg", import.meta.url);

test("the playground uses emoji bodies without the inflating canvas", async () => {
  const source = await readFile(playgroundPath, "utf8");
  assert.match(source, /addEmojiBody/);
  assert.match(source, /\/\/ coming soon/);
  assert.doesNotMatch(source, /canvas|Inflating|WebGL/);
});

test("the favicon uses the blue logo mark without dot decoration", async () => {
  const [page, favicon] = await Promise.all([
    readFile(indexPath, "utf8"),
    readFile(faviconPath, "utf8"),
  ]);
  const paths = favicon.match(/<path\b/g) ?? [];
  const viewBox = favicon.match(/viewBox="([^"]+)"/)?.[1]
    .split(/\s+/)
    .map(Number);
  assert.match(page, /href="\/logo\/favicon\.svg"/);
  assert.match(favicon, /#3976d9/i);
  assert.equal(paths.length, 6);
  assert.ok(viewBox[2] < 121);
  assert.ok(viewBox[3] < 223);
  assert.doesNotMatch(favicon, /<circle|dots/i);
});

test("the animated logo does not render six staging dots", async () => {
  const source = await readFile(logoPath, "utf8");
  assert.doesNotMatch(source, /const DOTS|<Motion\.i|borderRadius:\s*"50%"/);
});

test("the playground button keeps its original grid position", async () => {
  const source = await readFile(homeStylesPath, "utf8");
  const desktopRule = source.match(/\.playground-section > button\s*\{([^}]*)\}/)?.[1] ?? "";
  const responsiveStyles = source.slice(source.indexOf("@media (max-width: 1024px)"));
  assert.match(desktopRule, /grid-column:\s*3;/);
  assert.match(responsiveStyles, /\.playground-section > button\s*\{[^}]*grid-column:\s*1;[^}]*grid-row:\s*3;/);
});
