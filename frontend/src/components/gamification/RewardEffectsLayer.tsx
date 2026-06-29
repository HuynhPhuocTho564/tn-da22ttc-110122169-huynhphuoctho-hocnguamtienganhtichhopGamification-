"use client";

import { RewardEventProvider } from "./effects/RewardEventContext";
import RewardToast from "./effects/RewardToast";
import LevelUpOverlay from "./effects/LevelUpOverlay";
import QuestCompleteBanner from "./effects/QuestCompleteBanner";
import type { ReactNode } from "react";

/**
 * RewardEffectsLayer — Client-side wrapper that provides the reward event
 * system and renders all celebration effect components.
 *
 * Placed inside layout.tsx to ensure effects are available on every page.
 * The Provider enables pub/sub; the effect components subscribe and render UI.
 */
export default function RewardEffectsLayer({ children }: { children: ReactNode }) {
  return (
    <RewardEventProvider>
      {children}
      <RewardToast />
      <LevelUpOverlay />
      <QuestCompleteBanner />
    </RewardEventProvider>
  );
}
