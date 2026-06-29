"use client";

/**
 * MissionsCountdown — Countdown live đến lúc reset nhiệm vụ (Octalysis CD6).
 *
 * Client component vì cần useEffect + setInterval để update mỗi phút.
 * Hiển thị thời gian còn lại dạng "X giờ Y phút" hoặc "Y phút".
 */

import { useEffect, useState } from "react";
import { formatTimeUntilReset, getNextResetTime } from "@/lib/gamification/missions";

export default function MissionsCountdown() {
  // Khởi tạo với thời điểm reset hôm nay (giữa đêm local).
  // Sử dụng state để re-render khi midnight rollover.
  const [resetAt, setResetAt] = useState<Date>(() => getNextResetTime());

  // Tính thời gian còn lại — re-render mỗi phút.
  // Lưu ý: component render server-side với giá trị ban đầu,
  // sau đó client effect sẽ tick mỗi 60s.
  const [timeLeft, setTimeLeft] = useState<string>(() =>
    formatTimeUntilReset(resetAt),
  );

  useEffect(() => {
    // Update ngay khi mount (tránh hydration mismatch)
    setTimeLeft(formatTimeUntilReset(resetAt));

    const tick = () => {
      const next = getNextResetTime();
      const nextLeft = formatTimeUntilReset(next);
      setResetAt(next);
      setTimeLeft(nextLeft);
    };

    const interval = setInterval(tick, 60_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1 text-sm font-bold text-neutral-900 border border-primary-300">
      <span aria-hidden="true">⏰</span>
      <span suppressHydrationWarning>Còn {timeLeft}</span>
    </span>
  );
}
