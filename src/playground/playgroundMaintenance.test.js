import assert from "node:assert/strict";
import test from "node:test";
import { isMaintenanceOn } from "./playgroundMaintenance.js";

test("the playground stays in maintenance unless the flag is explicitly off", () => {
  assert.equal(isMaintenanceOn(undefined), true);
  assert.equal(isMaintenanceOn(""), true);
  assert.equal(isMaintenanceOn("on"), true);
  assert.equal(isMaintenanceOn("off"), false);
  assert.equal(isMaintenanceOn(" OFF "), false);
});
