/**
 * Badge Progress Utilities — near-miss detection and next-badge suggestion.
 *
 * Used by:
 * - Near-miss toast after exercise submit (UX-1: Goal-Gradient)
 * - Dashboard widget showing badges close to completion
 * - Next badge suggestion card on /badges page (UX-4)
 *
 * @module gamification/badge-progress
 * @see nielsen-ux-heuristics: Goal-Gradient Effect, H1 Visibility
 */

import { BADGE_DEFINITIONS, getBadgeProgressFromStats } from "../gamification";
import type { BadgeStatKey } from "./types";

/** Progress percentage threshold for near-miss notification (80%) */
export const NEAR_MISS_THRESHOLD = 0.8;

export type NearMissBadge = {
  id: string;
  name: string;
  rarity: string;
  current: number;
  target: number;
  percent: number;
  remaining: number;
};

/**
 * Find badges where user is at ≥80% progress but hasn't earned yet.
 * Used to trigger near-miss notifications (Goal-Gradient effect).
 *
 * @param stats — current user badge stats (from getUserBadgeStats)
 * @param earnedBadgeIds — set of badge IDs user already owns
 * @returns array of badges close to completion, sorted by percent desc
 */
export function getNearMissBadges(
  stats: Record<BadgeStatKey, number>,
  earnedBadgeIds: Set<string>,
): NearMissBadge[] {
  const results: NearMissBadge[] = [];

  for (const definition of BADGE_DEFINITIONS) {
    if (earnedBadgeIds.has(definition.id)) continue;
    if (definition.category === "ranking") continue;

    const progress = getBadgeProgressFromStats(definition, stats);
    if (!progress || progress.target === 0) continue;

    const percent = progress.current / progress.target;
    if (percent >= NEAR_MISS_THRESHOLD && percent < 1) {
      results.push({
        id: definition.id,
        name: definition.name,
        rarity: definition.type,
        current: progress.current,
        target: progress.target,
        percent: Math.round(percent * 100),
        remaining: progress.target - progress.current,
      });
    }
  }

  return results.sort((a, b) => b.percent - a.percent);
}

/**
 * Find the single badge closest to completion (for "next badge" suggestion).
 * Excludes ranking badges (inverted logic) and already-earned badges.
 */
export function getNextBadgeSuggestion(
  stats: Record<BadgeStatKey, number>,
  earnedBadgeIds: Set<string>,
): NearMissBadge | null {
  const candidates: NearMissBadge[] = [];

  for (const definition of BADGE_DEFINITIONS) {
    if (earnedBadgeIds.has(definition.id)) continue;
    if (definition.category === "ranking") continue;

    const progress = getBadgeProgressFromStats(definition, stats);
    if (!progress || progress.target === 0) continue;

    const percent = progress.current / progress.target;
    if (percent > 0 && percent < 1) {
      candidates.push({
        id: definition.id,
        name: definition.name,
        rarity: definition.type,
        current: progress.current,
        target: progress.target,
        percent: Math.round(percent * 100),
        remaining: progress.target - progress.current,
      });
    }
  }

  return candidates.sort((a, b) => b.percent - a.percent)[0] ?? null;
}
