"use client";

import { useEffect, useState, useCallback } from "react";
import { useRewardEvents } from "./RewardEventContext";
import type { RewardEvent } from "@/lib/gamification/types";
import { QUEST_BANNER_DISPLAY_MS } from "@/lib/gamification/constants";

type QuestBannerEntry = {
  id: string;
  desc: string;
  xpReward: number;
  gemsReward: number;
};

let bannerIdCounter = 0;

/**
 * QuestCompleteBanner — Slide-up banner when a daily quest is completed.
 *
 * Shows quest description + rewards. Supports stacking (multiple quests
 * completed at once). Auto-dismisses after QUEST_BANNER_DISPLAY_MS.
 *
 * Accessibility: role="alert", aria-live="assertive"
 */
export default function QuestCompleteBanner() {
  const { subscribe } = useRewardEvents();
  const [banners, setBanners] = useState<QuestBannerEntry[]>([]);

  const removeBanner = useCallback((id: string) => {
    setBanners((prev) => prev.filter((b) => b.id !== id));
  }, []);

  // Subscribe to quest_complete events
  useEffect(() => {
    return subscribe((event: RewardEvent) => {
      if (event.type !== "quest_complete") return;

      const newBanner: QuestBannerEntry = {
        id: `quest-banner-${++bannerIdCounter}`,
        desc: event.questDesc ?? event.label,
        xpReward: event.amount ?? 0,
        gemsReward: event.questGems ?? 0,
      };

      setBanners((prev) => [...prev, newBanner]);

      setTimeout(() => removeBanner(newBanner.id), QUEST_BANNER_DISPLAY_MS);
    });
  }, [subscribe, removeBanner]);

  if (banners.length === 0) return null;

  return (
    <div
      className="fixed bottom-6 left-1/2 z-[9980] flex -translate-x-1/2 flex-col gap-3"
      role="alert"
      aria-live="assertive"
    >
      {banners.map((banner) => (
        <div
          key={banner.id}
          className="flex items-center gap-4 rounded-2xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-4 text-white shadow-xl animate-[slide-up_0.4s_ease-out] motion-reduce:animate-none"
        >
          <span className="text-2xl" aria-hidden="true">
            ✅
          </span>
          <div className="flex flex-col">
            <span className="text-xs font-semibold uppercase tracking-wider opacity-90">
              Nhiệm vụ hoàn thành!
            </span>
            <span className="text-sm font-bold">{banner.desc}</span>
            <span className="text-xs font-medium opacity-90">
              +{banner.xpReward} EXP · +{banner.gemsReward} 💎
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
