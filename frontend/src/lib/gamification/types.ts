/**
 * Gamification type definitions — Single source of truth for badge domain types
 * and reward event system types.
 *
 * All badge rarity, category, stat types AND reward event types are defined here.
 * Other modules import from this file instead of duplicating definitions.
 *
 * @module gamification/types
 * @see maintainable-code: Type Safety (E), Constants (F)
 */

// === Badge Domain Types ===

/** All badge rarity tiers — drives visual styling (ring, bg, glow). */
export const BADGE_RARITIES = [
  "COMMON",
  "RARE",
  "EPIC",
  "LEGENDARY",
  "PERIODIC",
] as const;

export type BadgeRarity = (typeof BADGE_RARITIES)[number];

/** All badge categories — determines which user actions can earn the badge. */
export const BADGE_CATEGORIES = [
  "progress",
  "skill",
  "streak",
  "improvement",
  "ranking",
  "exploration",
  "social",
  "effort",
] as const;

export type BadgeCategory = (typeof BADGE_CATEGORIES)[number];

/**
 * Stat keys used by badge progress calculation.
 * Each badge definition references one statKey to determine its progress.
 *
 * @see getBadgeProgressFromStats() in gamification.ts
 */
export const BADGE_STAT_KEYS = [
  "completedExercises",
  "listeningHighScoreExercises",
  "speakingHighScoreExercises",
  "excellentSpeakingExercises",
  "streakCount",
  "bestImprovement",
  "weeklyRank",
  "uniqueTopicCount",
  "uniqueQuestionTypeCount",
  "shareCount",
  "maxRetakeCount",
  "bestComebackScore",
  "perfectScoreExercises",
] as const;

export type BadgeStatKey = (typeof BADGE_STAT_KEYS)[number];

// === Reward Event System Types ===

/**
 * Reward event emitted by the exercise engine and consumed by UI effects
 * (toasts, overlays, banners). Uses a flexible shape to support all event types.
 */
export type RewardEvent = {
  type:
    | "xp"
    | "diamonds"
    | "badge_earned"
    | "quest_complete"
    | "streak_milestone"
    | "level_up";
  label: string;
  /** New level number (for level_up events) */
  level?: number;
  /** EXP or diamond amount (for xp, gems, streak_milestone events) */
  amount?: number;
  /** Badge name (for badge_earned events) */
  badgeName?: string;
  /** Quest description (for quest_complete events) */
  questDesc?: string;
  /** Quest diamond reward (for quest_complete events) */
  questGems?: number;
  /** Icon emoji (for spin wheel events) */
  icon?: string;
};

/** Context value for the reward event pub/sub system. */
export type RewardEventContextValue = {
  emit: (event: RewardEvent) => void;
  subscribe: (handler: (event: RewardEvent) => void) => () => void;
};

/** Toast entry displayed by RewardToast component. */
export type ToastEntry = {
  id: string;
  type: string;
  label: string;
  icon: string;
  bgColor: string;
};
