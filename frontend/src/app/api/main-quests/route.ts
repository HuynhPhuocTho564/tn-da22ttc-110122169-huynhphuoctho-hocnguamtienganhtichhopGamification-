import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { fetchMainQuests } from "@/lib/gamification/missions";

/**
 * GET /api/main-quests
 * Lấy danh sách main quests + progress của user.
 */
export async function GET() {
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

    const data = await fetchMainQuests(userId);

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("Main quests error:", error);
    return NextResponse.json(
      {
        success: false,
        error: { code: "INTERNAL_ERROR", message: "Lỗi server" },
      },
      { status: 500 },
    );
  }
}
