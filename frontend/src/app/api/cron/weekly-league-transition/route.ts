import { NextRequest } from "next/server";
import { processWeeklyTransition } from "@/lib/gamification/season-transition";

/**
 * POST /api/cron/weekly-league-transition
 *
 * Vercel Cron gọi endpoint này mỗi CN 17:00 UTC (= Thứ Hai 00:00 ICT) để:
 *  - Tính toán promotions/demotions cho tất cả tier dựa trên tuần vừa kết thúc
 *  - Update User.currentTier + User.diamonds (qua Prisma $transaction)
 *  - Ghi log vào SeasonTransitionLog
 *
 * Auth: header `Authorization: Bearer ${CRON_SECRET}`.
 * Vercel Cron tự động inject secret này nếu set trong Vercel project env.
 *
 * Schedule (vercel.json):
 *   { "crons": [{ "path": "/api/cron/weekly-league-transition", "schedule": "0 17 * * 0" }] }
 *
 * Response:
 *   200 { success: true, data: { period, promoted, demoted, totalGemsDistributed, totalProcessed } }
 *   401 { success: false, error: "Unauthorized" }
 *   500 { success: false, error: "Internal error" }
 *
 * Manual test:
 *   curl -X POST http://localhost:3000/api/cron/weekly-league-transition \
 *     -H "Authorization: Bearer $CRON_SECRET"
 */
export async function POST(request: NextRequest): Promise<Response> {
  const expectedSecret = process.env.CRON_SECRET;
  if (!expectedSecret) {
    console.error("[cron/weekly-league-transition] CRON_SECRET env not configured");
    return Response.json(
      { success: false, error: "CRON_SECRET not configured" },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${expectedSecret}`) {
    return Response.json(
      { success: false, error: "Unauthorized" },
      { status: 401 },
    );
  }

  try {
    const result = await processWeeklyTransition();
    console.log(
      `[cron/weekly-league-transition] period=${result.period} promoted=${result.promoted} demoted=${result.demoted} diamonds=${result.totalGemsDistributed}`,
    );
    return Response.json({ success: true, data: result });
  } catch (error) {
    console.error("[cron/weekly-league-transition] error:", error);
    return Response.json(
      { success: false, error: "Internal error during weekly transition" },
      { status: 500 },
    );
  }
}

// Vercel Cron mặc định dùng GET, nhưng ta dùng POST để thể hiện side-effect rõ ràng.
// Cho phép GET cũng hoạt động để test/debug qua browser.
export async function GET(request: NextRequest): Promise<Response> {
  return POST(request);
}
