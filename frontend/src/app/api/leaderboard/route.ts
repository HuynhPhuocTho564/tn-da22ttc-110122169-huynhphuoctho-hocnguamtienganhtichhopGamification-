import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { apiSuccess, apiFailure } from "@/lib/admin-api";
import { getWeekPeriod } from "@/lib/period";
import { prisma } from "@/lib/prisma";
import {
  isValidTier,
  type LeagueTier,
  TIER_PROMOTION_COUNT,
  TIER_DEMOTION_COUNT,
} from "@/lib/gamification/league";
import { getWeekCountdown } from "@/lib/gamification/league-zone";

/**
 * GET /api/leaderboard
 *
 * THIETKE refactor 2026-06-26: chỉ trả về giải đấu TUẦN hiện tại.
 * Bỏ nhánh "thang" (dead code) và "all" (chuyển sang Profile Achievement Cards).
 *
 * Query params:
 *  - period?: string (ISO week, vd "2026-W26"). Mặc định tuần hiện tại.
 *  - limit?: number (1..50). Mặc định 10.
 *  - tier?: LeagueTier (filter theo hạng hiện tại của user).
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || getWeekPeriod();
    const limit = parseLimit(searchParams.get("limit"));
    const tierParam = searchParams.get("tier");
    const tierFilter = tierParam && isValidTier(tierParam) ? (tierParam as LeagueTier) : null;

    const session = await auth();

    const leaderboardWhere = tierFilter
      ? { type: "tuan" as const, period, user: { currentTier: tierFilter } }
      : { type: "tuan" as const, period };

    const [rows, totalPlayers, currentUserSnapshot] = await Promise.all([
      prisma.leaderboard.findMany({
        where: leaderboardWhere,
        orderBy: [{ score: "desc" }, { updatedAt: "asc" }],
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              avatarUrl: true,
              level: true,
              streakCount: true,
              currentTier: true,
              userBadges: {
                orderBy: { earnedAt: "desc" },
                take: 2,
                include: { badge: { select: { name: true, type: true } } },
              },
            },
          },
        },
      }),
      prisma.leaderboard.count({ where: leaderboardWhere }),
      // Snapshot current user separately để tránh gọi auth() 2 lần
      getCurrentUserSnapshot(session?.user?.id, tierFilter, period),
    ]);

    const items = rows.map((row, index) => ({
      rank: index + 1,
      userId: row.userId,
      username: row.user.username,
      avatarUrl: row.user.avatarUrl,
      level: row.user.level,
      streak: row.user.streakCount,
      currentTier: row.user.currentTier,
      score: row.score,
      correctAnswers: row.correctAnswers,
      completedExercises: row.completedExercises,
      badges: row.user.userBadges.map((ub) => ({
        name: ub.badge.name,
        rarity: ub.badge.type,
      })),
    }));

    return apiSuccess({
      type: "tuan" as const,
      period,
      items,
      currentUser: currentUserSnapshot,
      totalPlayers,
      tierFilter: tierFilter ?? null,
      promotionCount: TIER_PROMOTION_COUNT,
      demotionCount: TIER_DEMOTION_COUNT,
      weekCountdown: getWeekCountdown(),
    });
  } catch (error) {
    console.error("Get leaderboard error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server khi lấy bảng xếp hạng", 500);
  }
}

// ─── Helpers ─────────────────────────────────────────────────

function parseLimit(value: string | null): number {
  if (!value) return 10;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return 10;
  return Math.min(parsed, 50);
}

/**
 * Lấy rank/score/tier của current user trong bảng tuần hiện tại.
 * Trả về default data nếu user chưa có entry (chưa làm bài / điểm danh).
 */
async function getCurrentUserSnapshot(
  userId: string | undefined,
  tierFilter: LeagueTier | null,
  period: string,
): Promise<{ rank: number; score: number; currentTier: string; level: number; xp: number; totalPlayers: number }> {
  if (!userId) return { rank: 0, score: 0, currentTier: "bronze", level: 1, xp: 0, totalPlayers: 0 };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { currentTier: true, level: true, xp: true },
  });

  if (!user) return { rank: 0, score: 0, currentTier: "bronze", level: 1, xp: 0, totalPlayers: 0 };

  const entry = await prisma.leaderboard.findUnique({
    where: {
      userId_type_period: { userId, type: "tuan", period },
    },
  });

  if (!entry) {
    // User chưa có điểm tuần này — trả về tier/level từ profile
    return {
      rank: 0,
      score: 0,
      currentTier: user.currentTier,
      level: user.level,
      xp: user.xp,
      totalPlayers: 0,
    };
  }

  const where = tierFilter
    ? {
        type: "tuan" as const,
        period,
        user: { currentTier: tierFilter },
        score: { gt: entry.score },
      }
    : { type: "tuan" as const, period, score: { gt: entry.score } };

  const betterCount = await prisma.leaderboard.count({ where });

  return {
    rank: betterCount + 1,
    score: entry.score,
    currentTier: user.currentTier,
    level: user.level,
    xp: user.xp,
    totalPlayers: 0,
  };
}
