import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { computeMasteryPercentage, getMasteryTier } from "../gamification/mastery";

describe("gamification/mastery", () => {
  describe("computeMasteryPercentage", () => {
    it("returns 0 when totalExercises is 0", () => {
      assert.equal(computeMasteryPercentage(0, 0, 100), 0);
    });

    it("returns 100 when all exercises completed with perfect score", () => {
      assert.equal(computeMasteryPercentage(10, 10, 100), 100);
    });

    it("returns 60 when all completed but 0 score", () => {
      // completion=100% * 0.6 = 60, score=0 * 0.4 = 0 → total = 60
      assert.equal(computeMasteryPercentage(10, 10, 0), 60);
    });

    it("returns 40 when 0 completed but 100 avg score", () => {
      // completion=0 * 0.6 = 0, score=100% * 0.4 = 40 → total = 40
      assert.equal(computeMasteryPercentage(0, 10, 100), 40);
    });

    it("calculates mixed scenario correctly", () => {
      // 5/10 completed (50% * 0.6 = 30), 80 avg (80% * 0.4 = 32) → 62
      assert.equal(computeMasteryPercentage(5, 10, 80), 62);
    });

    it("caps at 100 even with over-completion", () => {
      // More completed than total shouldn't exceed 100
      const result = computeMasteryPercentage(15, 10, 100);
      assert.equal(result, 100);
    });
  });

  describe("getMasteryTier", () => {
    it("returns none for 0%", () => {
      assert.equal(getMasteryTier(0), "none");
    });

    it("returns bronze for 1-49%", () => {
      assert.equal(getMasteryTier(1), "bronze");
      assert.equal(getMasteryTier(49), "bronze");
    });

    it("returns silver for 50-99%", () => {
      assert.equal(getMasteryTier(50), "silver");
      assert.equal(getMasteryTier(99), "silver");
    });

    it("returns gold for 100%", () => {
      assert.equal(getMasteryTier(100), "gold");
    });
  });
});
