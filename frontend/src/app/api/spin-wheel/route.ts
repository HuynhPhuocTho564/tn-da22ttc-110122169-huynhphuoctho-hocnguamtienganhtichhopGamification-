import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { canSpin, spinWheel, SPIN_ELIGIBLE_STREAK, SPIN_BUY_COST } from "@/lib/gamification/spin-wheel";

/**
 * POST /api/spin-wheel
 *
 * Spin the prize wheel. Returns the prize won.
 * Body: { buySpin?: boolean }
 *   - buySpin=false (default): free spin, requires streak >= 3 and no spin today
 *   - buySpin=true: costs SPIN_BUY_COST gems, bypasses streak/daily limit
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: { code: "UNAUTHORIZED" } }, { status: 401 });
    }

    const userId = session.user.id;
    let buySpin = false;
    try {
      const body = await request.json();
      buySpin = body.buySpin === true;
    } catch {
      // No body or invalid JSON — treat as free spin
    }

    // Fetch user data
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { streakCount: true, gems: true },
    });
    if (!user) {
      return NextResponse.json({ success: false, error: { code: "USER_NOT_FOUND" } }, { status: 404 });
    }

    if (buySpin) {
      // ── BUY SPIN: check diamonds balance ──
      if ((user.gems ?? 0) < SPIN_BUY_COST) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: "NOT_ENOUGH_GEMS",
              message: `Cần ${SPIN_BUY_COST} 💎 để mua lượt quay. Bạn có ${user.gems ?? 0} 💎.`,
            },
          },
          { status: 403 },
        );
      }
    } else {
      // ── FREE SPIN: check streak + daily limit ──
      const lastSpin = await prisma.spinWheelLog.findFirst({
        where: { userId },
        orderBy: { spunAt: "desc" },
        select: { spunAt: true },
      });

      if (!canSpin(user.streakCount, lastSpin?.spunAt ?? null, new Date())) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: user.streakCount < SPIN_ELIGIBLE_STREAK ? "STREAK_TOO_LOW" : "ALREADY_SPUN_TODAY",
              message: user.streakCount < SPIN_ELIGIBLE_STREAK
                ? `Cần chuỗi ${SPIN_ELIGIBLE_STREAK} ngày liên tiếp để quay`
                : "Bạn đã quay hôm nay rồi",
            },
          },
          { status: 403 },
        );
      }
    }

    // Spin!
    const { prize, rotationDegrees } = spinWheel();

    // Log the spin + award prize (+ deduct diamonds if buySpin) in transaction
    await prisma.$transaction(async (tx) => {
      await tx.spinWheelLog.create({
        data: {
          userId,
          prize: prize.id,
          prizeValue: prize.value.gems ?? prize.value.xp ?? 0,
        },
      });

      // Build update data based on prize type
      const updateData: { gems?: number; xp?: number; streakFreezes?: number } = {};
      if (prize.value.gems) updateData.gems = prize.value.gems;
      if (prize.value.xp) updateData.xp = prize.value.xp;
      if (prize.value.streakFreezes) updateData.streakFreezes = prize.value.streakFreezes;

      // Deduct diamonds for bought spin
      const gemsIncrement = (updateData.gems ?? 0) - (buySpin ? SPIN_BUY_COST : 0);

      await tx.user.update({
        where: { id: userId },
        data: {
          ...(gemsIncrement !== 0 ? { gems: { increment: gemsIncrement } } : {}),
          ...(updateData.xp ? { xp: { increment: updateData.xp } } : {}),
          ...(updateData.streakFreezes ? { streakFreezes: { increment: updateData.streakFreezes } } : {}),
        },
      });
    });

    return NextResponse.json({
      success: true,
      data: {
        prize: {
          id: prize.id,
          label: prize.label,
          value: prize.value,
        },
        rotationDegrees,
        buySpin,
      },
    });
  } catch (error) {
    console.error("[spin-wheel] Error:", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "Không thể quay vòng quay. Vui lòng thử lại." } },
      { status: 500 },
    );
  }
}
