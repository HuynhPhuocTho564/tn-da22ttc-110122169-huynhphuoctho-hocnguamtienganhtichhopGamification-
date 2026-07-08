import Link from "next/link";
import { redirect } from "next/navigation";
import OnboardingGate from "@/components/onboarding/OnboardingGate";
import RankChangeNotification from "@/components/gamification/RankChangeNotification";
import SeasonEndOverlay from "@/components/gamification/SeasonEndOverlay";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import DailyCheckIn from "@/components/gamification/DailyCheckIn";
import SpinWheel from "@/components/gamification/SpinWheel";
import MilestonePopup from "@/components/gamification/progression/MilestonePopup";
import { auth } from "@/lib/auth";
import { getUnclaimedMilestones } from "@/lib/gamification/milestones";
import { prisma } from "@/lib/prisma";
import { localizeBadgeType } from "@/lib/badges";

export const dynamic = "force-dynamic";

// ─── Layout helpers (skill maintainable-code: pure, single responsibility) ──

function primaryLinkClass() {
  return "inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-primary-600 to-primary-500 px-6 py-3 text-sm font-bold text-white shadow-[0_4px_14px_rgba(59,130,246,0.4)] transition-all hover:shadow-[0_6px_20px_rgba(59,130,246,0.55)] hover:scale-[1.03] active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 focus-visible:ring-offset-2";
}

function heroButtonClass() {
  // Nút to, nổi bật cho Hero Card "Tiếp tục hành trình" (Fitts + Von Restorff).
  // Solid primary color, không gradient — theo yêu cầu user "màu đơn".
  return "inline-flex min-h-14 items-center justify-center rounded-xl bg-primary-600 px-8 py-4 text-base font-black text-white shadow-lg transition-all hover:bg-primary-700 hover:scale-[1.03] hover:shadow-xl active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-300";
}

