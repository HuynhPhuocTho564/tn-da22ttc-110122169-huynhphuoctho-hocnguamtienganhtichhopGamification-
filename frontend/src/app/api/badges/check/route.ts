import { NextRequest } from "next/server";
import { apiSuccess, apiFailure, getAuthenticatedUserId } from "@/lib/admin-api";
import { checkAndAwardBadges, type BadgeAwardReason } from "@/lib/gamification";
import { prisma } from "@/lib/prisma";

type CheckBadgesPayload = {
  reason?: BadgeAwardReason;
};

function isValidReason(reason: unknown): reason is BadgeAwardReason {
  return (
    reason === "exercise_submit" ||
    reason === "daily_checkin" ||
    reason === "leaderboard_update" ||
    reason === "manual" ||
    reason === undefined
  );
}

export async function POST(request: NextRequest) {
  try {
    const payload = (await request.json().catch(() => ({}))) as CheckBadgesPayload;
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return apiFailure("UNAUTHENTICATED", "Cần đăng nhập để kiểm tra huy hiệu", 401);
    }

    if (!isValidReason(payload.reason)) {
      return apiFailure("VALIDATION_ERROR", "reason không hợp lệ", 400);
    }

    const badgesAwarded = await prisma.$transaction((tx) =>
      checkAndAwardBadges(tx, userId, payload.reason ?? "manual", new Date()),
    );

    return apiSuccess({
      badgesAwarded,
    });
  } catch (error) {
    console.error("Check badges error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server khi kiểm tra huy hiệu", 500);
  }
}
