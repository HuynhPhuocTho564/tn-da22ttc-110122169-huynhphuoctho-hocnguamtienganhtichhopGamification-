import React from "react";
import Card from "./Card";

/**
 * Skeleton loading components — chiếm chỗ trong khi data đang tải,
 * thay vì text "Đang tải..." (Nielsen H1 — Visibility of system status,
 * Doherty Threshold — phản hồi tức thì khi chờ data).
 *
 * Dùng chung cho badges page, leaderboard page, và các page fetch data khác
 * (maintainable-code: DRY — skeleton pattern nhất quán giữa các page).
 *
 * @module ui/Skeleton
 */

/**
 * Một khối xám mờ có animate-pulse, mô phỏng hình dáng nội dung thật.
 * Dùng cho card, badge, stat block...
 */
export function SkeletonBlock({
  className = "",
}: {
  className?: string;
}) {
  return <div className={`animate-pulse rounded bg-neutral-200 ${className}`} />;
}

/**
 * Skeleton card grid — mô phỏng badge card: icon + badge type + title + body.
 * Dùng cho badges page (P1-1.4.1).
 */
export function SkeletonCardGrid({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="border-2">
          <div className="flex items-start justify-between gap-4 mb-4">
            <div className="h-14 w-14 rounded-xl bg-neutral-200 animate-pulse" />
            <div className="h-5 w-16 rounded bg-neutral-200 animate-pulse" />
          </div>
          <div className="h-6 w-3/4 rounded bg-neutral-200 animate-pulse mb-2" />
          <div className="h-4 w-full rounded bg-neutral-100 animate-pulse mb-4" />
          <div className="h-4 w-1/2 rounded bg-neutral-100 animate-pulse" />
        </Card>
      ))}
    </div>
  );
}

/**
 * Skeleton list row — mô phỏng hàng leaderboard: rank circle + avatar + name + score.
 * Dùng cho leaderboard page (P1-1.4.2).
 */
export function SkeletonLeaderboardList({ count = 5 }: { count?: number }) {
  return (
    <Card padding="none" aria-busy="true">
      <div className="divide-y divide-neutral-100">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 p-4">
            <div className="h-12 w-12 rounded-full bg-neutral-200 animate-pulse" />
            <div className="h-12 w-12 rounded-full bg-neutral-200 animate-pulse" />
            <div className="flex-1 space-y-2">
              <div className="h-4 w-32 rounded bg-neutral-200 animate-pulse" />
              <div className="h-3 w-48 rounded bg-neutral-100 animate-pulse" />
            </div>
            <div className="h-6 w-16 rounded bg-neutral-200 animate-pulse" />
          </div>
        ))}
      </div>
    </Card>
  );
}

/**
 * Skeleton shop grid — mô phỏng item card: ảnh + tên + giá.
 * Dùng cho shop page khi fetch diamonds/items (Chunk C6).
 */
export function SkeletonShopGrid({ count = 6 }: { count?: number }) {
  return (
    <div
      className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
      aria-busy="true"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="rounded-xl border border-neutral-200 p-4 animate-pulse"
        >
          <div className="h-32 rounded-lg bg-neutral-100" />
          <div className="h-5 w-3/4 rounded bg-neutral-200 mt-3" />
          <div className="h-4 w-1/2 rounded bg-neutral-100 mt-2" />
        </div>
      ))}
    </div>
  );
}

/**
 * Skeleton daily check-in — mô phỏng 7-day cycle + milestone bar.
 * Dùng cho DailyCheckIn khi đang load status (Chunk C6).
 */
export function SkeletonDailyCheckIn() {
  return (
    <div className="space-y-4 animate-pulse" aria-busy="true">
      <div className="grid grid-cols-7 gap-2">
        {Array.from({ length: 7 }).map((_, i) => (
          <div key={i} className="aspect-square rounded-lg bg-neutral-200" />
        ))}
      </div>
      <div className="h-16 rounded-lg bg-neutral-100" />
    </div>
  );
}
