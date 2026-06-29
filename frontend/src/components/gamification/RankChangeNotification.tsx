"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRankChange, type RankChange } from "@/lib/hooks/useRankChange";

/**
 * RankChangeNotification — toast báo user bị vượt rank tuần (loss aversion).
 *
 * Hiện góc trên phải, tự ẩn sau 8s (không 5s — cho user kịp đọc),
 * có nút dismiss + link tới leaderboard.
 *
 * Dùng amber (energy/competition) cho notification này (ui-color-harmony).
 *
 * @module gamification/RankChangeNotification
 */

const AUTO_DISMISS_MS = 8000;

export default function RankChangeNotification() {
  const rankChange: RankChange | null = useRankChange();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (!rankChange) return;
    setDismissed(false);
    const timer = setTimeout(() => setDismissed(true), AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [rankChange]);

  if (!rankChange || dismissed) return null;

  return (
    <div
      className="fixed right-4 top-20 z-[90] w-[min(90vw,360px)] animate-[slide-in-right_0.3s_ease-out]"
      role="alert"
      aria-live="assertive"
    >
      <div className="rounded-xl border-2 border-amber-300 bg-amber-50 p-4 shadow-lg">
        <div className="flex items-start justify-between gap-2">
          <p className="font-bold text-amber-800">🏆 Bảng xếp hạng tuần</p>
          <button
            type="button"
            onClick={() => setDismissed(true)}
            aria-label="Đóng thông báo"
            className="rounded p-1 text-amber-600 hover:bg-amber-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500"
          >
            <span aria-hidden="true">✕</span>
          </button>
        </div>
        <p className="mt-1 text-sm text-amber-700">
          Bạn đã tụt từ <strong>#{rankChange.old}</strong> xuống{" "}
          <strong>#{rankChange.new}</strong>. Luyện tập để lấy lại vị trí!
        </p>
        <Link
          href="/leaderboard"
          className="mt-2 inline-block text-sm font-bold text-amber-800 hover:underline"
        >
          Xem bảng xếp hạng →
        </Link>
      </div>
    </div>
  );
}
