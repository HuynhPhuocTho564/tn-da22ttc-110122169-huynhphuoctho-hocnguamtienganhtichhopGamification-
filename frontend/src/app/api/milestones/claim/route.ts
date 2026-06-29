import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { claimMilestone } from "@/lib/gamification/milestones";

/**
 * POST /api/milestones/claim
 *
 * Claim a milestone reward. Body: { milestoneId: string }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED" } }, { status: 401 });
    }

  let body: { milestoneId?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: { code: "INVALID_JSON" } },
      { status: 400 },
    );
  }

  if (!body.milestoneId || typeof body.milestoneId !== "string") {
    return NextResponse.json(
      { success: false, error: { code: "MISSING_MILESTONE_ID" } },
      { status: 400 },
    );
  }

  const result = await claimMilestone(session.user.id, body.milestoneId);

  if ("error" in result) {
    const statusMap: Record<string, number> = {
      MILESTONE_NOT_FOUND: 404,
      USER_NOT_FOUND: 404,
      LEVEL_NOT_REACHED: 403,
      ALREADY_CLAIMED: 409,
    };
    return NextResponse.json(
      { success: false, error: { code: result.error } },
      { status: statusMap[result.error] ?? 400 },
    );
  }

  return NextResponse.json({
    success: true,
    data: {
      gems: result.gems,
      badgeName: result.badgeName,
    },
  });
  } catch (error) {
    console.error("[milestones/claim] Error claiming milestone:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Không thể nhận phần thưởng. Vui lòng thử lại." } },
      { status: 500 },
    );
  }
}
