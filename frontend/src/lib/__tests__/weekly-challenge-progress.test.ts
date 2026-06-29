import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  calculateChallengeProgress,
  isChallengeComplete,
  PERFECT_SCORE_THRESHOLD,
} from "../gamification/weekly-challenge-progress";

describe("calculateChallengeProgress", () => {
  const baseContext = { currentStreak: 0, weeklyXpEarned: 0 };

  describe("exercises metric", () => {
    it("increments progress by 1 for each exercise", () => {
      assert.equal(
        calculateChallengeProgress("exercises", 3, { score: 50 }, baseContext),
        4,
      );
    });

    it("increments regardless of score", () => {
      assert.equal(
        calculateChallengeProgress("exercises", 0, { score: 10 }, baseContext),
        1,
      );
      assert.equal(
        calculateChallengeProgress("exercises", 0, { score: 100 }, baseContext),
        1,
      );
    });
  });

  describe("perfect_scores metric", () => {
    it("increments when score >= threshold", () => {
      assert.equal(
        calculateChallengeProgress(
          "perfect_scores",
          2,
          { score: PERFECT_SCORE_THRESHOLD },
          baseContext,
        ),
        3,
      );
    });

    it("increments when score exceeds threshold", () => {
      assert.equal(
        calculateChallengeProgress("perfect_scores", 2, { score: 100 }, baseContext),
        3,
      );
    });

    it("does not increment when score below threshold", () => {
      assert.equal(
        calculateChallengeProgress("perfect_scores", 2, { score: 89 }, baseContext),
        2,
      );
    });
  });

  describe("streak metric", () => {
    it("returns current streak value", () => {
      const ctx = { currentStreak: 7, weeklyXpEarned: 0 };
      assert.equal(
        calculateChallengeProgress("streak", 0, { score: 50 }, ctx),
        7,
      );
    });

    it("returns max of current progress and streak", () => {
      const ctx = { currentStreak: 3, weeklyXpEarned: 0 };
      assert.equal(
        calculateChallengeProgress("streak", 5, { score: 50 }, ctx),
        5,
      );
    });
  });

  describe("xp_weekly metric", () => {
    it("returns weekly EXP total", () => {
      const ctx = { currentStreak: 0, weeklyXpEarned: 450 };
      assert.equal(
        calculateChallengeProgress("xp_weekly", 300, { score: 50 }, ctx),
        450,
      );
    });

    it("returns max of current progress and weekly EXP", () => {
      const ctx = { currentStreak: 0, weeklyXpEarned: 200 };
      assert.equal(
        calculateChallengeProgress("xp_weekly", 500, { score: 50 }, ctx),
        500,
      );
    });
  });

  describe("unknown metric", () => {
    it("returns current progress unchanged", () => {
      assert.equal(
        calculateChallengeProgress("unknown", 5, { score: 80 }, baseContext),
        5,
      );
    });
  });
});

describe("isChallengeComplete", () => {
  it("returns false when progress < target", () => {
    assert.equal(isChallengeComplete(4, 10), false);
  });

  it("returns true when progress equals target", () => {
    assert.equal(isChallengeComplete(10, 10), true);
  });

  it("returns true when progress exceeds target", () => {
    assert.equal(isChallengeComplete(15, 10), true);
  });
});
