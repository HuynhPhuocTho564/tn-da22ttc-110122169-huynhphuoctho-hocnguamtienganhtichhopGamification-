/**
 * Missions — Constants, pure helpers, DB queries cho trang /missions.
 *
 * Single source of truth cho:
 * - MISSION_TIERS: phân cấp độ khó (Goal-Setting Theory — 3-Tier Quests)
 * - TREASURE_CHEST_REWARD: phần thưởng Rương Kho Báu (Octalysis CD2+CD6+CD7)
 * - MISSION_POOL: 4 nhiệm vụ generic (SDT Autonomy — không hardcode đảo)
 *
 * Pure helpers (test không cần mock DB) tách khỏi DB queries.
 */

import { prisma } from "@/lib/prisma";

// ─── Constants ──────────────────────────────────────────────────────────

/** 3 tầng độ khó theo Goal-Setting Theory (Locke & Latham) */
export const MISSION_TIERS = {
  1: {
    label: "Tầng 1 — Mồi nhử",
    icon: "🥉",
    bgClass: "bg-amber-100",
    textClass: "text-amber-800",
    borderClass: "border-amber-300",
  },
  2: {
    label: "Tầng 2 — Thử thách",
    icon: "🥈",
    bgClass: "bg-primary-100",
    textClass: "text-primary-800",
    borderClass: "border-primary-300",
  },
  3: {
    label: "Tầng 3 — Khám phá",
    icon: "🥇",
    bgClass: "bg-success-100",
    textClass: "text-success-800",
    borderClass: "border-success-300",
  },
} as const;

export type MissionTierKey = keyof typeof MISSION_TIERS;

/** Phần thưởng Rương Kho Báu khi hoàn thành TẤT CẢ nhiệm vụ trong ngày (Octalysis CD7 — Surprise) */
export const TREASURE_CHEST_REWARD = {
  baseXp: 100,
  baseGems: 20,
} as const;

// ─── Mission types ──────────────────────────────────────────────────────

export type MissionType = "general_count" | "high_score_count" | "perfect_count";

export type MissionTier = MissionTierKey;

export interface MissionDef {
  readonly id: string;
  readonly tier: MissionTier;
  readonly title: string;
  readonly description: string;
  readonly target: number;
  readonly rewardXp: number;
  readonly rewardGems: number;
  readonly type: MissionType;
}

/**
 * 4 nhiệm vụ generic, KHÔNG nhắc đảo cụ thể (SDT Autonomy — generic verbs).
 * Phân tầng theo Goal-Setting Theory:
 *   Tier 1 (Easy Win, target 1):   perfect-1
 *   Tier 2 (Moderate, target 3):   daily-3, high-score-3
 *   Tier 3 (Hard/Explore, target 5): daily-5
 */
export const MISSION_POOL: readonly MissionDef[] = [
  {
    id: "perfect-1",
    tier: 1,
    title: "Đạt điểm tuyệt đối ở 1 bài",
    description: "Hoàn thành 1 bài tập với điểm số 100.",
    target: 1,
    rewardXp: 60,
    rewardGems: 12,
    type: "perfect_count",
  },
  {
    id: "daily-3",
    tier: 2,
    title: "Luyện 3 bài hôm nay",
    description: "Hoàn thành 3 bài tập bất kỳ (mỗi bài đạt ≥70 điểm).",
    target: 3,
    rewardXp: 30,
    rewardGems: 5,
    type: "general_count",
  },
  {
    id: "high-score-3",
    tier: 2,
    title: "Đạt 80+ điểm ở 3 bài",
    description: "Hoàn thành 3 bài với điểm số từ 80 trở lên.",
    target: 3,
    rewardXp: 50,
    rewardGems: 10,
    type: "high_score_count",
  },
  {
    id: "daily-5",
    tier: 3,
    title: "Luyện 5 bài trong ngày",
    description: "Hoàn thành 5 bài tập bất kỳ (thưởng lớn cho chăm chỉ).",
    target: 5,
    rewardXp: 80,
    rewardGems: 15,
    type: "general_count",
  },
] as const;

// ─── Pure helpers (test không cần DB) ────────────────────────────────────

export interface DailyMissionStats {
  /** Số bài đạt ≥70 điểm (tính tất cả đảo) */
  readonly totalCompleted: number;
  /** Số bài đạt ≥80 điểm */
  readonly totalHighScore: number;
  /** Số bài đạt điểm 100 */
  readonly totalPerfect: number;
}

