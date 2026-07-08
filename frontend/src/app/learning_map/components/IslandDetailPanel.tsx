"use client";

/**
 * IslandDetailPanel — Click đảo → hiện danh sách trại (cards).
 * Reverted to card-grid view — dễ bấm, dễ đọc.
 * nielsen H3: Back button. H6: Recognition. H7: Flexibility.
 */

import { useEffect, useRef } from "react";
import CampCard from "./CampCard";
import { getBiomeForTopic } from "../utils/islandUtils";
import type { IslandData, CampData } from "../types/island";

interface IslandDetailPanelProps {
  readonly island: IslandData;
  readonly onBack: () => void;
  readonly onCampSelect: (camp: CampData) => void;
}

const GRADIENT: Record<string, string> = {
  vowels: "from-emerald-400 to-green-600",
  consonants: "from-blue-400 to-indigo-600",
  pairs: "from-purple-400 to-fuchsia-600",
  stress: "from-orange-400 to-red-600",
};

export default function IslandDetailPanel({ island, onBack, onCampSelect }: IslandDetailPanelProps) {
  const biome = getBiomeForTopic(island.topicId);
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, []);
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
  }, [island.topicId]);
  const bId = biome.id;
  const gradClass = GRADIENT[bId] ?? "from-neutral-400 to-neutral-600";

  // Group camps by subcategory
  const groups = island.camps.reduce<Record<string, CampData[]>>((acc, camp) => {
    const key = camp.subcategory ?? "__none__";
    if (!acc[key]) acc[key] = [];
    acc[key].push(camp);
    return acc;
  }, {});

  const completedCamps = island.camps.filter((c) => c.state === "completed").length;

  return (
    <div className="animate-slide-up-panel">
      {/* ═══ ISLAND HEADER ═══ */}
      <div className={`mb-6 rounded-2xl bg-gradient-to-r ${gradClass} p-5 text-white shadow-lg`}>
        <div className="flex items-center gap-4">
          <span className="text-5xl" aria-hidden="true">{biome.icon}</span>
          <div className="flex-1">
            <h1 ref={headingRef} tabIndex={-1} className="text-3xl font-bold focus:outline-none">
              {island.name}
            </h1>
            <p className="mt-1 text-base font-normal">{island.description}</p>
          </div>
          <div className="text-right">
            <div className="text-5xl font-bold leading-none">{island.completionPercent}%</div>
            <div className="mt-1 text-sm font-normal">{completedCamps}/{island.camps.length} trại</div>
          </div>
        </div>
        {/* Progress bar — track + fill + inner shine */}
        <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-white/30">
          <div
            className="relative h-full overflow-hidden rounded-full bg-white transition-all duration-700"
            style={{ width: `${island.completionPercent}%` }}
          >
            <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-white/60 to-transparent" />
          </div>
        </div>
      </div>

      {/* ═══ CAMP CARDS ═══ */}
      {Object.entries(groups).map(([key, camps]) => (
        <section key={key} className="mb-6" aria-label={key !== "__none__" ? key : "Danh sách trại"}>
          {key !== "__none__" && (
            <h2 className="mb-3 text-lg font-bold tracking-tight text-neutral-900">{key}</h2>
          )}
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {camps.map((camp) => (
              <CampCard key={camp.mapId} camp={camp} onClick={onCampSelect} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
