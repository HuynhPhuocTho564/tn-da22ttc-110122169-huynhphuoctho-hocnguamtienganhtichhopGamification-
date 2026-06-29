import { apiSuccess, apiFailure, getAuthenticatedUserId } from "@/lib/admin-api";
import {
  BADGE_DEFINITIONS,
  getBadgeProgressFromStats,
  getUserBadgeStats,
} from "@/lib/gamification";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return apiFailure("UNAUTHENTICATED", "Cần đăng nhập để xem huy hiệu", 401);
    }

    const [earnedBadges, stats] = await Promise.all([
      prisma.userBadge.findMany({
        where: {
          userId,
        },
        orderBy: {
          earnedAt: "desc",
        },
        include: {
          badge: true,
        },
      }),
      getUserBadgeStats(prisma, userId, new Date()),
    ]);

    const earnedBadgeIds = new Set(earnedBadges.map((userBadge) => userBadge.badgeId));

    const earned = earnedBadges.map((userBadge) => {
      const definition = BADGE_DEFINITIONS.find((item) => item.id === userBadge.badgeId);

      return {
        id: userBadge.badge.id,
        name: userBadge.badge.name,
        description: userBadge.badge.description,
        type: userBadge.badge.type,
        image: userBadge.badge.image,
        condition: userBadge.badge.condition,
        category: definition?.category ?? "progress",
        earnedAt: userBadge.earnedAt,
        validPeriod: userBadge.validPeriod,
      };
    });

    const available = BADGE_DEFINITIONS.filter((definition) => !earnedBadgeIds.has(definition.id)).map(
      (definition) => ({
        id: definition.id,
        name: definition.name,
        description: definition.description,
        type: definition.type,
        image: null,
        condition: definition.condition,
        category: definition.category,
        progress: getBadgeProgressFromStats(definition, stats),
      }),
    );

    return apiSuccess({
      earned,
      available,
      summary: {
        earnedCount: earned.length,
        totalCount: BADGE_DEFINITIONS.length,
      },
    });
  } catch (error) {
    console.error("Get badges error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server khi lấy huy hiệu", 500);
  }
}
