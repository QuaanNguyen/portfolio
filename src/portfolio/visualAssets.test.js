import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const playgroundPath = new URL("../playground/coming-soon/ComingSoonSection.jsx", import.meta.url);
const logoPath = new URL("./PrototypeLogo.jsx", import.meta.url);
const portfolioStylesPath = new URL("./portfolio.css", import.meta.url);
const portfolioFontPath = new URL("./assets/fonts/hedvig-letters-sans-latin.woff2", import.meta.url);
const indexPath = new URL("../../index.html", import.meta.url);
const faviconPath = new URL("../../logo/favicon.svg", import.meta.url);

test("the playground uses emoji bodies without the inflating canvas", async () => {
  const source = await readFile(playgroundPath, "utf8");
  assert.match(source, /addEmojiBody/);
  assert.match(source, /\/\/ coming soon/);
  assert.doesNotMatch(source, /canvas|Inflating|WebGL/);
});

test("the favicon uses the blue logo mark with its six surname dots", async () => {
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
  assert.equal(paths.length, 12);
  assert.ok(viewBox[2] < 121);
  assert.ok(viewBox[3] < 223);
});

test("the animated logo stages six dots that become the surname", async () => {
  const source = await readFile(logoPath, "utf8");
  const dots = source.match(/const DOTS = \[([^\]]*)\]/)?.[1] ?? "";
  assert.equal(dots.match(/size:/g)?.length, 6);
  assert.match(source, /<Motion\.i/);
});

test("the portfolio typeface is bundled with the release", async () => {
  const styles = await readFile(portfolioStylesPath, "utf8");
  assert.match(styles, /@font-face/);
  assert.match(styles, /hedvig-letters-sans-latin\.woff2/);
  assert.doesNotMatch(styles, /fonts\.googleapis\.com/);
  await access(portfolioFontPath);
});

test("the playground button keeps its original grid position", async () => {
  const source = await readFile(portfolioStylesPath, "utf8");
  const desktopRule = source.match(/\.playground-section > \.playground-enter\s*\{([^}]*)\}/)?.[1] ?? "";
  const responsiveStyles = source.slice(source.indexOf("@media (max-width: 1024px)"));
  assert.match(desktopRule, /grid-column:\s*3;/);
  assert.match(responsiveStyles, /\.playground-section > \.playground-enter\s*\{[^}]*grid-column:\s*1;[^}]*grid-row:\s*3;/);
});
