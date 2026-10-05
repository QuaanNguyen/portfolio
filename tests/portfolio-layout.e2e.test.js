import assert from "node:assert/strict";
import { spawn } from "node:child_process";
import process from "node:process";
import { after, before, test } from "node:test";
import { chromium } from "playwright-core";

const address = "http://127.0.0.1:4173";

let browser;
let server;

async function waitForServer() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    try {
      const response = await fetch(address);
      if (response.ok) {
        return;
      }
    } catch {
      await new Promise((resolve) => setTimeout(resolve, 100));
      continue;
    }

    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  throw new Error("Portfolio server did not become ready");
}

before(async () => {
  server = spawn(
    process.execPath,
    ["node_modules/vite/bin/vite.js", "--host", "127.0.0.1", "--port", "4173", "--strictPort"],
    { stdio: "ignore" },
  );

  await waitForServer();
  browser = await chromium.launch({ channel: "chrome", headless: true });
});

after(async () => {
  await browser?.close();
  server?.kill();
});

test("desktop layout contains the identity rail and reveals one bounded hover image", async () => {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(address);
  await page.getByRole("button", { name: "enter with sound" }).click();
  await page.locator(".portfolio-home.is-revealed").waitFor();

  const layout = await page.evaluate(() => {
    const main = document.querySelector("main").getBoundingClientRect();
    const identity = document.querySelector(".portfolio-identity-panel").getBoundingClientRect();
    const content = document.querySelector(".portfolio-content-panel").getBoundingClientRect();
    const mobileImages = [...document.querySelectorAll(".identity-mobile-image")];
    const previewImages = [...document.querySelectorAll(".identity-preview-image")];

    return {
      bodyMargin: getComputedStyle(document.body).margin,
      main: { x: main.x, width: main.width },
      identity: { x: identity.x, right: identity.right, width: identity.width },
      content: { x: content.x, right: content.right, width: content.width },
      mobileDisplays: mobileImages.map((image) => getComputedStyle(image).display),
      previewPositions: previewImages.map((image) => getComputedStyle(image).position),
      previewWidths: previewImages.map((image) => image.getBoundingClientRect().width),
    };
  });

  assert.equal(layout.bodyMargin, "0px");
  assert.equal(layout.main.x, 0);
  assert.equal(layout.main.width, 1440);
  assert.ok(layout.identity.width >= 350 && layout.identity.width <= 720);
  assert.ok(layout.content.x >= layout.identity.right - 1);
  assert.ok(layout.content.width >= 600);
  assert.ok(layout.content.right <= 1441);
  assert.deepEqual(layout.mobileDisplays, ["none", "none", "none", "none"]);
  assert.deepEqual(layout.previewPositions, ["absolute", "absolute", "absolute", "absolute"]);
  assert.ok(layout.previewWidths.every((width) => width <= layout.identity.width));

  await page.getByText("overlander", { exact: true }).hover();
  await page.waitForTimeout(700);

  const hoverLayout = await page.evaluate(() => {
    const preview = document.querySelector(".identity-preview");
    const previewRect = preview.getBoundingClientRect();
    const visibleAreas = [...document.querySelectorAll(".identity-preview-image")].map((image) => {
      const imageRect = image.getBoundingClientRect();
      const width = Math.max(0, Math.min(previewRect.right, imageRect.right) - Math.max(previewRect.left, imageRect.left));
      const height = Math.max(0, Math.min(previewRect.bottom, imageRect.bottom) - Math.max(previewRect.top, imageRect.top));
      return width * height;
    });

    return {
      hidden: preview.getAttribute("aria-hidden"),
      previewArea: previewRect.width * previewRect.height,
      visibleAreas,
    };
  });

  assert.equal(hoverLayout.hidden, "false");
  assert.ok(hoverLayout.visibleAreas[1] >= hoverLayout.previewArea * 0.95);
  assert.equal(
    hoverLayout.visibleAreas.filter((area) => area >= hoverLayout.previewArea * 0.95).length,
    1,
  );
  await page.close();
});

test("mobile layout stacks sections without overflow and scrolls the logo away", async () => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 } });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(address);
  await page.getByRole("button", { name: "enter with sound" }).click();
  await page.locator(".portfolio-home.is-revealed").waitFor();

  const mobileLayout = await page.evaluate(() => {
    const home = document.querySelector(".portfolio-home");
    const identity = document.querySelector(".portfolio-identity-panel").getBoundingClientRect();
    const content = document.querySelector(".portfolio-content-panel").getBoundingClientRect();
    const mobileImages = [...document.querySelectorAll(".identity-mobile-image")];
    const firstProject = document.querySelector(".project-list a");
    const projectName = firstProject.querySelector("strong").getBoundingClientRect();
    const projectDescription = firstProject.querySelector("small").getBoundingClientRect();
    const projectArrow = firstProject.querySelector("span").getBoundingClientRect();

    return {
      scrollWidth: home.scrollWidth,
      identity: { x: identity.x, width: identity.width },
      content: { x: content.x, width: content.width },
      mobileImages: mobileImages.map((image) => {
        const rect = image.getBoundingClientRect();
        return { display: getComputedStyle(image).display, width: rect.width, height: rect.height };
      }),
      project: {
        name: { top: projectName.top, bottom: projectName.bottom, right: projectName.right },
        description: { top: projectDescription.top },
        arrow: { top: projectArrow.top, right: projectArrow.right },
      },
      previewDisplay: getComputedStyle(document.querySelector(".identity-preview")).display,
    };
  });

  assert.equal(mobileLayout.scrollWidth, 390);
  assert.deepEqual(mobileLayout.identity, { x: 0, width: 390 });
  assert.deepEqual(mobileLayout.content, { x: 0, width: 390 });
  assert.equal(mobileLayout.previewDisplay, "none");
  assert.ok(Math.abs(mobileLayout.project.arrow.top - mobileLayout.project.name.top) <= 2);
  assert.ok(mobileLayout.project.arrow.right > mobileLayout.project.name.right);
  assert.ok(mobileLayout.project.description.top >= mobileLayout.project.name.bottom);
  assert.ok(
    mobileLayout.mobileImages.every(
      (image) => image.display === "block" && image.width === 80 && image.height === 54,
    ),
  );

  await page.locator(".portfolio-home").evaluate((home) => home.scrollTo(0, 900));
  const logoBottom = await page.locator(".portfolio-logo-anchor").evaluate((logo) => logo.getBoundingClientRect().bottom);
  assert.ok(logoBottom < 0);
  await page.close();
});
