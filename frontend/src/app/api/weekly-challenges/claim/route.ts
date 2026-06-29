import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getCurrentWeekKey } from "@/lib/gamification/weekly-challenge";

/**
 * POST /api/weekly-challenges/claim
 *
 * Claim reward for a completed weekly challenge.
 * Awards diamonds and marks the challenge as claimed.
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED", message: "Cần đăng nhập" } },
        { status: 401 },
      );
    }

    const userId = session.user.id;
    const weekKey = getCurrentWeekKey();

    // Find current week's challenge with user participation
    const challenge = await prisma.weeklyChallenge.findFirst({
      where: { weekKey },
      include: {
        participants: {
          where: { userId },
        },
      },
    });

    if (!challenge || challenge.participants.length === 0) {
      return NextResponse.json(
        { success: false, error: { code: "CHALLENGE_NOT_FOUND", message: "Không tìm thấy thử thách tuần" } },
        { status: 404 },
      );
    }

    const participation = challenge.participants[0];

    if (!participation.completed) {
      return NextResponse.json(
        { success: false, error: { code: "NOT_COMPLETED", message: "Chưa hoàn thành thử thách" } },
        { status: 400 },
      );
    }

    if (participation.claimedAt) {
      return NextResponse.json(
        { success: false, error: { code: "ALREADY_CLAIMED", message: "Đã nhận thưởng rồi" } },
        { status: 400 },
      );
    }

    // Transaction: award diamonds + mark claimed
    const [updatedUser] = await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: { gems: { increment: challenge.rewardGems } },
        select: { gems: true },
      }),
      prisma.weeklyChallengeParticipant.update({
        where: { id: participation.id },
        data: { claimedAt: new Date() },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        gemsAwarded: challenge.rewardGems,
        newGemBalance: updatedUser.gems,
      },
    });
  } catch (error) {
    console.error("[weekly-challenges/claim] Error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Lỗi server khi nhận thưởng" } },
      { status: 500 },
    );
  }
}
