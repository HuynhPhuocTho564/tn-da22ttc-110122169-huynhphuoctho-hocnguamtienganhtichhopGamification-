"use client";

/**
 * CampPath — SVG path nối 2 camps trên cùng đảo.
 * Visual metaphor: đường mòn đã đi vs chưa đi.
 * nielsen H1: System status — đường completed = solid, locked = dashed gray.
 * Goal-Gradient: thấy "bao xa nữa" → motivation.
 * maintainable-code: ≤ 80 dòng, pure presentational.
 */

import type { CampData } from "../types/island";
import { calculateCurvedPath } from "../utils/islandUtils";

interface CampPathProps {
  readonly from: CampData;
  readonly to: CampData;
  readonly biomeColor: string;
}

/** Xác định path state dựa trên 2 camps nó nối */
function getPathState(from: CampData, to: CampData): "completed" | "current" | "locked" {
  if (from.state === "completed" && (to.state === "completed" || to.state === "current")) {
    return "completed";
  }
  if (from.state === "completed" && to.state === "available") {
    return "current";
  }
  if (from.state === "current") {
    return "current";
  }
  return "locked";
}

/** Static mapping — Tailwind JIT requires full class names, not dynamic strings */
const BIOME_PATH_COLOR: Record<string, string> = {
  "biome-vowels": "text-biome-vowels",
  "biome-consonants": "text-biome-consonants",
  "biome-pairs": "text-biome-pairs",
  "biome-stress": "text-biome-stress",
};

export default function CampPath({ from, to, biomeColor }: CampPathProps) {
  const pathD = calculateCurvedPath(from.position, to.position);
  const state = getPathState(from, to);
  const colorClass = BIOME_PATH_COLOR[biomeColor] ?? "text-biome-vowels";

  return (
    <g>
      {/* Background path — always visible (gray dashed) */}
      <path
        d={pathD}
        fill="none"
        stroke="#d1d5db"
        strokeWidth={2}
        strokeDasharray="6 4"
        strokeLinecap="round"
        opacity={0.6}
      />

      {/* Completed overlay — solid colored path */}
      {state === "completed" && (
        <path
          d={pathD}
          fill="none"
          stroke="currentColor"
          className={`${colorClass} transition-all duration-700`}
          strokeWidth={2.5}
          strokeLinecap="round"
        />
      )}

      {/* Current path — animated dashed */}
      {state === "current" && (
        <path
          d={pathD}
          fill="none"
          stroke="currentColor"
          className={colorClass}
          strokeWidth={2.5}
          strokeDasharray="8 4"
          strokeLinecap="round"
          style={{ animation: "dash-flow 1.5s linear infinite" }}
        />
      )}
    </g>
  );
}
