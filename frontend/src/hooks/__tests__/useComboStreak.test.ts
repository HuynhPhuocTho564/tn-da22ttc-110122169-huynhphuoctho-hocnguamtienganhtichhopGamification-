import assert from "node:assert/strict";
import test from "node:test";
import {
  pickPraise,
  comboMilestoneLevel,
  nextComboStateOnCorrect,
  nextComboStateOnWrong,
  type ComboState,
} from "../../hooks/useComboStreak";

test("pickPraise: trả về 1 trong danh sách lời khen", () => {
  const praises = ["Chính xác!", "Giỏi lắm!", "Rất tốt!", "Đỉnh quá!", "Bạn làm được rồi!"];
  const result = pickPraise();
  assert.ok(praises.includes(result), `${result} không trong danh sách`);
});

test("comboMilestoneLevel: combo 0-2 → 0 (chưa milestone)", () => {
  assert.equal(comboMilestoneLevel(0), 0);
  assert.equal(comboMilestoneLevel(2), 0);
});

test("comboMilestoneLevel: combo 3-4 → 1, 5-6 → 2, ≥7 → 3", () => {
  assert.equal(comboMilestoneLevel(3), 1);
  assert.equal(comboMilestoneLevel(4), 1);
  assert.equal(comboMilestoneLevel(5), 2);
  assert.equal(comboMilestoneLevel(6), 2);
  assert.equal(comboMilestoneLevel(7), 3);
  assert.equal(comboMilestoneLevel(10), 3);
});

test("nextComboStateOnCorrect: đúng → combo+1, praise ở milestone mới", () => {
  const state: ComboState = { combo: 2, praise: null };
  const next = nextComboStateOnCorrect(state);
  assert.equal(next.combo, 3);
  assert.ok(next.praise !== null, "milestone 3 phải có praise");
});

test("nextComboStateOnCorrect: đúng nhưng chưa milestone → praise null", () => {
  const state: ComboState = { combo: 1, praise: null };
  const next = nextComboStateOnCorrect(state);
  assert.equal(next.combo, 2);
  assert.equal(next.praise, null);
});

test("nextComboStateOnWrong: sai → combo 0, praise null", () => {
  const state: ComboState = { combo: 5, praise: "Giỏi lắm!" };
  const next = nextComboStateOnWrong(state);
  assert.equal(next.combo, 0);
  assert.equal(next.praise, null);
});
