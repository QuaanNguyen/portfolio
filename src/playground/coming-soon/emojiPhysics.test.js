import assert from "node:assert/strict";
import test from "node:test";
import {
  addEmojiBody,
  createPlaygroundPhysics,
  destroyPlaygroundPhysics,
  getEmojiTransforms,
  getPlaygroundEmojiDiameter,
  resizePlaygroundPhysics,
  stepPlaygroundPhysics,
} from "./emojiPhysics.js";

test("emoji sizing stays legible without overwhelming the playground", () => {
  assert.equal(getPlaygroundEmojiDiameter(320, 60), 42);
  assert.equal(getPlaygroundEmojiDiameter(1440, 220), 68);
});

test("emoji bodies fall, collide, and settle inside the playground", () => {
  const physics = createPlaygroundPhysics(320, 150);
  addEmojiBody(physics, { diameter: 52, id: "first", random: () => 0.5 });
  addEmojiBody(physics, { diameter: 52, id: "second", random: () => 0.5 });

  for (let index = 0; index < 420; index += 1) {
    stepPlaygroundPhysics(physics, 1000 / 60);
  }

  const [first, second] = getEmojiTransforms(physics);
  const distance = Math.hypot(
    first.centerX - second.centerX,
    first.centerY - second.centerY,
  );
  assert.ok(first.centerY <= 150 - first.radius + 1);
  assert.ok(second.centerY <= 150 - second.radius + 1);
  assert.ok(distance >= first.radius + second.radius - 2);
  destroyPlaygroundPhysics(physics);
});

test("resizing rebuilds the collision bounds and keeps bodies inside", () => {
  const physics = createPlaygroundPhysics(500, 180);
  addEmojiBody(physics, { diameter: 60, id: "emoji", random: () => 0.99 });
  resizePlaygroundPhysics(physics, 240, 120);
  const [emoji] = getEmojiTransforms(physics);
  assert.ok(emoji.centerX <= 240 - emoji.radius);
  assert.ok(emoji.centerY <= 120 - emoji.radius);
  destroyPlaygroundPhysics(physics);
});