// ─── Page ─────────────────────────────────────────────────────

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  const userId = session.user.id;

  // Lấy user + attempts gần nhất (chỉ cần ~50 thay vì 200 — không còn SkillRadar).
  const [user, recentAttempts, exercises] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        avatarUrl: true,
        xp: true,
        level: true,
        gems: true,
        streakCount: true,
        longestStreak: true,
        lastCheckInDate: true,
      },
    }),
    prisma.exerciseAttempt.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 50,
      select: {
        id: true,
        score: true,
        createdAt: true,
        exerciseId: true,
      },
    }),
    prisma.exercise.findMany({
      where: { status: "ACTIVE" },
      select: {
        id: true,
        name: true,
        topicId: true,
        topic: { select: { name: true } },
        map: { select: { name: true } }, // Bổ sung: tên "đảo" cho Hero Card context
      },
    }),
  ]);

  if (!user) {
    redirect("/login?callbackUrl=/dashboard");
  }

  // Re-fetch unclaimed với level thật (sau khi đã có user)
  const realUnclaimedMilestones = await getUnclaimedMilestones(userId, user.level ?? 0);

  // Streak warning: chưa luyện bài nào hôm nay
  const lastAttemptDate =
    recentAttempts.length > 0 ? new Date(recentAttempts[0]!.createdAt) : null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const practicedToday =
    lastAttemptDate !== null && lastAttemptDate.getTime() >= today.getTime();
  const showStreakWarning = (user.streakCount ?? 0) > 0 && !practicedToday;

  // Bài tập gợi ý: bài đầu tiên user chưa đạt >= 60 điểm
  const recommendedExercise = exercises.find((ex) => {
    return !recentAttempts.some(
      (a) => a.exerciseId === ex.id && a.score !== null && a.score >= 60,
    );
  });

  // Recent badges
  const recentBadges = await prisma.userBadge.findMany({
    where: { userId },
    orderBy: { earnedAt: "desc" },
    take: 4,
    include: { badge: true },
  });

  // Level progress (skill gamification: XP_to_next_level = Level² × 100)
  const level = user.level ?? 1;
  const xp = user.xp ?? 0;
  const previousLevelXp = (level - 1) * (level - 1) * 100;
  const nextLevelXp = level * level * 100;
  const levelProgress =
    level >= 100
      ? 100
      : Math.min(100, Math.round(((xp - previousLevelXp) / (nextLevelXp - previousLevelXp)) * 100));

  return (
    <OnboardingGate>
      <SeasonEndOverlay />
      <RankChangeNotification />

      {realUnclaimedMilestones.length > 0 && (
        <MilestonePopup unclaimed={realUnclaimedMilestones} />
      )}

      <div className="min-h-screen relative overflow-hidden">
        {/* Decorative blobs */}
        <div
          className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-accent-300 opacity-15 blur-3xl pointer-events-none"
          aria-hidden="true"
        />
        <div
          className="absolute top-1/2 -left-32 h-80 w-80 rounded-full bg-primary-300 opacity-15 blur-3xl pointer-events-none"
          aria-hidden="true"
        />

        <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-8 relative">
          {/* ═══ 1. Header cá nhân ═══ */}
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-neutral-900">
              Xin chào, {user.username ?? "bạn"}! 👋
            </h1>
            <p className="mt-1 text-neutral-600">
              Chào mừng bạn quay lại. Hãy tiếp tục luyện tập nhé!
            </p>
          </div>

          {/* ═══ 2. 3 Stat Cards — nền trắng, viền mỏng, icon có màu (skill ui-color-harmony) ═══ */}
          <div className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Cấp + EXP merged (per spec) */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-neutral-600">Cấp độ</span>
                <span className="text-2xl" aria-hidden>🏅</span>
              </div>
              <p className="mt-2 text-3xl font-black text-neutral-900 tabular-nums">
                {level}
              </p>
              <p className="mt-1 text-xs font-medium text-neutral-500 tabular-nums">
                {xp.toLocaleString("vi-VN")} EXP
              </p>
              <div className="mt-3 h-1.5 w-full rounded-full bg-neutral-100 overflow-hidden">
                <div
                  className="h-1.5 rounded-full bg-primary-500 transition-all duration-700"
                  style={{ width: `${levelProgress}%` }}
                  aria-label={`Tiến độ lên cấp: ${levelProgress}%`}
                />
              </div>
            </div>

            {/* Streak */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-neutral-600">Streak</span>
                <span className="text-2xl" aria-hidden>🔥</span>
              </div>
              <p className="mt-2 text-3xl font-black text-neutral-900 tabular-nums">
                {user.streakCount ?? 0}
              </p>
              <p className="mt-1 text-xs font-medium text-neutral-500">
                ngày liên tiếp (kỷ lục {user.longestStreak ?? 0})
              </p>
            </div>

            {/* Diamonds */}
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-neutral-600">Diamonds</span>
                <span className="text-2xl" aria-hidden>💎</span>
              </div>
              <p className="mt-2 text-3xl font-black text-neutral-900 tabular-nums">
                {user.gems ?? 0}
              </p>
              <p className="mt-1 text-xs font-medium text-neutral-500">
                <Link href="/shop" className="text-primary-600 hover:underline">
                  Vào cửa hàng →
                </Link>
              </p>
            </div>
          </div>

          {/* ═══ 3. Hero Card "🚀 Tiếp tục hành trình" — Call to Action (Fitts + Von Restorff + Goal-Gradient) ═══ */}
          {recommendedExercise ? (
            <Card
              className="mb-6 border border-slate-200 bg-white p-8 shadow-sm"
              role="region"
              aria-label="Bài tập tiếp theo được gợi ý"
            >
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1">
                  <p className="text-xs font-bold uppercase tracking-wider text-primary-600">
                    🚀 Tiếp tục hành trình
                  </p>
                  <h2 className="mt-2 text-2xl font-black text-neutral-900 sm:text-3xl">
                    {recommendedExercise.name}
                  </h2>
                  <p className="mt-2 text-sm text-neutral-600">
                    {recommendedExercise.map?.name
                      ? `Bạn đang dừng lại ở ${recommendedExercise.map.name}. `
                      : "Bạn đang chưa hoàn thành bài này. "}
                    Chủ đề: {recommendedExercise.topic.name}
                  </p>
                </div>
                <Link
                  href={`/exercises/${recommendedExercise.id}`}
                  className={heroButtonClass()}
                >
                  Học tiếp ngay →
                </Link>
              </div>
            </Card>
          ) : (
            <Card
              className="mb-6 border border-success-200 bg-success-50 p-6 shadow-sm"
              role="status"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl" aria-hidden>🎉</span>
                <div>
                  <h2 className="text-lg font-bold text-success-800">
                    Bạn đã hoàn thành tất cả bài tập hiện có!
                  </h2>
                  <p className="mt-1 text-sm text-success-700">
                    Hãy khám phá Lộ trình để mở khoá chủ đề mới.
                  </p>
                </div>
                <Link
                  href="/learning_map"
                  className="ml-auto inline-flex min-h-11 items-center justify-center rounded-xl bg-success-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-success-700 transition-colors"
                >
                  Mở Lộ trình →
                </Link>
              </div>
            </Card>
          )}

          {/* ═══ 4. Streak Warning — chuyển lên trên SpinWheel (theo yêu cầu user) ═══ */}
          {showStreakWarning && (
            <div
              className="mb-6 rounded-2xl border-2 border-warning-300 bg-gradient-to-r from-warning-50 to-accent-50/50 p-5 shadow-lg shadow-warning-200/30"
              role="alert"
            >
              <div className="flex items-center gap-3">
                <span className="text-3xl" aria-hidden>
                  🔥
                </span>
                <div className="flex-1">
                  <p className="font-bold text-warning-800 text-lg">
                    Đừng để mất streak {user.streakCount} ngày!
                  </p>
                  <p className="text-sm text-warning-700">
                    Bạn chưa luyện bài nào hôm nay. Hãy luyện ngay để giữ streak nhé!
                  </p>
                </div>
                {recommendedExercise && (
                  <Link
                    href={`/exercises/${recommendedExercise.id}`}
                    className="hidden sm:inline-flex min-h-11 items-center justify-center rounded-xl bg-warning-600 px-5 py-2.5 text-sm font-bold text-white shadow-md hover:bg-warning-700 transition-colors"
                  >
                    Luyện ngay →
                  </Link>
                )}
              </div>
            </div>
          )}

          {/* ═══ 5. Daily Check-in — chuyển lên trên SpinWheel (theo yêu cầu user) ═══ */}
          <div className="mb-8">
            <DailyCheckIn />
          </div>

          {/* ═══ 6. Vòng xoay may mắn — đặt dưới Streak (theo yêu cầu user) ═══ */}
          <div className="mb-8">
            <SpinWheel />
          </div>

          {/* ═══ 6. Recent Badges (motivation — giữ lại, không vi phạm Less is More) ═══ */}
          {recentBadges.length > 0 && (
            <div className="mb-8">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-neutral-900">
                  🏅 Huy hiệu gần đây
                </h2>
                <Link
                  href="/badges"
                  className="text-sm font-semibold text-primary-600 hover:underline"
                >
                  Xem tất cả →
                </Link>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {recentBadges.map((ub) => (
                  <div
                    key={ub.id}
                    className="rounded-2xl bg-gradient-to-br from-white via-primary-50/30 to-accent-50/20 border-2 border-primary-200/50 p-4 text-center shadow-md hover:shadow-lg hover:border-primary-400 hover:scale-[1.03] transition-all duration-300"
                  >
                    <div className="text-3xl mb-2" aria-hidden>🏅</div>
                    <p className="text-sm font-bold text-neutral-900 truncate">
                      {ub.badge.name}
                    </p>
                    <Badge variant="info" size="sm" className="mt-2">
                      {localizeBadgeType(ub.badge.type)}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ═══ 7. Quick Links ═══ */}
          <div className="flex flex-col gap-4 sm:flex-row">
            <Link href="/exercises" className={primaryLinkClass()}>
              📚 Tất cả bài tập
            </Link>
            <Link
              href="/profile"
              className="inline-flex min-h-11 items-center justify-center rounded-xl bg-gradient-to-r from-neutral-50 to-neutral-100 border-2 border-primary-300/60 px-6 py-3 text-sm font-bold text-neutral-800 shadow-md transition-all hover:shadow-lg hover:border-primary-400 hover:scale-[1.03] active:scale-[0.98] focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500"
            >
              👤 Hồ sơ cá nhân
            </Link>
          </div>
        </main>
      </div>
    </OnboardingGate>
  );
}
