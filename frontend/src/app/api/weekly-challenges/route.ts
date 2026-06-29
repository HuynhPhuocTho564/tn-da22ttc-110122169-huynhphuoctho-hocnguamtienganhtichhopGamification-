import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getCurrentWeekKey,
  getCurrentWeekRange,
  generateChallengeForWeek,
} from "@/lib/gamification/weekly-challenge";

/** Shared Prisma include for top participants with user info */
const PARTICIPANTS_INCLUDE = {
  participants: {
    orderBy: { progress: "desc" as const },
    take: 5,
    include: { user: { select: { username: true, avatarUrl: true } } },
  },
};

/**
 * GET /api/weekly-challenges
 *
 * Returns current week's challenge with user's progress and top participants.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED" } }, { status: 401 });
    }

    const userId = session.user.id;
    const weekKey = getCurrentWeekKey();
    const { start, end } = getCurrentWeekRange();

    // Find or create challenge for this week
    const template = generateChallengeForWeek(weekKey);
    let challenge = await prisma.weeklyChallenge.findUnique({
      where: { weekKey },
      include: PARTICIPANTS_INCLUDE,
    });

    if (!challenge) {
      challenge = await prisma.weeklyChallenge.create({
        data: {
          weekKey,
          title: template.title,
          description: template.description,
          targetMetric: template.targetMetric,
          targetValue: template.targetValue,
          rewardGems: template.rewardGems,
          startsAt: start,
          endsAt: end,
        },
        include: PARTICIPANTS_INCLUDE,
      });
    }

    const challengeId = challenge.id;

    // Get or create user participation
    let participation = await prisma.weeklyChallengeParticipant.findUnique({
      where: { challengeId_userId: { challengeId, userId } },
    });

    if (!participation) {
      participation = await prisma.weeklyChallengeParticipant.create({
        data: { challengeId, userId, progress: 0 },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        challenge: {
          id: challenge.id,
          title: challenge.title,
          description: challenge.description,
          targetMetric: challenge.targetMetric,
          targetValue: challenge.targetValue,
          rewardGems: challenge.rewardGems,
          endsAt: challenge.endsAt,
        },
        participation: {
          progress: participation.progress,
          completed: participation.completed,
          claimedAt: participation.claimedAt,
        },
        topParticipants: challenge.participants.map((p) => ({
          username: p.user.username,
          avatarUrl: p.user.avatarUrl,
          progress: p.progress,
        })),
      },
    });
  } catch (error) {
    console.error("[weekly-challenges] Error fetching challenge:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Không thể tải thử thách tuần. Vui lòng thử lại." } },
      { status: 500 },
    );
  }
}
