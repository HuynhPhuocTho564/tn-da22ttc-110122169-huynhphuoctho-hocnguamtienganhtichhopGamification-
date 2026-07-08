"use client";

/**
 * CampCard — Card trong Island Detail Panel.
 * Hiển thị 1 camp với progress + clickable.
 * maintainable-code: ≤ 80 dòng, presentational.
 * Fitts: touch target đủ lớn, hover feedback rõ.
 */

import ProgressBar from "@/components/ui/ProgressBar";
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
          {camp.state === "completed" ? "🏕️" : camp.state === "locked" ? "🔒" : "⛺"}
        </span>
      </div>

      {/* Stats */}
      <p className="mt-2 text-base font-normal text-neutral-900">
        Đạt {camp.completedExercises}/{camp.totalExercises}
      </p>

      {/* Progress */}
      <div className="mt-3">
        <ProgressBar
          value={camp.completedExercises}
          max={Math.max(camp.totalExercises, 1)}
          showPercentage={true}
          color={camp.state === "completed" ? "success" : "primary"}
        />
      </div>

      {/* CTA — play icon cho in-progress, tag cho completed/locked */}
      <div className="mt-4">
        {camp.state === "locked" ? (
          <span className="inline-block text-sm font-medium text-neutral-400">
            🔒 Bị khóa
          </span>
        ) : camp.state === "completed" ? null : (
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-primary-600 text-white shadow-sm transition-all group-hover:bg-primary-700 group-hover:scale-110"
            aria-label={`Khám phá ${camp.name}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4 ml-0.5" aria-hidden="true">
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        )}
      </div>
    </button>
  );
}
