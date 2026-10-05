import assert from "node:assert/strict";
import test from "node:test";
import { getIdentityPreviewOffsets } from "./identityPreviewMotion.js";

test("rapid identity changes keep every image on one continuous vertical rail", () => {
  assert.deepEqual(getIdentityPreviewOffsets(4, 0), [0, 100, 200, 300]);
  assert.deepEqual(getIdentityPreviewOffsets(4, 1), [-100, 0, 100, 200]);
  assert.deepEqual(getIdentityPreviewOffsets(4, 2), [-200, -100, 0, 100]);
});
