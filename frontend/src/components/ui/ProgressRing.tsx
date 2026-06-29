"use client";

/**
 * ProgressRing — SVG circular progress indicator.
 * Reusable: Island Map camps, dashboard stats, profile.
 * maintainable-code: ≤ 60 dòng, pure presentational, no magic numbers.
 * nielsen H1: Progress visible — user thấy % hoàn thành ngay.
 */

import type { ProgressRingProps } from "@/app/learning_map/types/island";

const FULL_CIRCLE_DEGREES = -90; // Start arc from top (12 o'clock)

export default function ProgressRing({
  percent,
  size,
  strokeWidth,
  colorClass,
  trackClass = "text-neutral-200",
}: ProgressRingProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedPercent = Math.min(Math.max(percent, 0), 100);
  const dashOffset = circumference - (clampedPercent / 100) * circumference;
  const center = size / 2;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="absolute inset-0"
      aria-hidden="true"
    >
      {/* Background track */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="currentColor"
        className={trackClass}
        strokeWidth={strokeWidth}
      />
      {/* Progress arc */}
      <circle
        cx={center}
        cy={center}
        r={radius}
        fill="none"
        stroke="currentColor"
        className={`${colorClass} transition-all duration-700 ease-out`}
        strokeWidth={strokeWidth}
        strokeDasharray={circumference}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        transform={`rotate(${FULL_CIRCLE_DEGREES} ${center} ${center})`}
      />
    </svg>
  );
}
