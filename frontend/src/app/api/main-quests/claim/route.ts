import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { MAIN_QUESTS, type MainQuestType } from "@/lib/gamification/missions";

/**
 * POST /api/main-quests/claim
 *
 * Claim reward cho 1 main quest đã hoàn thành.
 *
 * Request body: { questType: MainQuestType, targetId: string }
 *
 * Flow:
 *   1. Auth check
 *   2. Validate questType + targetId
 *   3. Check MainQuestProgress exists + completed + not claimed
 *   4. Transaction: cộng EXP + gems + mark claimedAt
 */
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "UNAUTHENTICATED", message: "Cần đăng nhập" },
        },
        { status: 401 },
      );
    }

    const body = await req.json();
    const questType = body.questType as MainQuestType;
    const targetId = body.targetId as string;

    if (!questType || !targetId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "INVALID_INPUT",
            message: "Thiếu questType hoặc targetId",
          },
        },
        { status: 400 },
      );
    }

    const questDef = MAIN_QUESTS[questType];
    if (!questDef) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "INVALID_QUEST", message: "Loại nhiệm vụ không hợp lệ" },
        },
        { status: 400 },
      );
    }

    // Find the progress record
    const progress = await prisma.mainQuestProgress.findUnique({
      where: {
        userId_questType_targetId: {
          userId,
          questType,
          targetId,
        },
      },
    });

    if (!progress) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_FOUND",
            message: "Không tìm thấy nhiệm vụ này",
          },
        },
        { status: 404 },
      );
    }

    if (!progress.completed) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: "NOT_COMPLETED",
            message: "Nhiệm vụ chưa hoàn thành",
          },
        },
        { status: 400 },
      );
    }

    if (progress.claimedAt) {
      // Already claimed — return current user data
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

    // Transaction: award EXP + gems + mark claimed
    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          xp: { increment: questDef.rewardXp },
          gems: { increment: questDef.rewardGems },
        },
        select: { gems: true, xp: true },
      });

      await tx.mainQuestProgress.update({
        where: { id: progress.id },
        data: { claimedAt: new Date() },
      });

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
    console.error("Main quest claim error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Lỗi server" },
      },
      { status: 500 },
    );
  }
}
