import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  getCurrentWeekKey,
  getCurrentWeekRange,
  generateChallengeForWeek,
} from "../gamification/weekly-challenge";
import { MS_PER_DAY } from "@/lib/gamification/constants";

describe("getCurrentWeekKey", () => {
  it("returns correct ISO week key for a known date", () => {
    // 2026-06-20 is Saturday of week 25
    const key = getCurrentWeekKey(new Date("2026-06-20"));
    assert.equal(key, "2026-W25");
  });

  it("returns same key for Monday-Sunday of same week", () => {
    // 2026-06-15 (Mon) to 2026-06-21 (Sun) should all be same week
    const monday = getCurrentWeekKey(new Date("2026-06-15"));
    const sunday = getCurrentWeekKey(new Date("2026-06-21"));
    assert.equal(monday, sunday);
  });

  it("returns different keys for different weeks", () => {
    const week1 = getCurrentWeekKey(new Date("2026-06-14")); // Sunday week 24
    const week2 = getCurrentWeekKey(new Date("2026-06-15")); // Monday week 25
    assert.notEqual(week1, week2);
  });

  it("format is YYYY-Www", () => {
    const key = getCurrentWeekKey(new Date("2026-01-05"));
    assert.match(key, /^\d{4}-W\d{2}$/);
  });
});

describe("getCurrentWeekRange", () => {
  it("returns Monday to Sunday", () => {
    const { start, end } = getCurrentWeekRange(new Date("2026-06-20"));
    assert.equal(start.getDay(), 1); // Monday
    assert.equal(end.getDay(), 0); // Sunday
  });

  it("start is midnight, end is 23:59:59", () => {
    const { start, end } = getCurrentWeekRange(new Date("2026-06-20"));
    assert.equal(start.getHours(), 0);
    assert.equal(start.getMinutes(), 0);
    assert.equal(end.getHours(), 23);
    assert.equal(end.getMinutes(), 59);
  });

  it("range spans exactly 7 days", () => {
    const { start, end } = getCurrentWeekRange(new Date("2026-06-20"));
    const diffDays = Math.round((end.getTime() - start.getTime()) / MS_PER_DAY);
    assert.equal(diffDays, 7); // Mon 00:00 to Sun 23:59 ≈ 7 days
  });
});

describe("generateChallengeForWeek", () => {
  it("returns a valid template", () => {
    const template = generateChallengeForWeek("2026-W25");
    assert.ok(template.title);
    assert.ok(template.description);
    assert.ok(template.targetMetric);
    assert.ok(template.targetValue > 0);
    assert.ok(template.rewardGems > 0);
  });

  it("is deterministic - same week key returns same template", () => {
    const a = generateChallengeForWeek("2026-W25");
    const b = generateChallengeForWeek("2026-W25");
    assert.equal(a.title, b.title);
    assert.equal(a.targetValue, b.targetValue);
  });

  it("different weeks can produce different templates", () => {
    const templates = new Set<string>();
    for (let w = 1; w <= 52; w++) {
      const t = generateChallengeForWeek(`2026-W${String(w).padStart(2, "0")}`);
      templates.add(t.title);
    }
    // With 52 weeks and 4 templates, we should get at least 2 different ones
    assert.ok(templates.size >= 2, `Only got ${templates.size} unique templates`);
  });
});
