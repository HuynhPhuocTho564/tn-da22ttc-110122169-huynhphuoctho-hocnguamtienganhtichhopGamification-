import MissionsCountdown from "@/components/gamification/MissionsCountdown";

/**
 * MissionsHero — Hero section của trang /missions (Octalysis CD2/CD6 + SDT Relatedness).
 *
 * Server component — nhận data từ page.tsx qua props (data đã được compute server-side).
 * Client component con (MissionsCountdown) được compose vào để live update.
 *
 * Hiển thị:
 *   - Eyebrow + H1 + subtitle (Octalysis CD2 — goal clarity)
 *   - Auth warning nếu chưa đăng nhập
 *   - Stat chips: streak and countdown
 *   - Overall progress chip
 *
 * Typography WCAG AAA — text-neutral-900, bold/normal mix, không gray.
 */

interface MissionsHeroProps {
  /** Tổng số nhiệm vụ đã hoàn thành */
  readonly completedCount: number;
  /** Tổng số nhiệm vụ */
  readonly totalCount: number;
  /** Đã hoàn thành tất cả? (nếu true → success state) */
  readonly allCompleted: boolean;
  /** Streak hiện tại (0 = ẩn chip streak) */
  readonly streak: number;
  /** Đã đăng nhập? (nếu false → hiện warning, ẩn stats chips) */
  readonly isAuthenticated: boolean;
}

export default function MissionsHero({
  completedCount,
  totalCount,
  allCompleted,
  streak,
  isAuthenticated,
}: MissionsHeroProps) {
  return (
    <section
      className={`rounded-3xl border p-8 shadow-sm ${
        allCompleted
          ? "border-success-300 bg-success-50"
          : "border-primary-300 bg-gradient-to-r from-primary-100 via-primary-50 to-blue-100"
      }`}
    >
      <p className="text-sm font-bold uppercase tracking-widest text-primary-800">
        🎯 Bảng nhiệm vụ hôm nay
      </p>
      <h1 className="mt-2 text-4xl font-bold tracking-tight text-neutral-900">
        {allCompleted
          ? "🎉 Hoàn thành tất cả nhiệm vụ!"
          : "Hoàn thành nhiệm vụ để nhận thưởng"}
      </h1>
      <p className="mt-3 max-w-2xl text-base font-normal text-neutral-900">
        Mỗi ngày có {totalCount} nhiệm vụ. Hoàn thành để nhận EXP và Diamonds. Nhiệm vụ áp
        dụng cho mọi đảo đang mở — bạn không cần chọn đảo trước.
      </p>

      {!isAuthenticated && (
        <p className="mt-4 inline-block rounded-lg bg-warning-100 px-3 py-1.5 text-sm font-bold text-warning-800 border border-warning-300">
          ⚠️ Bạn cần đăng nhập để nhận thưởng nhiệm vụ.
        </p>
      )}

      {/* Stat chips: streak + countdown (Octalysis CD2+CD6) */}
      {isAuthenticated && (
        <div className="mt-4 flex flex-wrap items-center gap-2">
          {streak > 0 && (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-3 py-1.5 text-sm font-bold text-amber-800 border border-amber-300"
              aria-label={`Chuỗi ${streak} ngày liên tiếp`}
            >
              <span aria-hidden="true">🔥</span>
              <span>{streak} ngày liên tiếp</span>
            </span>
          )}
          <MissionsCountdown />
        </div>
      )}

      {/* Overall progress */}
      {isAuthenticated && (
        <div className="mt-4 inline-flex items-center gap-3 rounded-full bg-white px-4 py-2 text-base font-bold text-neutral-900 border border-primary-300">
          <span aria-hidden="true">📋</span>
          <span>
            Hoàn thành:{" "}
            <span className="text-primary-800">
              {completedCount}/{totalCount}
            </span>
          </span>
        </div>
      )}
    </section>
  );
}
