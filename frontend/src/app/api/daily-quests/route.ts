import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pickDailyQuests } from "@/lib/gamification";
import { startOfLocalDay } from "@/lib/period";

/**
 * GET /api/daily-quests
 * Lazy-generate 3 daily quests for today if none exist, then return them.
 */
export async function GET() {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHENTICATED", message: "Cần đăng nhập" } },
        { status: 401 },
      );
    }

    const today = startOfLocalDay(new Date());

    // Lazy generate: if today has no quests yet, pick 3 random
    const existing = await prisma.dailyQuest.findMany({
      where: { userId, date: today },
    });

    if (existing.length === 0) {
      const picked = pickDailyQuests();
      await prisma.dailyQuest.createMany({
        data: picked.map((q) => ({
          userId,
          date: today,
          questType: q.type,
          target: q.target,
          rewardXp: q.rewardXp,
          rewardGems: q.rewardGems,
        })),
      });
    }

    const quests = await prisma.dailyQuest.findMany({
      where: { userId, date: today },
      orderBy: { questType: "asc" },
    });

    return NextResponse.json({
      success: true,
      data: { quests },
    });
  } catch (error) {
    console.error("Daily quests error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Lỗi server" } },
      { status: 500 },
    );
  }
}
