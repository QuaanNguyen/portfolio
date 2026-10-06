import assert from "node:assert/strict";
import test from "node:test";
import {
  SAD_EMOJI_CATALOG,
  selectSadEmoji,
} from "./sadEmojiCatalog.js";

test("the sad emoji catalog exposes reusable labeled objects", () => {
  const emojis = Object.values(SAD_EMOJI_CATALOG);
  assert.ok(emojis.length >= 8);
  assert.ok(emojis.every((emoji) => emoji.id && emoji.glyph && emoji.label));
});

test("an emoji repeats only after four different emojis have dropped", () => {
  const recentIds = [];
  const drops = [];

  for (let index = 0; index < 6; index += 1) {
    const emoji = selectSadEmoji(recentIds, () => 0);
    drops.push(emoji.id);
    recentIds.push(emoji.id);
  }

  assert.equal(new Set(drops.slice(0, 5)).size, 5);
  assert.equal(drops[5], drops[0]);
});

test("selection never returns one of the previous four emojis", () => {
  const recentIds = Object.keys(SAD_EMOJI_CATALOG).slice(0, 4);
  const emoji = selectSadEmoji(recentIds, () => 0.999999);
  assert.ok(!recentIds.includes(emoji.id));
});
