import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/use-item
 * Consume a consumable item from inventory.
 * Body: { itemId: "hint_token" | "second_chance" | "streak_freeze" | "xp_boost" }
 *
 * Thay đổi 2026-06-26: thêm `streak_freeze` và `xp_boost` để user có thể chủ động
 * dùng (thay vì chỉ auto-consume trong submit route).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: { code: "UNAUTHENTICATED" } },
        { status: 401 },
      );
    }

    const body = (await request.json()) as { itemId?: string };
    const userId = session.user.id;

    const FIELD_MAP: Record<string, string> = {
      hint_token: "hintTokens",
      second_chance: "secondChances",
      streak_freeze: "streakFreezes",
      xp_boost: "xpBoostRemaining",
    };

    const field = FIELD_MAP[body.itemId ?? ""];
    if (!field) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "INVALID_ITEM", message: "Vật phẩm không hợp lệ" },
        },
        { status: 400 },
      );
    }

    // Check user has the item
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        hintTokens: true,
        secondChances: true,
        streakFreezes: true,
        xpBoostRemaining: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { success: false, error: { code: "USER_NOT_FOUND" } },
        { status: 404 },
      );
    }

    const currentCount = (user as Record<string, number>)[field] ?? 0;
    if (currentCount <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: { code: "NO_ITEMS", message: "Bạn không có vật phẩm này" },
        },
        { status: 400 },
      );
    }

    // Decrement item count
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { [field]: { decrement: 1 } },
      select: {
        hintTokens: true,
        secondChances: true,
        streakFreezes: true,
        xpBoostRemaining: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        itemId: body.itemId,
        remaining: (updatedUser as Record<string, number>)[field],
      },
    });
  } catch (error) {
    console.error("[use-item] Error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR" } },
      { status: 500 },
    );
  }
}
