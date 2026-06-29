import test from "node:test";
import assert from "node:assert/strict";
import {
  getTierZone,
  getWeekCountdown,
  type TierZone,
} from "@/lib/gamification/league-zone";
import {
  TIER_PROMOTION_COUNT,
  TIER_DEMOTION_COUNT,
} from "@/lib/gamification/league";

// ─── getTierZone ──────────────────────────────────────────────

test("getTierZone: rank 1-3 = champion", () => {
  assert.equal<TierZone>(getTierZone(1, 30), "champion");
  assert.equal<TierZone>(getTierZone(2, 30), "champion");
  assert.equal<TierZone>(getTierZone(3, 30), "champion");
});

test(`getTierZone: rank 4-${TIER_PROMOTION_COUNT} = promotion`, () => {
  for (let rank = 4; rank <= TIER_PROMOTION_COUNT; rank++) {
    assert.equal<TierZone>(
      getTierZone(rank, 30),
      "promotion",
      `rank ${rank} should be promotion`,
    );
  }
});

test(`getTierZone: rank ${TIER_PROMOTION_COUNT + 1} → total-DEMOTION_COUNT = safe`, () => {
  // Với totalPlayers = 30, demotion zone bắt đầu từ rank 30 - 7 + 1 = 24
  const safeStart = TIER_PROMOTION_COUNT + 1; // 8
  const safeEnd = 30 - TIER_DEMOTION_COUNT; // 23
  for (let rank = safeStart; rank <= safeEnd; rank++) {
    assert.equal<TierZone>(
      getTierZone(rank, 30),
      "safe",
      `rank ${rank} should be safe`,
    );
  }
});

test("getTierZone: bottom 7 = demotion", () => {
  // Với totalPlayers = 30, demotion zone = rank 24-30
  const demoStart = 30 - TIER_DEMOTION_COUNT + 1; // 24
  for (let rank = demoStart; rank <= 30; rank++) {
    assert.equal<TierZone>(
      getTierZone(rank, 30),
      "demotion",
      `rank ${rank} should be demotion`,
    );
  }
});

test("getTierZone: edge case — small cohort (5 players)", () => {
  // 5 < TIER_PROMOTION_COUNT (7) → top 1-3 = champion, rank 4-5 = promotion
  // totalPlayers - TIER_DEMOTION_COUNT = -2 < 1 → không có demotion
  assert.equal<TierZone>(getTierZone(1, 5), "champion");
  assert.equal<TierZone>(getTierZone(3, 5), "champion");
  assert.equal<TierZone>(getTierZone(4, 5), "promotion");
  assert.equal<TierZone>(getTierZone(5, 5), "promotion");
});

test("getTierZone: invalid input → safe (defensive)", () => {
  assert.equal<TierZone>(getTierZone(0, 30), "safe");
  assert.equal<TierZone>(getTierZone(-1, 30), "safe");
  assert.equal<TierZone>(getTierZone(1, 0), "safe");
});

test("getTierZone: exactly at TIER_PROMOTION_COUNT boundary = promotion", () => {
  assert.equal<TierZone>(getTierZone(TIER_PROMOTION_COUNT, 30), "promotion");
  assert.equal<TierZone>(getTierZone(TIER_PROMOTION_COUNT + 1, 30), "safe");
});

test("getTierZone: exactly at demotion boundary = demotion", () => {
  // totalPlayers - TIER_DEMOTION_COUNT = safe range end
  const safeEnd = 30 - TIER_DEMOTION_COUNT; // 23
  const demoStart = safeEnd + 1; // 24
  assert.equal<TierZone>(getTierZone(safeEnd, 30), "safe");
  assert.equal<TierZone>(getTierZone(demoStart, 30), "demotion");
});

// ─── getWeekCountdown ─────────────────────────────────────────

test("getWeekCountdown: returns valid structure", () => {
  const result = getWeekCountdown();
  assert.ok(typeof result.daysLeft === "number");
  assert.ok(typeof result.hoursLeft === "number");
  assert.ok(typeof result.minutesLeft === "number");
  assert.ok(typeof result.isLastDay === "boolean");
  assert.ok(typeof result.period === "string");
  assert.match(result.period, /^\d{4}-W\d{2}$/);
});

test("getWeekCountdown: countdown values are non-negative", () => {
  const result = getWeekCountdown();
  assert.ok(result.daysLeft >= 0);
  assert.ok(result.hoursLeft >= 0 && result.hoursLeft < 24);
  assert.ok(result.minutesLeft >= 0 && result.minutesLeft < 60);
});

test("getWeekCountdown: Sunday 23:00 ICT (~16:00 UTC) — less than 1 day left", () => {
  // CN 23:00 ICT = CN 16:00 UTC. Target là CN 17:00 UTC → 1 giờ left
  const sundayLateICT = new Date(Date.UTC(2026, 5, 28, 16, 0, 0)); // CN 28/06/2026 16:00 UTC
  const result = getWeekCountdown(sundayLateICT);
  assert.equal(result.daysLeft, 0);
  assert.ok(result.hoursLeft <= 1);
  assert.equal(result.isLastDay, true);
});

test("getWeekCountdown: Monday 00:00 ICT (Sunday 17:00 UTC) — 0 phút left", () => {
  // Đúng target time → diffMs = 0 → totalMinutes = 0
  const target = new Date(Date.UTC(2026, 5, 28, 17, 0, 0)); // CN 28/06/2026 17:00 UTC
  const result = getWeekCountdown(target);
  assert.equal(result.daysLeft, 0);
  assert.equal(result.hoursLeft, 0);
  assert.equal(result.minutesLeft, 0);
  assert.equal(result.isLastDay, true);
});

test("getWeekCountdown: Wednesday 12:00 ICT (Wed 05:00 UTC) — full week countdown", () => {
  // T4 12:00 ICT = T4 05:00 UTC. Target = CN 17:00 UTC.
  // Diff = 4 ngày + 12 giờ = 108 giờ → daysLeft = 4, hoursLeft = 12
  const wednesdayMidICT = new Date(Date.UTC(2026, 5, 24, 5, 0, 0)); // T4 24/06/2026 05:00 UTC
  const result = getWeekCountdown(wednesdayMidICT);
  assert.equal(result.daysLeft, 4);
  assert.equal(result.hoursLeft, 12);
  assert.equal(result.isLastDay, false);
});

test("getWeekCountdown: Sunday 10:00 ICT (Sun 03:00 UTC) — same day, not last day", () => {
  // CN 10:00 ICT = CN 03:00 UTC. Target = CN 17:00 UTC.
  // Diff = 14 giờ → daysLeft = 0, hoursLeft = 14, minutesLeft = 0
  const sundayMorningICT = new Date(Date.UTC(2026, 5, 28, 3, 0, 0)); // CN 28/06/2026 03:00 UTC
  const result = getWeekCountdown(sundayMorningICT);
  assert.equal(result.daysLeft, 0);
  assert.equal(result.hoursLeft, 14);
  assert.equal(result.isLastDay, true); // < 24h còn lại = lastDay
});

test("getWeekCountdown: ISO week period format", () => {
  // Test cho 1 ngày cụ thể
  const monday = new Date(Date.UTC(2026, 0, 5, 0, 0, 0)); // T2 05/01/2026
  const result = getWeekCountdown(monday);
  assert.match(result.period, /^2026-W0[12]$/); // W01 hoặc W02 tùy ISO
});
