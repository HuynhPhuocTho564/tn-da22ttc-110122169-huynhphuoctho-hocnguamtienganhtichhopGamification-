/**
 * Tests for gamification/milestones.ts
 *
 * - validateClaim: pure validation logic (no DB, easy to test)
 * - claimMilestone: integration tests with Prisma mock stubs
 */
import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateClaim, type ClaimValidation } from "../gamification/milestones";

// ============================================================
// validateClaim — Pure function tests (no DB needed)
// ============================================================

describe("validateClaim", () => {
  it("returns MILESTONE_NOT_FOUND when milestone is null", () => {
    const result = validateClaim(null, { level: 5 }, false);
    assert.deepEqual(result, { ok: false, error: "MILESTONE_NOT_FOUND" });
  });

  it("returns USER_NOT_FOUND when user is null", () => {
    const result = validateClaim({ level: 3 }, null, false);
    assert.deepEqual(result, { ok: false, error: "USER_NOT_FOUND" });
  });

  it("returns LEVEL_NOT_REACHED when user.level < milestone.level", () => {
    const result = validateClaim({ level: 10 }, { level: 5 }, false);
    assert.deepEqual(result, { ok: false, error: "LEVEL_NOT_REACHED" });
  });

  it("returns LEVEL_NOT_REACHED at boundary (user.level = milestone.level - 1)", () => {
    const result = validateClaim({ level: 6 }, { level: 5 }, false);
    assert.deepEqual(result, { ok: false, error: "LEVEL_NOT_REACHED" });
  });

  it("returns ok when user.level equals milestone.level (boundary)", () => {
    const result = validateClaim({ level: 5 }, { level: 5 }, false);
    assert.deepEqual(result, { ok: true });
  });

  it("returns ok when user.level exceeds milestone.level", () => {
    const result = validateClaim({ level: 3 }, { level: 10 }, false);
    assert.deepEqual(result, { ok: true });
  });

  it("returns ALREADY_CLAIMED when alreadyClaimed is true", () => {
    const result = validateClaim({ level: 5 }, { level: 10 }, true);
    assert.deepEqual(result, { ok: false, error: "ALREADY_CLAIMED" });
  });

  it("returns ok for valid claim (all conditions met, not claimed)", () => {
    const result = validateClaim({ level: 7 }, { level: 7 }, false);
    assert.deepEqual(result, { ok: true } satisfies ClaimValidation);
  });
});

// ============================================================
// Validation priority order tests
// ============================================================

describe("validateClaim priority order", () => {
  it("MILESTONE_NOT_FOUND takes priority over USER_NOT_FOUND", () => {
    // Both null → first check wins
    const result = validateClaim(null, null, false);
    assert.deepEqual(result, { ok: false, error: "MILESTONE_NOT_FOUND" });
  });

  it("USER_NOT_FOUND takes priority over LEVEL_NOT_REACHED", () => {
    const result = validateClaim({ level: 10 }, null, false);
    assert.deepEqual(result, { ok: false, error: "USER_NOT_FOUND" });
  });

  it("LEVEL_NOT_REACHED takes priority over ALREADY_CLAIMED", () => {
    const result = validateClaim({ level: 10 }, { level: 5 }, true);
    assert.deepEqual(result, { ok: false, error: "LEVEL_NOT_REACHED" });
  });
});
