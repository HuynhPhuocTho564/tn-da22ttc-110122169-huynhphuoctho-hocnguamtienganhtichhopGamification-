"use client";

/**
 * CampNode — Node đại diện cho 1 sound group (camp) trên đảo.
 * nielsen H6: Recognition — user thấy ngay camp nào completed/current/locked.
 * Fitts: touch target ≥ 48px (CAMP_NODE_MIN_SIZE_PX).
 * Color-blind safe: icon + color + text (3 channels).
 * maintainable-code: ≤ 120 dòng, single responsibility.
 */

import ProgressRing from "@/components/ui/ProgressRing";
import { CAMP_STATE_ICONS, CAMP_NODE_MIN_SIZE_PX } from "../constants/islands";
import type { CampData } from "../types/island";

interface CampNodeProps {
  readonly camp: CampData;
  readonly onClick: (camp: CampData) => void;
}

/** State → Tailwind classes mapping (tập trung, không rải trong JSX) */
const CAMP_STATE_CLASSES: Record<string, string> = {
  completed: "bg-success-100 border-success-500 cursor-pointer hover:scale-110 hover:shadow-lg",
  current: "bg-primary-100 border-primary-500 cursor-pointer hover:scale-110 hover:shadow-lg",
  available: "bg-white border-neutral-300 cursor-pointer hover:scale-105 hover:shadow-md",
  locked: "bg-neutral-100 border-neutral-200 cursor-not-allowed opacity-60",
};

const RING_COLOR_BY_STATE: Record<string, string> = {
  completed: "text-success-500",
  current: "text-primary-500",
  available: "text-neutral-300",
  locked: "text-neutral-200",
};

export default function CampNode({ camp, onClick }: CampNodeProps) {
  const isClickable = camp.state !== "locked";
  const stateClasses = CAMP_STATE_CLASSES[camp.state] ?? CAMP_STATE_CLASSES.available;
  const ringColor = RING_COLOR_BY_STATE[camp.state] ?? "text-neutral-300";

  return (
    <button
      type="button"
      onClick={() => isClickable && onClick(camp)}
      disabled={!isClickable}
      className={`relative flex items-center justify-center rounded-full border-2 transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${stateClasses} ${camp.state === "current" ? "animate-camp-pulse" : ""}`}
      style={{ minHeight: CAMP_NODE_MIN_SIZE_PX, minWidth: CAMP_NODE_MIN_SIZE_PX, height: 48, width: 48 }}
      aria-label={
        isClickable
          ? `${camp.name} — ${camp.completedExercises}/${camp.totalExercises} bài đạt`
          : `${camp.name} — bị khóa`
      }
    >
      {/* Progress Ring around node */}
      <ProgressRing
        percent={camp.completionPercent}
        size={48}
        strokeWidth={3}
        colorClass={ringColor}
      />

      {/* Center state icon */}
      <span className="relative z-10 text-base leading-none" aria-hidden="true">
        {CAMP_STATE_ICONS[camp.state]}
      </span>
    </button>
  );
}
