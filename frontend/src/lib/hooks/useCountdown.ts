"use client";

import { useEffect, useState } from "react";

/**
 * useCountdown — đếm ngược từ `seconds` xuống 0, chỉ chạy khi `active`.
 *
 * Dùng cho SpeakWordQuestion (Task 5.2) — hiện thời gian còn lại khi recording
 * để user không bị giật mình khi auto-stop (Nielsen H1 — Visibility of System Status).
 *
 * Khi `active` chuyển false → reset về `seconds`.
 *
 * @module hooks/useCountdown
 */
export function useCountdown(seconds: number, active: boolean): number {
  const [remaining, setRemaining] = useState(seconds);

  useEffect(() => {
    if (!active) {
      setRemaining(seconds);
      return;
    }
    setRemaining(seconds);
    const interval = setInterval(() => {
      setRemaining((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(interval);
  }, [active, seconds]);

  return remaining;
}
