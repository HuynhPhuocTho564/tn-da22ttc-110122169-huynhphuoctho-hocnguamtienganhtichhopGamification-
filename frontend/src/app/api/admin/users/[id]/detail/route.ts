import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { apiFailure, apiSuccess, requireAdminSession } from "@/lib/admin-api";

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/admin/users/[id]/detail
 *
 * Trả về chi tiết 1 user để admin xem: thông tin tài khoản + gamification
 * (XP, level, streak, gems, tier) + thống kê (attempts, badges).
 */
export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const { id } = await context.params;

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        status: true,
        createdAt: true,
        role: { select: { name: true } },
        xp: true,
        level: true,
        streakCount: true,
        longestStreak: true,
        gems: true,
        streakFreezes: true,
        totalCheckIns: true,
        currentTier: true,
        _count: {
          select: {
            exerciseAttempts: true,
            userBadges: true,
          },
        },
      },
    });

    if (!user) return apiFailure("NOT_FOUND", "Không tìm thấy người dùng", 404);

    return apiSuccess({
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role.name,
        status: user.status,
        createdAt: user.createdAt.toISOString(),
        xp: user.xp,
        level: user.level,
        streakCount: user.streakCount,
        longestStreak: user.longestStreak,
        gems: user.gems,
        streakFreezes: user.streakFreezes,
        totalCheckIns: user.totalCheckIns,
        currentTier: user.currentTier,
        attemptCount: user._count.exerciseAttempts,
        badgeCount: user._count.userBadges,
      },
    });
  } catch (error) {
    console.error("Admin get user detail error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server", 500);
  }
}