/**
 * Tính stats hôm nay từ danh sách attempts (input từ Prisma query).
 * Pure — không phụ thuộc DB.
 */
export function computeDailyMissionStats(
  attempts: ReadonlyArray<{ score: number }>,
): DailyMissionStats {
  let totalCompleted = 0;
  let totalHighScore = 0;
  let totalPerfect = 0;

  for (const a of attempts) {
    if (a.score >= 60) totalCompleted++;
    if (a.score >= 80) totalHighScore++;
    if (a.score === 100) totalPerfect++;
  }

  return { totalCompleted, totalHighScore, totalPerfect };
}

/**
 * Tính progress của 1 mission dựa trên stats.
 * Pure — chỉ switch theo type.
 */
export function getMissionProgress(
  type: MissionType,
  stats: DailyMissionStats,
): number {
  switch (type) {
    case "general_count":
      return stats.totalCompleted;
    case "high_score_count":
      return stats.totalHighScore;
    case "perfect_count":
      return stats.totalPerfect;
  }
}

/** Trả về midnight hôm nay theo local time (Octalysis CD6 — reset daily) */
export function getNextResetTime(): Date {
  const tomorrow = new Date();
  tomorrow.setHours(24, 0, 0, 0);
  return tomorrow;
}

/** Format khoảng cách tới reset thành chuỗi tiếng Việt (pure) */
export function formatTimeUntilReset(resetAt: Date, now: Date = new Date()): string {
  const diffMs = resetAt.getTime() - now.getTime();
  if (diffMs <= 0) return "Sắp reset";

  const hours = Math.floor(diffMs / 3_600_000);
  const minutes = Math.floor((diffMs % 3_600_000) / 60_000);

  if (hours >= 1) return `${hours} giờ ${minutes} phút`;
  return `${minutes} phút`;
}

// ─── DB queries (side effects — tách khỏi pure helpers) ─────────────────

/**
 * Đếm chuỗi ngày liên tiếp user làm bài (tính từ hôm nay lùi về trước).
 * Octalysis CD2 — Core Drive "Development & Accomplishment".
 */
export async function getUserStreak(userId: string): Promise<number> {
  const attempts = await prisma.exerciseAttempt.findMany({
    where: { userId },
    select: { createdAt: true },
    orderBy: { createdAt: "desc" },
  });

  const daysWithAttempts = new Set(
    attempts.map((a) => a.createdAt.toISOString().slice(0, 10)),
  );

  let streak = 0;
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);

  while (daysWithAttempts.has(cursor.toISOString().slice(0, 10))) {
    streak++;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

/**
 * Tính thứ hạng user trong tuần này (SDT Relatedness).
 * Xếp hạng theo tổng score tuần (Mon → Sun).
 * Trả về null nếu user chưa có attempt tuần này.
 */
export async function getWeeklyRank(userId: string): Promise<number | null> {
  const startOfWeek = getStartOfWeek(new Date());

  const weeklyScores = await prisma.exerciseAttempt.groupBy({
    by: ["userId"],
    where: { createdAt: { gte: startOfWeek } },
    _sum: { score: true },
  });

  const sorted = [...weeklyScores].sort(
    (a, b) => (b._sum.score ?? 0) - (a._sum.score ?? 0),
  );
  const rank = sorted.findIndex((u) => u.userId === userId);

  return rank >= 0 ? rank + 1 : null;
}

/** Trả về ngày đầu tuần (Chủ nhật 00:00 local time) */
function getStartOfWeek(now: Date): Date {
  const sunday = new Date(now);
  sunday.setDate(sunday.getDate() - sunday.getDay());
  sunday.setHours(0, 0, 0, 0);
  return sunday;
}

/**
 * Fetch attempts hôm nay của user (kèm score) để tính mission progress.
 * Dùng `startOfLocalDay` để reset theo múi giờ local (Octalysis CD6).
 */
export async function fetchTodaysAttempts(userId: string) {
  const { startOfLocalDay } = await import("@/lib/period");
  const today = startOfLocalDay(new Date());

  return prisma.exerciseAttempt.findMany({
    where: {
      userId,
      createdAt: { gte: today },
    },
    select: { score: true },
  });
}
