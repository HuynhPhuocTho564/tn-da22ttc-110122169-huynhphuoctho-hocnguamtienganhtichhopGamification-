import Image from "next/image";

/**
 * TreasureChest — Rương Kho Báu hôm nay (Octalysis CD2 + CD6 + CD7).
 *
 * Locked state khi chưa hoàn thành TẤT CẢ nhiệm vụ; unlocked khi done hết.
 * Phần thưởng bonus (CD7 — Surprise) được reveal khi mở.
 * Server component — không cần client interactivity.
 */

interface TreasureChestProps {
  /** Tất cả nhiệm vụ đã hoàn thành chưa? */
  readonly unlocked: boolean;
  /** Số nhiệm vụ đã hoàn thành (cho progress) */
  readonly completedCount: number;
  /** Tổng số nhiệm vụ */
  readonly totalCount: number;
  /** Phần thưởng EXP */
  readonly rewardXp: number;
  /** Phần thưởng Diamonds */
  readonly rewardGems: number;
}

export default function TreasureChest({
  unlocked,
  completedCount,
  totalCount,
  rewardXp,
  rewardGems,
}: TreasureChestProps) {
  const ratio = totalCount > 0 ? completedCount / totalCount : 0;

  return (
    <section
      className={`rounded-2xl border-2 p-6 shadow-sm transition ${
        unlocked
          ? "border-amber-300 bg-gradient-to-r from-amber-50 to-yellow-50"
          : "border-neutral-300 bg-neutral-50"
      }`}
      aria-label="Rương Kho Báu hôm nay"
      aria-live={unlocked ? "polite" : undefined}
    >
      <div className="flex items-center gap-4">
        <div
          className={`relative h-16 w-16 shrink-0 transition ${unlocked ? "scale-105" : "opacity-90"}`}
          aria-hidden="true"
        >
          <Image
            src="/illustrations/elements/treasure-chest-simple.svg"
            alt=""
            fill
            sizes="64px"
            className="object-contain"
            priority
          />
        </div>
        <div className="flex-1">
          <h3
            className={`text-xl font-bold ${
              unlocked ? "text-amber-900" : "text-neutral-900"
            }`}
          >
            Rương Kho Báu hôm nay
          </h3>
          <p
            className={`mt-1 text-sm font-normal ${
              unlocked ? "text-amber-800" : "text-neutral-900"
            }`}
          >
            {unlocked
              ? `🎉 Đã mở! Phần thưởng: +${rewardGems}💎 +${rewardXp}EXP`
              : `Hoàn thành tất cả nhiệm vụ để mở (${completedCount}/${totalCount}).`}
          </p>
        </div>
        {unlocked && (
          <button
            type="button"
            className="shrink-0 rounded-lg bg-amber-600 px-4 py-2 text-sm font-bold text-white transition hover:bg-amber-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-500"
          >
            Nhận thưởng
          </button>
        )}
      </div>

      {/* Progress bar tổng (Octalysis CD2 — thấy tiến độ) */}
      {!unlocked && totalCount > 0 && (
        <div className="mt-4">
          <div
            className="h-2 w-full overflow-hidden rounded-full bg-neutral-200"
            role="progressbar"
            aria-valuemin={0}
            aria-valuemax={totalCount}
            aria-valuenow={completedCount}
            aria-label={`Tiến độ mở Rương Kho Báu: ${completedCount}/${totalCount}`}
          >
            <div
              className="h-2 rounded-full bg-primary-500 transition-all duration-700"
              style={{ width: `${Math.round(ratio * 100)}%` }}
            />
          </div>
        </div>
      )}
    </section>
  );
}
