"use client";

/**
 * CampTooltip — Hover tooltip cho camp node trên đảo.
 * nielsen H6: Recognition over recall — user không cần click để biết info.
 * Hick: ≤ 5 thông tin — không overwhelm.
 * maintainable-code: ≤ 80 dòng, pure presentational.
 */

import Badge from "@/components/ui/Badge";
import ProgressBar from "@/components/ui/ProgressBar";
import { CAMP_STATE_ICONS } from "../constants/islands";
import type { CampData } from "../types/island";

interface CampTooltipProps {
  readonly camp: CampData;
}

function getRequirementVariant(requirement: string | null): "default" | "success" | "warning" | "error" | "info" {
  if (!requirement) return "default";
  const lower = requirement.toLowerCase();
  if (lower.includes("dễ") || lower.includes("easy") || lower.includes("cơ bản")) return "success";
  if (lower.includes("trung")) return "warning";
  if (lower.includes("khó") || lower.includes("hard")) return "error";
  return "info";
}

export default function CampTooltip({ camp }: CampTooltipProps) {
  return (
    <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-3 -translate-x-1/2">
      <div className="w-56 rounded-xl border border-neutral-200 bg-white p-4 shadow-xl">
        {/* Header: name + state icon */}
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-sm font-bold text-neutral-900 leading-tight">{camp.name}</h4>
          <span className="text-lg shrink-0" aria-hidden="true">
            {CAMP_STATE_ICONS[camp.state]}
          </span>
        </div>

        {/* Progress bar */}
        <div className="mt-3">
          <ProgressBar
            value={camp.completedExercises}
            max={Math.max(camp.totalExercises, 1)}
            label={`${camp.completedExercises}/${camp.totalExercises} bài đạt`}
            size="sm"
            showPercentage={camp.totalExercises > 0}
            color={camp.state === "completed" ? "success" : "primary"}
          />
        </div>

        {/* Requirement badge */}
        {camp.requirement && (
          <div className="mt-2">
            <Badge variant={getRequirementVariant(camp.requirement)} size="sm">
              {camp.requirement}
            </Badge>
          </div>
        )}
      </div>

      {/* Tooltip arrow */}
      <div className="mx-auto h-0 w-0 border-x-[8px] border-t-[8px] border-x-transparent border-t-white" />
    </div>
  );
}
