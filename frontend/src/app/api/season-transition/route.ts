import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { processWeeklyTransition, getLastTransition } from "@/lib/gamification/season-transition";

/**
 * POST /api/season-transition
 *
 * Trigger weekly season transition (promotion/demotion + diamond rewards).
 * Should be called once per week at season end (Sunday ~21:00).
 * Protected: only authenticated users can trigger (first visitor triggers for all).
 */
export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED" } },
        { status: 401 },
      );
    }

    const result = await processWeeklyTransition();

    return NextResponse.json({
      success: true,
      data: {
        period: result.period,
        totalProcessed: result.totalProcessed,
        promoted: result.promoted,
        demoted: result.demoted,
        totalGemsDistributed: result.totalGemsDistributed,
      },
    });
  } catch (error) {
    console.error("[season-transition] Error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Không thể xử lý chuyển hạng." } },
      { status: 500 },
    );
  }
}

/**
 * GET /api/season-transition
 *
 * Get the current user's last transition result (for promotion banner).
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHORIZED" } },
        { status: 401 },
      );
    }

    const lastTransition = await getLastTransition(session.user.id);

    if (!lastTransition) {
      return NextResponse.json({ success: true, data: null });
    }

    return NextResponse.json({ success: true, data: lastTransition });
  } catch (error) {
    console.error("[season-transition] GET Error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR" } },
      { status: 500 },
    );
  }
}
