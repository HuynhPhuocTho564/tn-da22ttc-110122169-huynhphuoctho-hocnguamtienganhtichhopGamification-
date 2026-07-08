/**
 * Missions — DB queries cho trang /missions.
 *
 * Pure constants + helpers được tách vào missions-helpers.ts
 * để Client Components import an toàn (không bundle prisma).
 */

import { prisma } from "@/lib/prisma";
import {
  type MainQuestType,
  MAIN_QUESTS,
} from "@/lib/gamification/missions-helpers";

// ─── Re-export helpers (server-only safe) ───────────────────────────────

export {
  MISSION_TIERS,
  TREASURE_CHEST_REWARD,
  MISSION_POOL,
  MAIN_QUEST_TYPES,
  MAIN_QUESTS,
  type MissionType,
  type MissionTier,
  type MissionTierKey,
  type MissionDef,
  type MainQuestType,
  type DailyMissionStats,
  computeDailyMissionStats,
  getMissionProgress,
  getNextResetTime,
  formatTimeUntilReset,
} from "@/lib/gamification/missions-helpers";

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

// ─── Main Quests DB operations ─────────────────────────────────────────

/** Kiểm tra 1 island đã hoàn thành hết bài chưa */
async function checkIslandCompletion(
  userId: string,
  topicId: string,
): Promise<boolean> {
  const [totalExercises, completedExercises] = await Promise.all([
    prisma.exercise.count({ where: { topicId } }),
    prisma.exerciseAttempt.groupBy({
      by: ["exerciseId"],
      where: {
        userId,
        score: { gte: 70 },
        exercise: { topicId },
      },
    }),
  ]);

  return totalExercises > 0 && completedExercises.length >= totalExercises;
}

/** Kiểm tra 1 SoundGroup (camp) đã hoàn thành hết bài chưa */
async function checkCampCompletion(
  userId: string,
  mapId: string,
): Promise<boolean> {
  const [totalExercises, completedExercises] = await Promise.all([
    prisma.exercise.count({ where: { mapId } }),
    prisma.exerciseAttempt.groupBy({
      by: ["exerciseId"],
      where: {
        userId,
        score: { gte: 70 },
        exercise: { mapId },
      },
    }),
  ]);

  return totalExercises > 0 && completedExercises.length >= totalExercises;
}

/**
 * Kiểm tra và tạo MainQuestProgress cho tất cả island + camp vừa hoàn thành.
 * Gọi từ exercise submit route.
 */
export async function checkAndCreateMainQuests(
  userId: string,
  topicId: string,
  mapId: string,
): Promise<void> {
  // 1. Check island completion
  const islandCompleted = await checkIslandCompletion(userId, topicId);
  if (islandCompleted) {
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      select: { name: true },
    });
    await prisma.mainQuestProgress.upsert({
      where: {
        userId_questType_targetId: {
          userId,
          questType: "main-island",
          targetId: topicId,
        },
      },
      update: { completed: true },
      create: {
        userId,
        questType: "main-island",
        targetId: topicId,
        targetName: topic?.name ?? topicId,
        completed: true,
      },
    });
  }

  // 2. Check camp (SoundGroup) completion
  const campCompleted = await checkCampCompletion(userId, mapId);
  if (campCompleted) {
    const map = await prisma.learningMap.findUnique({
      where: { id: mapId },
      select: { name: true },
    });
    await prisma.mainQuestProgress.upsert({
      where: {
        userId_questType_targetId: {
          userId,
          questType: "main-phoneme-group",
          targetId: mapId,
        },
      },
      update: { completed: true },
      create: {
        userId,
        questType: "main-phoneme-group",
        targetId: mapId,
        targetName: map?.name ?? mapId,
        completed: true,
      },
    });
  }
}

/**
 * Kiểm tra và tạo MainQuestProgress cho level-up.
 * Gọi từ exercise submit route (sau khi update XP).
 */
export async function checkAndCreateLevelUpQuest(
  userId: string,
  previousLevel: number,
  currentLevel: number,
): Promise<void> {
  if (currentLevel <= previousLevel) return;

  await prisma.mainQuestProgress.upsert({
    where: {
      userId_questType_targetId: {
        userId,
        questType: "main-level-up",
        targetId: `level-${currentLevel}`,
      },
    },
    update: { completed: true },
    create: {
      userId,
      questType: "main-level-up",
      targetId: `level-${currentLevel}`,
      targetName: `Level ${currentLevel}`,
      completed: true,
    },
  });
}

/**
 * Fetch tất cả main quest progress của user.
 * Trả về grouped data cho UI.
 */
export async function fetchMainQuests(userId: string) {
  const [progress, user] = await Promise.all([
    prisma.mainQuestProgress.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { level: true },
    }),
  ]);

  const level = user?.level ?? 1;

  // Group by questType
  const grouped: Record<
    MainQuestType,
    {
      title: string;
      description: string;
      rewardXp: number;
      rewardGems: number;
      items: Array<{
        id: string;
        name: string;
        completed: boolean;
        claimedAt: Date | null;
      }>;
    }
  > = {
    "main-island": {
      ...MAIN_QUESTS["main-island"],
      items: [],
    },
    "main-phoneme-group": {
      ...MAIN_QUESTS["main-phoneme-group"],
      items: [],
    },
    "main-level-up": {
      ...MAIN_QUESTS["main-level-up"],
      items: [],
    },
  };

  // Add progress items
  for (const p of progress) {
    const type = p.questType as MainQuestType;
    if (grouped[type]) {
      grouped[type].items.push({
        id: p.targetId,
        name: p.targetName,
        completed: p.completed,
        claimedAt: p.claimedAt,
      });
    }
  }

  // For main-level-up, also show current level if not yet tracked
  const levelUpItems = grouped["main-level-up"].items;
  const hasCurrentLevel = levelUpItems.some(
    (item) => item.id === `level-${level}`,
  );
  if (!hasCurrentLevel) {
    levelUpItems.push({
      id: `level-${level}`,
      name: `Level ${level}`,
      completed: false,
      claimedAt: null,
    });
  }

  return {
    quests: Object.entries(grouped).map(([type, data]) => ({
      type,
      ...data,
    })),
  };
}
