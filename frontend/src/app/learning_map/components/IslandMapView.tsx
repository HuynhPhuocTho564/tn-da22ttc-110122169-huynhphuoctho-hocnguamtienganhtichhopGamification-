"use client";

/**
 * IslandMapView — Orchestrator chính cho IPA Archipelago.
 * Quản lý navigation state: selected island → selected camp → exercises.
 * Map view only — list view đã bị xóa theo yêu cầu UX.
 *
 * maintainable-code: ≤ 200 dòng, chỉ orchestrate, không business logic phức tạp.
 * nielsen H3: User control — back navigation ở mọi level.
 */

import { useEffect, useLayoutEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import ArchipelagoMap from "./ArchipelagoMap";
import IslandDetailPanel from "./IslandDetailPanel";
import CampExerciseView from "./CampExerciseView";
import MapOverview from "./MapOverview";
import OnboardingBanner from "./OnboardingBanner";
import { transformTopicsToIslands, calculateArchipelagoStats } from "../utils/islandUtils";
import { playSfx } from "@/lib/sfx";
import type { TopicUI, IslandData, CampData } from "../types/island";

export default function IslandMapView({ topics }: { topics: TopicUI[] }) {
  // Navigation state — drill-down: map → island → camp
  const [selectedIsland, setSelectedIsland] = useState<IslandData | null>(null);
  const [selectedCamp, setSelectedCamp] = useState<CampData | null>(null);

  // Transform data — memoized pure function
  const islands = useMemo(() => transformTopicsToIslands(topics), [topics]);
  const stats = useMemo(() => calculateArchipelagoStats(islands), [islands]);

  // B. Unlock celebration — fire confetti khi user vừa mở khóa đảo mới.
  // Đọc locked-state trước đó từ localStorage, so sánh với hiện tại.
  // Nếu có đảo vừa chuyển từ locked→unlocked → bắn confetti 🎉.
  useEffect(() => {
    if (islands.length === 0) return;
    const STORAGE_KEY = "learning_map_locked_states";

    let prevStates: Record<string, boolean> = {};
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) prevStates = JSON.parse(raw) as Record<string, boolean>;
    } catch {
      // localStorage có thể bị disabled (private mode) → bỏ qua
    }

    const newlyUnlocked = islands.filter(
      (i) => prevStates[i.topicId] === true && i.isLocked === false,
    );

    if (newlyUnlocked.length > 0) {
      // Fire-and-forget SFX cho topic unlock (Chunk C1)
      playSfx("tada");
      // Bắn confetti 2 lần cho vui — trái + phải
      const colors = ["#10b981", "#3b82f6", "#a855f7", "#f97316", "#facc15"];
      confetti({
        particleCount: 120,
        spread: 80,
        origin: { x: 0.2, y: 0.6 },
        colors,
      });
      setTimeout(() => {
        confetti({
          particleCount: 120,
          spread: 80,
          origin: { x: 0.8, y: 0.6 },
          colors,
        });
      }, 250);
    }

    // Lưu state hiện tại để so sánh lần sau
    const currentStates = Object.fromEntries(
      islands.map((i) => [i.topicId, i.isLocked]),
    );
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(currentStates));
    } catch {
      // ignore
    }
  }, [islands]);

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, behavior: "instant" });
  }, [selectedIsland, selectedCamp]);

  // nielsen H3: Back navigation — contextual
  const handleBack = () => {
    if (selectedCamp) {
      setSelectedCamp(null);
    } else if (selectedIsland) {
      setSelectedIsland(null);
    }
  };

  const handleIslandClick = (island: IslandData) => {
    if (!island.isLocked) {
      setSelectedIsland(island);
      setSelectedCamp(null);
    }
  };

  const handleCampSelect = (camp: CampData) => {
    setSelectedCamp(camp);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 sm:px-6 lg:px-8">
      {/* Breadcrumb for deep navigation — with icons + colored active state */}
      {(selectedIsland || selectedCamp) && (
        <nav className="mb-4 flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-base shadow-sm" aria-label="Breadcrumb">
          <button
            type="button"
            onClick={() => { setSelectedIsland(null); setSelectedCamp(null); }}
            className="flex items-center gap-1.5 rounded-md px-2 py-1 font-bold text-primary-800 transition hover:bg-primary-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            <span aria-hidden="true">🗺️</span>
            <span>Bản đồ</span>
          </button>
          {selectedIsland && (
            <>
              <span aria-hidden="true" className="font-bold text-neutral-900">›</span>
              <button
                type="button"
                onClick={() => setSelectedCamp(null)}
                className={`flex items-center gap-1.5 rounded-md px-2 py-1 font-bold transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                  selectedCamp
                    ? "text-primary-800 hover:bg-primary-100"
                    : "bg-primary-100 text-primary-900"
                }`}
                aria-current={selectedCamp ? undefined : "page"}
              >
                <span aria-hidden="true">🏝️</span>
                <span>{selectedIsland.name}</span>
              </button>
            </>
          )}
          {selectedCamp && (
            <>
              <span aria-hidden="true" className="font-bold text-neutral-900">›</span>
              <span className="flex items-center gap-1.5 rounded-md bg-primary-100 px-2 py-1 font-bold text-primary-900" aria-current="page">
                <span aria-hidden="true">⛺</span>
                <span>{selectedCamp.name}</span>
              </span>
            </>
          )}
        </nav>
      )}

      {/* View hierarchy: Map → Island Detail → Camp Exercises */}
      {selectedCamp && selectedIsland ? (
        <CampExerciseView
          camp={selectedCamp}
          islandTopicId={selectedIsland.topicId}
          onBack={handleBack}
        />
      ) : selectedIsland ? (
        <IslandDetailPanel
          island={selectedIsland}
          onBack={handleBack}
          onCampSelect={handleCampSelect}
        />
      ) : (
        <>
          {/* First-visit onboarding (localStorage-gated, dismissible) */}
          <OnboardingBanner />
          <MapOverview
            islands={islands}
            totalExercises={stats.totalExercises}
            completedExercises={stats.completedExercises}
          />
          <ArchipelagoMap
            islands={islands}
            onIslandClick={handleIslandClick}
          />
        </>
      )}
    </div>
  );
}
