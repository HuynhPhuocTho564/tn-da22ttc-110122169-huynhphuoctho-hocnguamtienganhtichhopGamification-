import test from "node:test";
import assert from "node:assert/strict";
import {
  calculateTransitions,
} from "@/lib/gamification/season-transition";
import {
  getNextTier,
  getPrevTier,
  getGemReward,
  TIER_PROMOTION_COUNT,
  TIER_DEMOTION_COUNT,
} from "@/lib/gamification/league";

// ─── Helper ───────────────────────────────────────────────────

function makeEntries(count: number) {
  return Array.from({ length: count }, (_, i) => ({
    userId: `user-${i + 1}`,
    score: 1000 - i * 10, // descending scores
  }));
}

// ─── Tier Navigation ──────────────────────────────────────────

test("getNextTier: bronze → silver", () => {
  assert.equal(getNextTier("bronze"), "silver");
});

test("getNextTier: gold → diamond", () => {
  assert.equal(getNextTier("gold"), "diamond");
});

test("getNextTier: legend stays legend (max)", () => {
  assert.equal(getNextTier("legend"), "legend");
});

test("getPrevTier: silver → bronze", () => {
  assert.equal(getPrevTier("silver"), "bronze");
});

test("getPrevTier: bronze stays bronze (min)", () => {
  assert.equal(getPrevTier("bronze"), "bronze");
});

// ─── Diamond Rewards ──────────────────────────────────────────────
// THIETKE refactor 2026-06-26: top 7 giảm dần [50, 40, 30, 20, 15, 10, 5].

test("getGemReward: rank 1 = 50 diamonds", () => {
  assert.equal(getGemReward(1), 50);
});

test("getGemReward: rank 7 = 5 diamonds", () => {
  assert.equal(getGemReward(7), 5);
});

test("getGemReward: rank 8+ = 0 diamonds", () => {
  assert.equal(getGemReward(8), 0);
  assert.equal(getGemReward(10), 0);
});

test("getGemReward: rank 0 or negative = 0", () => {
  assert.equal(getGemReward(0), 0);
  assert.equal(getGemReward(-1), 0);
});

// ─── Promotion Logic ──────────────────────────────────────────
// THIETKE Micro-Leaderboards: cohort 30 → top 7 (top ~20%) lên hạng.

test("calculateTransitions: top 7 promoted in bronze tier", () => {
  const entries = makeEntries(30);
  const results = calculateTransitions(entries, "bronze");

  const promoted = results.filter((r) => r.action === "promoted");
  assert.equal(promoted.length, TIER_PROMOTION_COUNT);

  // All promoted users should be rank 1-7
  for (const p of promoted) {
    assert.ok(p.rankInTier <= TIER_PROMOTION_COUNT);
    assert.equal(p.fromTier, "bronze");
    assert.equal(p.toTier, "silver");
  }
});

test("calculateTransitions: top 7 get diamonds graduated [50,40,30,20,15,10,5]", () => {
  const entries = makeEntries(20);
  const results = calculateTransitions(entries, "bronze");

  const promoted = results.filter((r) => r.action === "promoted");
  const withGems = promoted.filter((r) => r.gemsEarned > 0);
  assert.equal(withGems.length, 7);
  assert.equal(withGems[0]!.gemsEarned, 50); // rank 1
  assert.equal(withGems[1]!.gemsEarned, 40); // rank 2
  assert.equal(withGems[2]!.gemsEarned, 30); // rank 3
  assert.equal(withGems[3]!.gemsEarned, 20); // rank 4
  assert.equal(withGems[4]!.gemsEarned, 15); // rank 5
  assert.equal(withGems[5]!.gemsEarned, 10); // rank 6
  assert.equal(withGems[6]!.gemsEarned, 5);  // rank 7
});

test("calculateTransitions: legend tier doesn't promote further", () => {
  const entries = makeEntries(15);
  const results = calculateTransitions(entries, "legend");

  const promoted = results.filter((r) => r.action === "promoted");
  // Legend players still get "promoted" action but toTier stays legend
  for (const p of promoted) {
    assert.equal(p.toTier, "legend");
  }
});

// ─── Demotion Logic ───────────────────────────────────────────
// THIETKE Micro-Leaderboards: bottom 7 (bottom ~20%) rớt hạng.

test("calculateTransitions: bottom 7 demoted when enough players", () => {
  const entries = makeEntries(30); // 30 >= MIN_PLAYERS_FOR_DEMOTION
  const results = calculateTransitions(entries, "silver");

  const demoted = results.filter((r) => r.action === "demoted");
  assert.equal(demoted.length, TIER_DEMOTION_COUNT);

  for (const d of demoted) {
    assert.equal(d.fromTier, "silver");
    assert.equal(d.toTier, "bronze");
    assert.equal(d.gemsEarned, 0);
  }
});

test("calculateTransitions: no demotion in bronze tier", () => {
  const entries = makeEntries(30);
  const results = calculateTransitions(entries, "bronze");

  const demoted = results.filter((r) => r.action === "demoted");
  assert.equal(demoted.length, 0); // Bronze can't go lower
});

test("calculateTransitions: no demotion when too few players", () => {
  const entries = makeEntries(12); // 12 < MIN_PLAYERS_FOR_DEMOTION (15)
  const results = calculateTransitions(entries, "gold");

  const demoted = results.filter((r) => r.action === "demoted");
  assert.equal(demoted.length, 0);
});

// ─── Edge Cases ───────────────────────────────────────────────

test("calculateTransitions: empty entries returns empty", () => {
  const results = calculateTransitions([], "bronze");
  assert.equal(results.length, 0);
});

test("calculateTransitions: single player gets promoted", () => {
  const entries = [{ userId: "solo", score: 100 }];
  const results = calculateTransitions(entries, "bronze");

  assert.equal(results.length, 1);
  assert.equal(results[0]!.action, "promoted");
  assert.equal(results[0]!.gemsEarned, 50); // rank 1
});

test("calculateTransitions: exactly 7 players — all promoted, none demoted", () => {
  const entries = makeEntries(TIER_PROMOTION_COUNT);
  const results = calculateTransitions(entries, "silver");

  const promoted = results.filter((r) => r.action === "promoted");
  const demoted = results.filter((r) => r.action === "demoted");

  assert.equal(promoted.length, TIER_PROMOTION_COUNT);
  assert.equal(demoted.length, 0); // Not enough for demotion
});

test("calculateTransitions: middle players stay in same tier", () => {
  const entries = makeEntries(30);
  const results = calculateTransitions(entries, "gold");

  const stayed = results.filter((r) => r.action === "stayed");
  // 30 players: top 7 promoted + bottom 7 demoted = 16 stayed
  assert.equal(stayed.length, 30 - TIER_PROMOTION_COUNT - TIER_DEMOTION_COUNT);

  for (const s of stayed) {
    assert.equal(s.fromTier, "gold");
    assert.equal(s.toTier, "gold");
    assert.equal(s.gemsEarned, 0);
  }
});
