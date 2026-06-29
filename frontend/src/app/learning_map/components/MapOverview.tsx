"use client";

/**
 * MapOverview — Header stats cho archipelago map.
 * nielsen H1: System status — user thấy tổng quan ngay.
 * Goal-Gradient: "Bạn đã khám phá 2/4 đảo!" → motivation.
 * maintainable-code: ≤ 100 dòng, presentational.
 */

import type { IslandData, MapOverviewProps } from "../types/island";

export default function MapOverview({
  islands,
  totalExercises,
  completedExercises,
}: MapOverviewProps) {
  const completedIslands = islands.filter((i) => i.state === "completed").length;
  const totalCamps = islands.reduce((sum, i) => sum + i.totalCamps, 0);
  const completedCamps = islands.reduce((sum, i) => sum + i.completedCamps, 0);

  return (
    <section className="mb-8">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        {/* Title — typography chuẩn WCAG AAA: heading bold + body normal, không xám */}
        <div>
          <p className="text-sm font-bold uppercase tracking-widest text-primary-800">
            🏝️ Quần đảo IPA
          </p>
          <h1 className="mt-2 text-4xl font-bold tracking-tight text-neutral-900">
            Hành trình phát âm
          </h1>
          <p className="mt-3 max-w-xl text-base font-normal text-neutral-900">
            Khám phá 4 hòn đảo để chinh phục 44 âm IPA tiếng Anh.
            Mỗi đảo là một vùng đất mới với thử thách riêng.
          </p>
        </div>

        {/* Stats cards — value bold (heading-level), label font-medium (caption) */}
        <div className="grid w-full grid-cols-3 gap-3 lg:w-[360px]">
          <StatCard
            label="Đảo"
            value={`${completedIslands}/${islands.length}`}
            icon="🏝️"
          />
          <StatCard
            label="Trại"
            value={`${completedCamps}/${totalCamps}`}
            icon="⛺"
          />
          <StatCard
            label="Bài đạt"
            value={`${completedExercises}/${totalExercises}`}
            icon="📝"
          />
        </div>
      </div>
    </section>
  );
}

/** Individual stat card */
function StatCard({
  label,
  value,
  icon,
  highlight = false,
}: {
  label: string;
  value: string;
  icon: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl border p-3 text-center transition ${
      highlight
        ? "border-primary-200 bg-primary-50 shadow-sm"
        : "border-neutral-200 bg-white"
    }`}>
      <span className="text-xl" aria-hidden="true">{icon}</span>
      <div className={`mt-1 text-2xl font-bold truncate ${highlight ? "text-primary-800" : "text-neutral-900"}`}>
        {value}
      </div>
      <div className="text-sm font-medium text-neutral-900">{label}</div>
    </div>
  );
}
