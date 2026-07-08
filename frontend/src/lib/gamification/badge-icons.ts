/**
 * Badge Icon Mapping — 27 Achievement Symbols
 *
 * Centralized mapping from badge ID → icon config + rarity visual styles.
 * Single source of truth for badge visuals (maintainable-code: constants, DRY).
 *
 * Icon choices follow semantic mapping:
 * - Milestone badges → learning/action icons (Mic, BookOpen, Dumbbell)
 * - Skill badges → sensory/performance icons (Ear, Mic, Star)
 * - Streak badges → time/consistency icons (Flame, CalendarCheck, Diamond)
 * - Performance badges → achievement icons (Trophy, Star)
 * - Exploration badges → discovery icons (Book, Compass)
 * - Effort badges → resilience icons (Dumbbell, Flame)
 * - Social badges → community icons (Star, Heart)
 *
 * Flaticon icons: /public/icons/badges/flaticon/{type}/{type}-{rarity}.svg
 *
 * @module gamification/badge-icons
 */

import { type BadgeRarity } from "./types";
export type { BadgeRarity } from "./types";

/** Valid Lucide icon names used by the badge system */
export type BadgeIconName =
  | "Mic"
  | "BookOpen"
  | "Dumbbell"
  | "Ear"
  | "Star"
  | "Flame"
  | "CalendarCheck"
  | "Diamond"
  | "TrendingUp"
  | "Trophy"
  | "Compass"
  | "Heart";

/**
 * Map each badge ID to its Lucide icon name.
 * Every entry in BADGE_DEFINITIONS must have a corresponding mapping here.
 */
export const BADGE_ICON_MAP: Record<string, BadgeIconName> = {
  // Milestone badges (CD2: Accomplishment)
  "badge-milestone-first-exercise": "Mic",
  "badge-milestone-ten-exercises": "BookOpen",
  "badge-milestone-fifty-exercises": "Dumbbell",
  "badge-milestone-hundred-exercises": "Trophy",
  "badge-milestone-perfect-five": "Star",
  // Skill badges (CD3: Empowerment)
  "badge-skill-ear-training": "Ear",
  "badge-skill-clear-speaker": "Mic",
  "badge-skill-excellent-pronunciation": "Star",
  "badge-skill-ipa-master": "Trophy",
  "badge-skill-difficult-phonemes": "TrendingUp",
  // Streak badges (CD6: Scarcity + CD8: Loss Aversion)
  "badge-streak-bronze": "Flame",
  "badge-streak-silver": "CalendarCheck",
  "badge-streak-gold": "Diamond",
  "badge-streak-diamond": "Trophy",
  // Performance badges (CD2: Accomplishment)
  "badge-performance-improvement": "TrendingUp",
  "badge-performance-perfect-scores": "Star",
  "badge-performance-weekly-champion": "Trophy",
  "badge-performance-top3-weekly": "Trophy",
  // Exploration badges (CD7: Unpredictability/Curiosity)
  "badge-explorer-versatile": "Compass",
  "badge-explorer-ipa": "BookOpen",
  "badge-explorer-master": "Compass",
  // Effort badges (CD4: Ownership)
  "badge-effort-persistent": "Dumbbell",
  "badge-effort-grit": "Flame",
  "badge-effort-phoenix": "TrendingUp",
  // Social badges (CD5: Social Influence)
  "badge-social-sharer": "Heart",
  "badge-social-inspirer": "Heart",
  // Hidden badge (CD7: Unpredictability)
  "badge-hidden-mystery": "Star",
} as const;

/**
 * Rarity visual styles — Tailwind classes for ring, background, icon color.
 * ui-color-harmony: same hue family per tier, semantic colors for rarity.
 *
 * COMMON    → Silver/Neutral  (easy to earn, understated)
 * RARE      → Purple          (moderate effort, noticeable)
 * EPIC      → Amber/Gold      (very hard, prestigious + glow)
 * LEGENDARY → Rose/Holographic (extremely rare, ultimate prestige)
 * PERIODIC  → Emerald/Green   (time-limited, fresh)
 */
export const RARITY_STYLES: Record<
  BadgeRarity,
  { ring: string; bg: string; icon: string; border: string; glow: string; label: string }
> = {
  COMMON: {
    ring: "ring-blue-300",
    bg: "bg-blue-50",
    icon: "text-blue-600",
    border: "border-blue-200",
    glow: "",
    label: "Thường",
  },
  RARE: {
    ring: "ring-blue-400",
    bg: "bg-blue-50",
    icon: "text-blue-600",
    border: "border-blue-300",
    glow: "",
    label: "Hiếm",
  },
  EPIC: {
    ring: "ring-purple-500",
    bg: "bg-purple-50",
    icon: "text-purple-700",
    border: "border-purple-300",
    glow: "drop-shadow-[0_0_8px_rgba(168,85,247,0.4)]",
    label: "Sử thi",
  },
  LEGENDARY: {
    ring: "ring-amber-500",
    bg: "bg-amber-50",
    icon: "text-amber-600",
    border: "border-amber-400",
    glow: "drop-shadow-[0_0_10px_rgba(245,158,11,0.5)]",
    label: "Huyền thoại",
  },
  PERIODIC: {
    ring: "ring-emerald-400",
    bg: "bg-emerald-50",
    icon: "text-emerald-600",
    border: "border-emerald-200",
    glow: "",
    label: "Theo kỳ",
  },
} as const;

