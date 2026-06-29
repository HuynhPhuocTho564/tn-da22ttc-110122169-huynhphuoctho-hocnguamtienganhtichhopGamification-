"use client";

import { useEffect, useRef, useState } from "react";

/**
 * useCountUp — animate number from current value đến `target` trong `durationMs`,
 * dùng `easeOutCubic`. Cleanup RAF on unmount; respect prefers-reduced-motion
 * (instant set target). Re-render mỗi frame, isolated khỏi parent re-render khác.
 *
 * Dùng cho EXP reward grid, streak counter, progress count-up (Chunk C5).
 *
 * @example
 *   const xp = useCountUp(currentXP, { durationMs: 1000 });
 *   return <span>{xp.toLocaleString()} EXP</span>;
 *
 * @param target   giá trị đích để đếm tới
 * @param options  durationMs (default 1200), startOnMount (default true)
 * @returns        current animated value
 */
export function useCountUp(
  target: number,
  options: { durationMs?: number; startOnMount?: boolean } = {}
): number {
  const { durationMs = 1200, startOnMount = true } = options;
  const [value, setValue] = useState(startOnMount ? 0 : target);
  const startTimeRef = useRef<number | null>(null);
  const fromRef = useRef(startOnMount ? 0 : target);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    // Respect prefers-reduced-motion: skip animation, set instant.
    if (
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)").matches
    ) {
      setValue(target);
      return;
    }

    // Capture current displayed value as the "from" of this animation leg.
    fromRef.current = value;
    startTimeRef.current = null;

    const tick = (timestamp: number) => {
      if (startTimeRef.current === null) {
        startTimeRef.current = timestamp;
      }
      const elapsed = timestamp - startTimeRef.current;
      const progress = Math.min(elapsed / durationMs, 1);
      // easeOutCubic — start nhanh, end chậm (cảm giác "đã" khi về đích).
      const eased = 1 - Math.pow(1 - progress, 3);
      const next = Math.round(
        fromRef.current + (target - fromRef.current) * eased
      );
      setValue(next);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        rafRef.current = null;
      }
    };

    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current !== null) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
    // value captured via fromRef.current; deps intentionally [target, durationMs]
    // để parent re-render không reset animation (chỉ reset khi target đổi).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, durationMs]);

  return value;
}
