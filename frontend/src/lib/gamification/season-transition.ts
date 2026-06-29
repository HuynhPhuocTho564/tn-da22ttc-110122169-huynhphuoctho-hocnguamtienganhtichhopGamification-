/**
 * Season Transition Service — xử lý lên/xuống hạng khi kết thúc tuần.
 *
 * Pure logic tách riêng khỏi API route → dễ unit test.
 * Flow:
 *   1. Query weekly leaderboard cho mỗi tier
 *   2. Top 10 → lên hạng + diamonds (top 5)
 *   3. Bottom 10 → xuống hạng (trừ Bronze)
 *   4. Ghi log vào SeasonTransitionLog
 *   5. Update User.currentTier + User.diamonds trong transaction
 *
 * @module gamification/season-transition
 */

import { prisma } from "@/lib/prisma";
import {
  type LeagueTier,
  TIER_ORDER,
  TIER_PROMOTION_COUNT,
  TIER_DEMOTION_COUNT,
  MIN_PLAYERS_FOR_DEMOTION,
  getNextTier,
  getPrevTier,
  getGemReward,
} from "./league";
import { getWeekPeriod } from "@/lib/period";

// ─── Types ────────────────────────────────────────────────────

export interface TransitionResult {
  userId: string;
  fromTier: LeagueTier;
  toTier: LeagueTier;
  action: "promoted" | "demoted" | "stayed";
  rankInTier: number;
  gemsEarned: number;
}

interface LeaderboardEntry {
  userId: string;
  score: number;
}

// ─── Pure Logic (testable without DB) ────────────────────────

/**
 * Tính promotions/demotions cho 1 tier.
 * Pure function — nhận data, trả results, không side effects.
 *
 * @param entries — sorted by score DESC (rank 1 = index 0)
 * @param tier — tier hiện tại
 */
export function calculateTransitions(
  entries: LeaderboardEntry[],
  tier: LeagueTier,
): TransitionResult[] {
  if (entries.length === 0) return [];

  const results: TransitionResult[] = [];
  const totalPlayers = entries.length;
  const nextTier = getNextTier(tier);
  const prevTier = getPrevTier(tier);

  for (let i = 0; i < totalPlayers; i++) {
    const rank = i + 1;
    const entry = entries[i];

    // Top N → promoted
    if (rank <= TIER_PROMOTION_COUNT && tier !== "legend") {
      results.push({
        userId: entry.userId,
        fromTier: tier,
        toTier: nextTier,
        action: "promoted",
        rankInTier: rank,
        gemsEarned: getGemReward(rank),
      });
      continue;
    }

    // Bottom N → demoted (only if enough players and not bronze)
    const isBottomZone = rank > totalPlayers - TIER_DEMOTION_COUNT;
    if (isBottomZone && totalPlayers >= MIN_PLAYERS_FOR_DEMOTION && tier !== "bronze") {
      results.push({
        userId: entry.userId,
        fromTier: tier,
        toTier: prevTier,
        action: "demoted",
        rankInTier: rank,
        gemsEarned: 0,
      });
      continue;
    }

    // Everyone else → stayed
    results.push({
      userId: entry.userId,
      fromTier: tier,
      toTier: tier,
      action: "stayed",
      rankInTier: rank,
      gemsEarned: 0,
    });
  }

  return results;
}

// ─── DB Operations ────────────────────────────────────────────

/**
 * Thực hiện weekly season transition cho TẤT CẢ tiers.
 * Gọi từ API route hoặc cron job.
 *
 * @returns Summary: số người promoted, demoted, diamonds distributed
 */
export async function processWeeklyTransition(): Promise<{
  period: string;
  totalProcessed: number;
  promoted: number;
  demoted: number;
  totalGemsDistributed: number;
  results: TransitionResult[];
}> {
  const now = new Date();
  const period = getWeekPeriod(now);

  const allResults: TransitionResult[] = [];

  // Process each tier independently
  for (const tier of TIER_ORDER) {
    // Query weekly leaderboard for this tier, sorted by score DESC
    const entries = await prisma.leaderboard.findMany({
      where: {
        type: "tuan",
        period,
        user: { currentTier: tier, status: "ACTIVE" },
      },
      orderBy: [{ score: "desc" }, { updatedAt: "asc" }],
      select: { userId: true, score: true },
    });

    const transitions = calculateTransitions(entries, tier);
    allResults.push(...transitions);
  }

  // Apply all transitions in a single transaction
  if (allResults.length > 0) {
    await prisma.$transaction(async (tx) => {
      for (const result of allResults) {
        // Update user's tier and diamonds
        const updateData: Record<string, unknown> = {
          currentTier: result.toTier,
        };
        if (result.gemsEarned > 0) {
          updateData.gems = { increment: result.gemsEarned };
        }

        await tx.user.update({
          where: { id: result.userId },
          data: updateData,
        });

        // Log the transition
        await tx.seasonTransitionLog.create({
          data: {
            userId: result.userId,
            period,
            fromTier: result.fromTier,
            toTier: result.toTier,
            action: result.action,
            rankInTier: result.rankInTier,
            gemsEarned: result.gemsEarned,
          },
        });
      }
    });
  }

  const promoted = allResults.filter((r) => r.action === "promoted").length;
  const demoted = allResults.filter((r) => r.action === "demoted").length;
  const totalGems = allResults.reduce((sum, r) => sum + r.gemsEarned, 0);

  return {
    period,
    totalProcessed: allResults.length,
    promoted,
    demoted,
    totalGemsDistributed: totalGems,
    results: allResults,
  };
}

/**
 * Lấy transition gần nhất của user (để hiển thị promotion banner).
 */
export async function getLastTransition(userId: string): Promise<{
  fromTier: string;
  toTier: string;
  action: string;
  gemsEarned: number;
  period: string;
} | null> {
  const log = await prisma.seasonTransitionLog.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: {
      fromTier: true,
      toTier: true,
      action: true,
      gemsEarned: true,
      period: true,
    },
  });
  return log;
}
