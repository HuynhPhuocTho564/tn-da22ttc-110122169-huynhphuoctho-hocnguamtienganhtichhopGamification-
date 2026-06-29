import assert from "node:assert/strict";
import test from "node:test";
import { colorForRms } from "../useWaveformRecorder";

test("colorForRms: rms < 0.05 (im/nhỏ) → xám #94A3B8", () => {
  assert.equal(colorForRms(0.02), "#94A3B8");
});

test("colorForRms: 0.05 ≤ rms < 0.25 (chuẩn) → xanh dương #60A5FA", () => {
  assert.equal(colorForRms(0.15), "#60A5FA");
});

test("colorForRms: rms ≥ 0.25 (quá to) → vàng #FBBF24", () => {
  assert.equal(colorForRms(0.30), "#FBBF24");
});
