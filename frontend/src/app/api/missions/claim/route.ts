import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  MISSION_POOL,
  TREASURE_CHEST_REWARD,
  computeDailyMissionStats,
  fetchTodaysAttempts,
  getMissionProgress,
} from "@/lib/gamification/missions";
import { startOfLocalDay } from "@/lib/period";

/**
 * POST /api/missions/claim
 *
 * Claim Rương Kho Báu (treasure chest) reward khi user hoàn thành TẤT CẢ
 * nhiệm vụ trong ngày. Octalysis CD2 + CD6 + CD7 — bonus reward khi complete.
 *
 * Flow:
 *   1. Auth check (userId từ session)
 *   2. Lấy attempts hôm nay của user
 *   3. Check TẤT CẢ 4 mission đều completed (theo logic giống /missions)
 *   4. Idempotency: nếu đã claim hôm nay → return success mà không cộng thêm
 *   5. Transaction: cộng diamonds/xp cho user + mark DailyQuest.claimedAt
 *
 * Returns:
 *   - 200: { success: true, data: { newGems, newXp, alreadyClaimed } }
 *   - 401: chưa đăng nhập
 *   - 400: chưa hoàn thành tất cả missions
 *   - 500: lỗi server
 */
export async function POST(_req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHENTICATED", message: "Cần đăng nhập" } },
        { status: 401 },
      );
    }

    // 1. Lấy attempts hôm nay
    const todaysAttempts = await fetchTodaysAttempts(userId);
    const stats = computeDailyMissionStats(todaysAttempts);

    // 2. Check TẤT CẢ mission đều completed
    const allCompleted = MISSION_POOL.every((def) => {
      const progress = Math.min(getMissionProgress(def.type, stats), def.target);
      return progress >= def.target;
    });

    if (!allCompleted) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_COMPLETED",
            message: "Chưa hoàn thành tất cả nhiệm vụ để mở Rương Kho Báu.",
          },
        },
        { status: 400 },
      );
    }

    // 3. Idempotency check — đã claim hôm nay chưa?
    const today = startOfLocalDay(new Date());
    const todaysQuests = await prisma.dailyQuest.findMany({
      where: { userId, date: today },
      select: { id: true, claimedAt: true },
    });
    const alreadyClaimed = todaysQuests.some((q) => q.claimedAt !== null);

    if (alreadyClaimed) {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { gems: true, xp: true },
      });
      return NextResponse.json({
        success: true,
        data: {
          newGems: user?.gems ?? 0,
          newXp: user?.xp ?? 0,
          alreadyClaimed: true,
        },
      });
    }

    // 4. Transaction: cộng reward + mark claimed
    const now = new Date();
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          gems: { increment: TREASURE_CHEST_REWARD.baseGems },
          xp: { increment: TREASURE_CHEST_REWARD.baseXp },
        },
        select: { gems: true, xp: true },
      });

      if (todaysQuests.length > 0) {
        await tx.dailyQuest.updateMany({
          where: {
            id: { in: todaysQuests.map((q) => q.id) },
            claimedAt: null,
          },
          data: { claimedAt: now },
        });
      }

      return user;
    });

    return NextResponse.json({
      success: true,
      data: {
        newGems: result.gems,
        newXp: result.xp,
        alreadyClaimed: false,
      },
    });
  } catch (error) {
    console.error("Mission claim error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Lỗi server" } },
      { status: 500 },
    );
  }
}