/**
 * Flaticon SVG file name per badge ID — maps to /public/icons/badges/flaticon/{type}/{type}-{rarity}.svg
 * Each badge has a unique icon for better visual distinction.
 */
export const BADGE_FLATICON_MAP: Record<string, string> = {
  // Milestone badges → target/trophy icons (milestone progression)
  "badge-milestone-first-exercise": "target/target",
  "badge-milestone-ten-exercises": "medal/medal",
  "badge-milestone-fifty-exercises": "dumbbell/dumbbell",
  "badge-milestone-hundred-exercises": "trophy/trophy",
  "badge-milestone-perfect-five": "star/star",
  // Skill badges → ear/microphone/crown icons (skill-specific)
  "badge-skill-ear-training": "ear/ear",
  "badge-skill-clear-speaker": "microphone/microphone",
  "badge-skill-excellent-pronunciation": "crown/crown",
  "badge-skill-ipa-master": "trophy/trophy",
  "badge-skill-difficult-phonemes": "trending-up/trending-up",
  // Streak badges → flame/calendar/diamond icons (time-based)
  "badge-streak-bronze": "flame/flame",
  "badge-streak-silver": "calendar/calendar",
  "badge-streak-gold": "diamond/diamond",
  "badge-streak-diamond": "trophy/trophy",
  // Performance badges → trophy/star icons (achievement)
  "badge-performance-improvement": "trending-up/trending-up",
  "badge-performance-perfect-scores": "star/star",
  "badge-performance-weekly-champion": "trophy/trophy",
  "badge-performance-top3-weekly": "crown/crown",
  // Exploration badges → book/star icons (discovery)
  "badge-explorer-versatile": "book/book",
  "badge-explorer-ipa": "book/book",
  "badge-explorer-master": "star/star",
  // Effort badges → dumbbell/flame icons (persistence)
  "badge-effort-persistent": "dumbbell/dumbbell",
  "badge-effort-grit": "flame/flame",
  "badge-effort-phoenix": "flame/flame",
  // Social badges → star icons (community)
  "badge-social-sharer": "star/star",
  "badge-social-inspirer": "star/star",
  // Hidden badge → mystery icon (unpredictability)
  "badge-hidden-mystery": "star/star",
} as const;

/**
 * Get the Flaticon SVG file path for a badge icon at a given rarity.
 * Returns null if no SVG mapping exists for the badge ID.
 *
 * @example getBadgeFlaticonPath("badge-streak-3", "COMMON") → "/icons/badges/flaticon/flame/flame-common.svg"
 */
export function getBadgeFlaticonPath(badgeId: string, rarity: BadgeRarity): string | null {
  const svgType = BADGE_FLATICON_MAP[badgeId];
  if (!svgType) return null;
  return `/icons/badges/flaticon/${svgType}-${rarity.toLowerCase()}.svg`;
}

/**
 * SVG file name per badge ID — maps to /public/icons/badges/colored/{svgFile}-{rarity}.svg
 * Legacy icons (kept as fallback).
 */
export const BADGE_SVG_FILES: Record<string, string> = {
  // Milestone badges
  "badge-milestone-first-exercise": "mic",
  "badge-milestone-ten-exercises": "book",
  "badge-milestone-fifty-exercises": "dumbbell",
  "badge-milestone-hundred-exercises": "trophy",
  "badge-milestone-perfect-five": "star",
  // Skill badges
  "badge-skill-ear-training": "ear",
  "badge-skill-clear-speaker": "mic",
  "badge-skill-excellent-pronunciation": "star",
  "badge-skill-ipa-master": "trophy",
  "badge-skill-difficult-phonemes": "trending-up",
  // Streak badges
  "badge-streak-bronze": "flame",
  "badge-streak-silver": "calendar",
  "badge-streak-gold": "diamond",
  "badge-streak-diamond": "trophy",
  // Performance badges
  "badge-performance-improvement": "trending-up",
  "badge-performance-perfect-scores": "star",
  "badge-performance-weekly-champion": "trophy",
  "badge-performance-top3-weekly": "trophy",
  // Exploration badges
  "badge-explorer-versatile": "book",
  "badge-explorer-ipa": "book",
  "badge-explorer-master": "star",
  // Effort badges
  "badge-effort-persistent": "dumbbell",
  "badge-effort-grit": "flame",
  "badge-effort-phoenix": "trending-up",
  // Social badges
  "badge-social-sharer": "star",
  "badge-social-inspirer": "star",
  // Hidden badge
  "badge-hidden-mystery": "star",
} as const;

/**
 * Get the SVG file path for a badge icon at a given rarity.
 * Tries Flaticon icons first, falls back to legacy icons.
 *
 * @example getBadgeSvgPath("badge-streak-3", "COMMON") → "/icons/badges/flaticon/flame/flame-common.svg"
 */
export function getBadgeSvgPath(badgeId: string, rarity: BadgeRarity): string | null {
  // Try Flaticon icons first
  const flaticonPath = getBadgeFlaticonPath(badgeId, rarity);
  if (flaticonPath) return flaticonPath;
  
  // Fallback to legacy icons
  const svgFile = BADGE_SVG_FILES[badgeId];
  if (!svgFile) return null;
  return `/icons/badges/colored/${svgFile}-${rarity.toLowerCase()}.svg`;
}
