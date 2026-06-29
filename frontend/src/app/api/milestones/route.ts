import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  getAllMilestones,
  getUnclaimedMilestones,
  getNextMilestone,
} from "@/lib/gamification/milestones";

/**
 * GET /api/milestones
 *
 * Returns all milestones with user's claim status + next milestone.
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED" } }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { level: true },
  });

  const [allMilestones, unclaimed, nextMilestone] = await Promise.all([
    getAllMilestones(),
    getUnclaimedMilestones(session.user.id, user?.level ?? 0),
    getNextMilestone(user?.level ?? 0),
  ]);

  const unclaimedIds = new Set(unclaimed.map((m) => m.id));

  return NextResponse.json({
    success: true,
    data: {
      milestones: allMilestones.map((m) => ({
        ...m,
        reached: m.level <= (user?.level ?? 0),
        claimed: !unclaimedIds.has(m.id) && m.level <= (user?.level ?? 0),
      })),
      unclaimed,
      nextMilestone,
    },
  });
  } catch (error) {
    console.error("[milestones] Error fetching milestones:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Không thể tải phần thưởng cột mốc." } },
      { status: 500 },
    );
  }
}
