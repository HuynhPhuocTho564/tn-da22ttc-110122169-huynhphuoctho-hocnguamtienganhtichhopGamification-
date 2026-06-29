"use client";

/**
 * ArchipelagoMap — Container chính hiển thị 4 đảo trên nền biển.
 * Sea background + grid of IslandNodes + decorative elements.
 * nielsen H8: Minimalist — chỉ giữ elements phục vụ navigation.
 * maintainable-code: ≤ 120 dòng, delegates rendering.
 */

import IslandNode from "./IslandNode";
import type { IslandData } from "../types/island";

interface ArchipelagoMapProps {
  readonly islands: IslandData[];
  readonly onIslandClick: (island: IslandData) => void;
}

export default function ArchipelagoMap({ islands, onIslandClick }: ArchipelagoMapProps) {
  return (
    <div className="relative overflow-hidden rounded-3xl border border-sky-200 bg-gradient-to-b from-sky-100 via-sky-50 to-blue-100 p-4 shadow-inner sm:p-6 md:p-8">
      {/* Sea wave decorations */}
      <div className="pointer-events-none absolute inset-0" aria-hidden="true">
        {/* Wave SVG patterns */}
        <div className="absolute bottom-0 left-0 right-0 h-16 opacity-20">
          <img src="/illustrations/elements/wave-pattern.svg" alt="" className="h-full w-full object-cover" />
        </div>

        {/* Floating clouds */}
        <div className="absolute top-4 left-4 opacity-30">
          <img src="/illustrations/elements/cloud.svg" alt="" className="h-8 w-16" />
        </div>
        <div
          className="absolute top-12 right-8 opacity-20"
          style={{ animation: "cloud-float 30s linear infinite" }}
        >
          <img src="/illustrations/elements/cloud.svg" alt="" className="h-6 w-12" />
        </div>
        <div
          className="absolute top-24 left-1/3 opacity-15"
          style={{ animation: "cloud-float 45s linear infinite", animationDelay: "10s" }}
        >
          <img src="/illustrations/elements/cloud.svg" alt="" className="h-5 w-10" />
        </div>
      </div>

      {/* Island grid — 2x2 on desktop, 1 column on mobile */}
      <div className="relative z-10 grid grid-cols-1 gap-5 md:grid-cols-2 lg:gap-6">
        {islands.map((island) => (
          <IslandNode
            key={island.topicId}
            island={island}
            onClick={onIslandClick}
          />
        ))}
      </div>

      {/* Sea anchor decoration */}
      <div className="pointer-events-none absolute bottom-3 right-4 opacity-15" aria-hidden="true">
        <img src="/illustrations/elements/anchor.svg" alt="" className="h-8 w-8" />
      </div>
    </div>
  );
}
