import { NextRequest } from "next/server";
import { apiSuccess, apiFailure, getAuthenticatedUserId } from "@/lib/admin-api";
import {
  CHECKIN_REWARD,
  computeStreakMilestoneGems,
  calculateLevelFromXp,
  calculateNextStreak,
  checkAndAwardBadges,
  getLeaderboardTargets,
} from "@/lib/gamification";
import { formatLocalDate, startOfLocalDay } from "@/lib/period";
import { prisma } from "@/lib/prisma";

export async function GET(_request: NextRequest) {
  try {
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return apiFailure("UNAUTHENTICATED", "Cần đăng nhập để xem điểm danh", 401);
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        streakCount: true,
        longestStreak: true,
        totalCheckIns: true,
        lastCheckInDate: true,
        streakFreezes: true,
        xp: true,
        level: true,
      },
    });

    if (!user) {
      return apiFailure("USER_NOT_FOUND", "Không tìm thấy user", 404);
    }

    const today = startOfLocalDay(new Date());
    const streakStatus = calculateNextStreak(user.lastCheckInDate, user.streakCount, today, user.streakFreezes);

    return apiSuccess({
      currentStreak: user.streakCount,
      longestStreak: user.longestStreak,
      totalCheckIns: user.totalCheckIns,
      lastCheckInDate: user.lastCheckInDate,
      canCheckIn: !streakStatus.alreadyCheckedIn,
      todayReward: CHECKIN_REWARD,
      progress: {
        currentXp: user.xp,
        level: user.level,
      },
    });
  } catch (error) {
    console.error("Get check-in status error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server khi lấy trạng thái điểm danh", 500);
  }
}

export async function POST(request: NextRequest) {
  try {
    await request.json().catch(() => ({}));
    const userId = await getAuthenticatedUserId();

    if (!userId) {
      return apiFailure("UNAUTHENTICATED", "Cần đăng nhập để điểm danh", 401);
    }

    const now = new Date();
    const today = startOfLocalDay(now);

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        xp: true,
        level: true,
        streakCount: true,
        longestStreak: true,
        totalCheckIns: true,
        lastCheckInDate: true,
        streakFreezes: true,
      },
    });

    if (!user) {
      return apiFailure("USER_NOT_FOUND", "Không tìm thấy user", 404);
    }

    const streakStatus = calculateNextStreak(user.lastCheckInDate, user.streakCount, today, user.streakFreezes);

    if (streakStatus.alreadyCheckedIn) {
      return apiFailure("ALREADY_CHECKED_IN", "Hôm nay đã điểm danh", 409, {
        currentStreak: user.streakCount,
        canCheckIn: false,
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const nextXp = user.xp + CHECKIN_REWARD.xp;
      const nextLevel = Math.max(user.level, calculateLevelFromXp(nextXp));

      // Task 4.1: diamonds từ check-in + streak milestone bonus
      const streakMilestoneGems = computeStreakMilestoneGems(streakStatus.streak, user.streakCount);
      const totalGemsEarned = CHECKIN_REWARD.gems + streakMilestoneGems;

      const updatedUser = await tx.user.update({
        where: { id: userId },
        data: {
          xp: { increment: CHECKIN_REWARD.xp },
          level: nextLevel,
          lastCheckInDate: now,
          streakCount: streakStatus.streak,
          longestStreak: Math.max(streakStatus.streak, user.longestStreak),
          totalCheckIns: { increment: 1 },
          gems: { increment: totalGemsEarned },
          ...(streakStatus.usedFreeze ? { streakFreezes: { decrement: 1 } } : {}),
        },
        select: {
          xp: true,
          level: true,
          streakCount: true,
          longestStreak: true,
          totalCheckIns: true,
          lastCheckInDate: true,
          gems: true,
        },
      });

      const dailyActivity = await tx.dailyActivity.upsert({
        where: {
          userId_date: {
            userId,
            date: today,
          },
        },
        create: {
          userId,
          date: today,
          xpEarned: CHECKIN_REWARD.xp,
          checkIns: 1,
        },
        update: {
          xpEarned: { increment: CHECKIN_REWARD.xp },
          checkIns: { increment: 1 },
        },
      });

      for (const target of getLeaderboardTargets(now)) {
        await tx.leaderboard.upsert({
          where: {
            userId_type_period: {
              userId,
              type: target.type,
              period: target.period,
            },
          },
          create: {
            userId,
            type: target.type,
            period: target.period,
            score: CHECKIN_REWARD.rankingScore,
          },
          update: {
            score: { increment: CHECKIN_REWARD.rankingScore },
          },
        });
      }

      const badgesAwarded = await checkAndAwardBadges(tx, userId, "daily_checkin", now);

      return {
        updatedUser,
        dailyActivity,
        badgesAwarded,
        gemsEarned: totalGemsEarned,
        streakMilestoneGems,
      };
    });

    return apiSuccess({
      message: "Check-in successful",
      currentStreak: result.updatedUser.streakCount,
      longestStreak: result.updatedUser.longestStreak,
      totalCheckIns: result.updatedUser.totalCheckIns,
      lastCheckInDate: result.updatedUser.lastCheckInDate,
      reward: CHECKIN_REWARD,
      gemsEarned: result.gemsEarned,
      streakMilestoneGems: result.streakMilestoneGems,
      progress: {
        currentXp: result.updatedUser.xp,
        level: result.updatedUser.level,
      },
      gems: result.updatedUser.gems,
      dailyActivity: {
        date: formatLocalDate(today),
        xpEarned: result.dailyActivity.xpEarned,
        checkIns: result.dailyActivity.checkIns,
      },
      badgesAwarded: result.badgesAwarded,
      canCheckIn: false,
    });
  } catch (error) {
    console.error("Check-in error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server khi điểm danh", 500);
  }
}
