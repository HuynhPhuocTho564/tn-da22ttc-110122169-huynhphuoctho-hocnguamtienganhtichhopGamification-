/**
 * Weekly Challenge Logic
 *
 * Pure functions for week key calculation and challenge generation.
 *
 * @module gamification/weekly-challenge
 */

import { MS_PER_DAY } from "./constants";

/**
 * Challenge template pool — randomly assigned each week.
 * Reward diamonds are calibrated to challenge difficulty:
 * - 7-day streak (200) = high effort, high reward
 * - 10 exercises (150) = moderate effort
 * - 5 perfect scores (250) = highest effort, highest reward
 * - 500 EXP weekly (100) = easiest, lowest reward
 */
const CHALLENGE_TEMPLATES = [
  {
    title: "7 ngày liên tiếp",
    description: "Điểm danh 7 ngày liên tiếp trong tuần này",
    targetMetric: "streak" as const,
    targetValue: 7,
    rewardGems: 200,
  },
  {
    title: "Hoàn thành 10 bài",
    description: "Hoàn thành 10 bài tập bất kỳ trong tuần",
    targetMetric: "exercises" as const,
    targetValue: 10,
    rewardGems: 150,
  },
  {
    title: "Đạt 90%+ trong 5 bài",
    description: "Đạt điểm 90% trở lên trong 5 bài tập",
    targetMetric: "perfect_scores" as const,
    targetValue: 5,
    rewardGems: 250,
  },
  {
    title: "Tích lũy 500 EXP",
    description: "Tích lũy 500 EXP trong tuần này",
    targetMetric: "xp_weekly" as const,
    targetValue: 500,
    rewardGems: 100,
  },
];

/**
 * Get ISO week key for a date. Format: "YYYY-Www"
 * @example getCurrentWeekKey(new Date("2026-06-20")) → "2026-W25"
 */
export function getCurrentWeekKey(date: Date = new Date()): string {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / MS_PER_DAY + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/**
 * Get start (Monday) and end (Sunday) of the current ISO week.
 */
export function getCurrentWeekRange(date: Date = new Date()): { start: Date; end: Date } {
  const d = new Date(date);
  const day = d.getDay() || 7;
  const monday = new Date(d);
  monday.setDate(d.getDate() - day + 1);
  monday.setHours(0, 0, 0, 0);

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  return { start: monday, end: sunday };
}

/**
 * Generate a deterministic challenge for a given week key.
 * Uses a simple hash of the week key to pick from templates.
 */
export function generateChallengeForWeek(weekKey: string): (typeof CHALLENGE_TEMPLATES)[number] {
  // Simple deterministic hash from string
  let hash = 0;
  for (let i = 0; i < weekKey.length; i++) {
    hash = (hash * 31 + weekKey.charCodeAt(i)) & 0x7fffffff;
  }
  return CHALLENGE_TEMPLATES[hash % CHALLENGE_TEMPLATES.length];
}
