import Link from "next/link";
import { auth } from "@/lib/auth";
import MissionCard from "@/components/gamification/MissionCard";
import TreasureChest from "@/components/gamification/TreasureChest";
import MissionsHero from "@/components/gamification/MissionsHero";
import WeeklyChallengeCard from "@/components/gamification/WeeklyChallengeCard";
import {
  MISSION_POOL,
  TREASURE_CHEST_REWARD,
  computeDailyMissionStats,
  fetchTodaysAttempts,
  getMissionProgress,
  getUserStreak,
} from "@/lib/gamification/missions";

export const dynamic = "force-dynamic";

/**
 * MissionsPage — Bảng nhiệm vụ tập trung (/missions).
 *
 * Redesign theo 3 lý thuyết NV (Octalysis + SDT + Goal-Setting):
 *   - Flat list không tên đảo (SDT Autonomy — generic verbs)
 *   - Rương Kho Báu 🎁 (Octalysis CD2+CD6+CD7 — Treasure Chest)
 *   - Countdown reset hàng ngày (Octalysis CD6 — FOMO)
 *   - Streak reminder
 *
 * Page chỉ orchestrate (fetch data → compute props → render sections).
 * Hero extracted thành <MissionsHero /> để giữ page ≤ 200 LOC (maintainable-code).
 */
export default async function MissionsPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const isAuthenticated = !!userId;

  // Parallel fetch cho streak + attempts
  const [streak, todaysAttempts] = isAuthenticated
    ? await Promise.all([
        getUserStreak(userId),
        fetchTodaysAttempts(userId),
      ])
    : [0, []];

  // Pure helper: compute stats từ attempts
  const stats = computeDailyMissionStats(todaysAttempts);

  // Build mission list với progress (dùng pure helper)
  const missions = MISSION_POOL.map((def) => ({
    ...def,
    progress: Math.min(getMissionProgress(def.type, stats), def.target),
  }));

  // Rương Kho Báu state
  const completedCount = missions.filter((m) => m.progress >= m.target).length;
  const allCompleted = completedCount === missions.length;

  return (
    <div className="min-h-screen bg-neutral-50 px-4 py-10 sm:px-6 lg:px-8">
      <main className="mx-auto max-w-4xl space-y-8">
        {/* ─── Back button ─── */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-base font-bold text-neutral-900 shadow-sm border border-neutral-300 transition hover:bg-neutral-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500"
        >
          <span aria-hidden="true">←</span>
          Quay lại Dashboard
        </Link>

        {/* ─── Hero (extracted to MissionsHero for ≤ 200 LOC limit) ─── */}
        <MissionsHero
          completedCount={completedCount}
          totalCount={missions.length}
          allCompleted={allCompleted}
          streak={streak}
          isAuthenticated={isAuthenticated}
        />

        {/* ─── Rương Kho Báu (Octalysis CD2+CD6+CD7) ─── */}
        {isAuthenticated && (
          <TreasureChest
            unlocked={allCompleted}
            completedCount={completedCount}
            totalCount={missions.length}
            rewardXp={TREASURE_CHEST_REWARD.baseXp}
            rewardGems={TREASURE_CHEST_REWARD.baseGems}
          />
        )}

        {/* ─── Mission list ─── */}
        <section aria-label="Danh sách nhiệm vụ hôm nay">
          <h2 className="mb-4 text-2xl font-bold text-neutral-900">Nhiệm vụ hôm nay</h2>

          {!isAuthenticated ? (
            <div className="rounded-2xl border border-neutral-300 bg-white p-8 text-center">
              <p className="text-xl font-bold text-neutral-900">Vui lòng đăng nhập</p>
              <p className="mt-2 text-base font-normal text-neutral-900">
                Đăng nhập để xem nhiệm vụ và nhận thưởng.
              </p>
              <Link
                href="/login"
                className="mt-4 inline-block rounded-lg bg-primary-600 px-5 py-2.5 text-base font-bold text-white transition hover:bg-primary-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500"
              >
                Đăng nhập
              </Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {missions.map((mission) => (
                <MissionCard
                  key={mission.id}
                  title={mission.title}
                  description={mission.description}
                  target={mission.target}
                  progress={mission.progress}
                  rewardXp={mission.rewardXp}
                  rewardGems={mission.rewardGems}
                />
              ))}
            </ul>
          )}
        </section>

        {/* ─── Weekly Challenge ─── */}
        <section>
          <div className="mb-4 flex items-center gap-3">
            <span className="text-3xl" aria-hidden="true">
              🏆
            </span>
            <h2 className="text-2xl font-bold text-neutral-900">Thử thách tuần</h2>
          </div>
          <WeeklyChallengeCard />
        </section>

        {/* ─── Tips ─── */}
        <section className="rounded-2xl border border-neutral-300 bg-white p-6 shadow-sm">
          <h3 className="text-xl font-bold text-neutral-900">💡 Mẹo nhỏ</h3>
          <ul className="mt-3 space-y-2 text-base font-normal text-neutral-900">
            <li>• Hoàn thành 1 bài 90+ điểm vừa tính cho 2 mission ("Luyện 3 bài" + "Đạt 80+ điểm").</li>
            <li>• Hoàn thành tất cả 4 nhiệm vụ → mở Rương Kho Báu nhận thưởng bonus.</li>
            <li>• Nhiệm vụ reset lúc 00:00 theo múi giờ local của bạn.</li>
          </ul>
        </section>
      </main>
    </div>
  );
}
