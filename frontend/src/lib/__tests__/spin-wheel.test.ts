import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  canSpin,
  spinWheel,
  SPIN_WHEEL_PRIZES,
  SPIN_ELIGIBLE_STREAK,
} from "../gamification/spin-wheel";

describe("canSpin", () => {
  const today = new Date("2026-06-20T12:00:00");

  it("returns false if streak is below minimum", () => {
    assert.equal(canSpin(2, null, today), false);
    assert.equal(canSpin(0, null, today), false);
  });

  it("returns true if streak >= minimum and never spun", () => {
    assert.equal(canSpin(3, null, today), true);
    assert.equal(canSpin(10, null, today), true);
  });

  it("returns false if already spun today", () => {
    const lastSpin = new Date("2026-06-20T08:00:00");
    assert.equal(canSpin(5, lastSpin, today), false);
  });

  it("returns true if last spin was yesterday", () => {
    const lastSpin = new Date("2026-06-19T23:00:00");
    assert.equal(canSpin(5, lastSpin, today), true);
  });

  it("returns true if last spin was earlier this week", () => {
    const lastSpin = new Date("2026-06-18T10:00:00");
    assert.equal(canSpin(3, lastSpin, today), true);
  });
});

describe("spinWheel", () => {
  it("returns a valid prize from the pool", () => {
    const { prize, rotationDegrees } = spinWheel();
    const validIds = SPIN_WHEEL_PRIZES.map((p) => p.id);
    assert.ok(validIds.includes(prize.id), `Prize id "${prize.id}" not in pool`);
    assert.ok(rotationDegrees > 0, "Rotation should be positive");
  });

  it("rotation includes at least 3 full spins", () => {
    const { rotationDegrees } = spinWheel();
    assert.ok(rotationDegrees >= 360 * 3, `Expected at least 1080°, got ${rotationDegrees}`);
  });

  it("prize has valid value structure", () => {
    const { prize } = spinWheel();
    const hasValue = prize.value.gems || prize.value.xp || prize.value.streakFreezes;
    // "nothing" prize has empty value
    if (prize.id !== "nothing") {
      assert.ok(hasValue, `Prize "${prize.id}" should have a non-empty value`);
    }
  });

  it("distribution roughly matches weights over many spins", () => {
    const counts: Record<string, number> = {};
    const trials = 10000;
    for (let i = 0; i < trials; i++) {
      const { prize } = spinWheel();
      counts[prize.id] = (counts[prize.id] ?? 0) + 1;
    }

    // The highest weight prize (gems_10, weight=25) should appear most often
    const topPrizeCount = counts["gems_10"] ?? 0;
    const jackpotCount = counts["jackpot"] ?? 0;
    assert.ok(
      topPrizeCount > jackpotCount,
      `gems_10 (${topPrizeCount}) should appear more than jackpot (${jackpotCount})`,
    );
  });
});

describe("SPIN_WHEEL_PRIZES", () => {
  it("has 8 prizes (360/45 = 8 segments)", () => {
    assert.equal(SPIN_WHEEL_PRIZES.length, 8);
  });

  it("angles are evenly distributed at 45° intervals", () => {
    for (let i = 0; i < SPIN_WHEEL_PRIZES.length; i++) {
      assert.equal(SPIN_WHEEL_PRIZES[i].angle, i * 45);
    }
  });

  it("total weight is 100", () => {
    const total = SPIN_WHEEL_PRIZES.reduce((sum, p) => sum + p.weight, 0);
    assert.equal(total, 100);
  });
});

describe("SPIN_ELIGIBLE_STREAK", () => {
  it("is 3", () => {
    assert.equal(SPIN_ELIGIBLE_STREAK, 3);
  });
});
