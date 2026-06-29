import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  STREAK_FIRE_SMALL,
  STREAK_FIRE_MEDIUM,
  STREAK_FIRE_LARGE,
  STREAK_FIRE_DRAGON,
  TOAST_DISPLAY_MS,
  MAX_TOASTS_VISIBLE,
  CONFETTI_COUNT_DESKTOP,
  CONFETTI_COUNT_MOBILE,
  CONFETTI_COLORS,
  LEVELUP_AUTO_DISMISS_MS,
} from "../gamification/constants";

describe("gamification/constants", () => {
  it("streak fire thresholds increase correctly", () => {
    assert.ok(STREAK_FIRE_SMALL < STREAK_FIRE_MEDIUM);
    assert.ok(STREAK_FIRE_MEDIUM < STREAK_FIRE_LARGE);
    assert.ok(STREAK_FIRE_LARGE < STREAK_FIRE_DRAGON);
  });

  it("toast config has reasonable values", () => {
    assert.ok(TOAST_DISPLAY_MS > 0);
    assert.ok(MAX_TOASTS_VISIBLE >= 1);
    assert.ok(MAX_TOASTS_VISIBLE <= 5);
  });

  it("confetti count mobile < desktop", () => {
    assert.ok(CONFETTI_COUNT_MOBILE < CONFETTI_COUNT_DESKTOP);
    assert.ok(CONFETTI_COUNT_MOBILE >= 10);
    assert.ok(CONFETTI_COUNT_DESKTOP <= 200);
  });

  it("confetti colors is non-empty array", () => {
    assert.ok(Array.isArray(CONFETTI_COLORS));
    assert.ok(CONFETTI_COLORS.length >= 4);
  });

  it("levelup auto dismiss is reasonable", () => {
    assert.ok(LEVELUP_AUTO_DISMISS_MS >= 3000);
    assert.ok(LEVELUP_AUTO_DISMISS_MS <= 10000);
  });
});
