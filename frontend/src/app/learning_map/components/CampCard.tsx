"use client";

/**
 * CampCard — Card trong Island Detail Panel.
 * Hiển thị 1 camp với progress + clickable.
 * maintainable-code: ≤ 80 dòng, presentational.
 * Fitts: touch target đủ lớn, hover feedback rõ.
 */

import ProgressBar from "@/components/ui/ProgressBar";
import { CAMP_STATE_ICONS } from "../constants/islands";
import type { CampData } from "../types/island";

interface CampCardProps {
  readonly camp: CampData;
  readonly onClick: (camp: CampData) => void;
}

export default function CampCard({ camp, onClick }: CampCardProps) {
  const isClickable = camp.state !== "locked";

  return (
    <button
      type="button"
      onClick={() => isClickable && onClick(camp)}
      disabled={!isClickable}
      className={`group rounded-xl border p-5 text-left transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 focus-visible:ring-offset-2 ${
        isClickable
          ? "border-neutral-200 bg-white hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md cursor-pointer"
          : "border-neutral-100 bg-neutral-50 opacity-60 cursor-not-allowed"
      }`}
      aria-label={
        isClickable
          ? `${camp.name} — ${camp.completedExercises}/${camp.totalExercises} bài đạt`
          : `${camp.name} — bị khóa`
      }
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-2xl font-bold text-slate-900 group-hover:text-primary-800 transition-colors">
          {camp.name}
        </h3>
        <span className="text-2xl shrink-0" aria-hidden="true">
          {CAMP_STATE_ICONS[camp.state]}
        </span>
      </div>

      {/* Stats */}
      <p className="mt-2 text-base font-normal text-neutral-900">
        {camp.totalExercises} dạng bài, {camp.completedExercises} đã đạt
      </p>

      {/* Progress */}
      <div className="mt-3">
        <ProgressBar
          value={camp.completedExercises}
          max={Math.max(camp.totalExercises, 1)}
          showPercentage={camp.totalExercises > 0}
          color={camp.state === "completed" ? "success" : "primary"}
        />
      </div>

      {/* CTA — 3 trạng thái với contrast cao, không xám */}
      <div className="mt-4">
        {camp.state === "locked" ? (
          <span className="inline-block rounded-lg bg-neutral-900 px-4 py-2 text-base font-bold text-white">
            🔒 Bị khóa
          </span>
        ) : camp.state === "completed" ? (
          <span className="inline-block rounded-lg bg-success-100 px-4 py-2 text-base font-bold text-success-800">
            ✓ Hoàn thành
          </span>
        ) : (
          <span className="inline-block rounded-lg bg-primary-100 px-4 py-2 text-base font-bold text-primary-800 transition group-hover:bg-primary-200">
            Khám phá trại →
          </span>
        )}
      </div>
    </button>
  );
}
