"use client";

import {
  STREAK_FIRE_SMALL,
  STREAK_FIRE_MEDIUM,
  STREAK_FIRE_LARGE,
  STREAK_FIRE_DRAGON,
} from "@/lib/gamification/constants";

interface StreakFireIndicatorProps {
  /** Current streak count in days */
  streak: number;
  /** Additional CSS class */
  className?: string;
}

/**
 * StreakFireIndicator — Shows fire emojisys next to streak count.
 *
 * Fire intensity scales with streak length:
 * - 0-2: no fire
 * - 3-6: 🔥 small
 * - 7-13: 🔥🔥 medium (pulse animation)
 * - 14-29: 🔥🔥🔥 large (faster pulse)
 * - 30+: 🔥🔥🔥 + "HỎA LONG!" + glow
 *
 * Respects prefers-reduced-motion: static display only.
 */
export default function StreakFireIndicator({ streak, className = "" }: StreakFireIndicatorProps) {
  if (streak < STREAK_FIRE_SMALL) return null;

  const getFireDisplay = () => {
    if (streak >= STREAK_FIRE_DRAGON) {
      return { fires: "🔥🔥🔥", label: "HỎA LONG!", animate: "fast" as const };
    }
    if (streak >= STREAK_FIRE_LARGE) {
      return { fires: "🔥🔥🔥", label: null, animate: "fast" as const };
    }
    if (streak >= STREAK_FIRE_MEDIUM) {
      return { fires: "🔥🔥", label: null, animate: "normal" as const };
    }
    return { fires: "🔥", label: null, animate: "none" as const };
  };

  const { fires, label, animate } = getFireDisplay();

  const animateClass =
    animate === "fast"
      ? "animate-[pulse-glow_0.8s_ease-in-out_infinite]"
      : animate === "normal"
        ? "animate-[pulse-glow_1.5s_ease-in-out_infinite]"
        : "";

  return (
    <span
      className={`inline-flex items-center gap-1 ${animateClass} motion-reduce:animate-none ${className}`}
      aria-label={`Chuỗi ${streak} ngày, ${label ?? "đang cháy"}`}
      role="img"
    >
      <span aria-hidden="true">{fires}</span>
      {label && (
        <span className="text-xs font-extrabold uppercase tracking-wider text-orange-500">
          {label}
        </span>
      )}
    </span>
  );
}
