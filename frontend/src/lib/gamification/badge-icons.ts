/**
 * Badge Icon Mapping
 *
 * Centralized mapping from badge ID → icon config + rarity visual styles.
 * Single source of truth for badge visuals (maintainable-code: constants, DRY).
 *
 * Icon choices follow semantic mapping:
 * - Progress badges → learning/action icons (Mic, BookOpen, Dumbbell)
 * - Skill badges → sensory/performance icons (Ear, Mic, Star)
 * - Streak badges → time/consistency icons (Flame, CalendarCheck, Diamond)
 * - Improvement badges → growth icons (TrendingUp)
 * - Ranking badges → achievement icons (Trophy)
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
  | "Trophy";

/**
 * Map each badge ID to its Lucide icon name.
 * Every entry in BADGE_DEFINITIONS must have a corresponding mapping here.
 */
export const BADGE_ICON_MAP: Record<string, BadgeIconName> = {
  "badge-progress-first-exercise": "Mic",
  "badge-progress-three-exercises": "BookOpen",
  "badge-progress-ten-exercises": "Dumbbell",
  "badge-progress-twenty-five": "Dumbbell",
  "badge-progress-fifty": "Star",
  "badge-skill-good-listener": "Ear",
  "badge-skill-clear-speaker": "Mic",
  "badge-skill-excellent-pronunciation": "Star",
  "badge-streak-3": "Flame",
  "badge-streak-7": "CalendarCheck",
  "badge-streak-14": "Diamond",
  "badge-streak-30": "Diamond",
  "badge-streak-100": "Trophy",
  "badge-improvement-comeback": "TrendingUp",
  "badge-ranking-weekly-top-10": "Trophy",
  "badge-killer-top3": "Trophy",
  "badge-explorer-all-topics": "BookOpen",
  "badge-explorer-versatile": "Star",
  "badge-social-sharer": "Star",
  "badge-effort-persistent": "Dumbbell",
  "badge-effort-phoenix": "TrendingUp",
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
    ring: "ring-neutral-300",
    bg: "bg-neutral-50",
    icon: "text-neutral-600",
    border: "border-neutral-200",
    glow: "",
    label: "Thường",
  },
  RARE: {
    ring: "ring-purple-500",
    bg: "bg-purple-50",
    icon: "text-purple-600",
    border: "border-purple-300",
    glow: "",
    label: "Hiếm",
  },
  EPIC: {
    ring: "ring-amber-400",
    bg: "bg-amber-50",
    icon: "text-amber-600",
    border: "border-amber-300",
    glow: "drop-shadow-[0_0_10px_rgba(245,158,11,0.6)]",
    label: "Huyền thoại",
  },
  LEGENDARY: {
    ring: "ring-rose-500",
    bg: "bg-gradient-to-br from-rose-100 via-purple-100 to-blue-100",
    icon: "text-rose-600",
    border: "border-rose-400",
    glow: "drop-shadow-[0_0_12px_rgba(244,63,94,0.6)]",
    label: "Huyền thoại tối cao",
  },
  PERIODIC: {
    ring: "ring-emerald-500",
    bg: "bg-emerald-50",
    icon: "text-emerald-600",
    border: "border-emerald-300",
    glow: "",
    label: "Theo kỳ",
  },
} as const;

/**
 * SVG file name per badge ID — maps to /public/icons/badges/colored/{svgFile}-{rarity}.svg
 * Single source of truth for badge visuals (DRY: replaces BADGE_SVG_NAMES in BadgeIcon.tsx).
 */
export const BADGE_SVG_FILES: Record<string, string> = {
  "badge-progress-first-exercise": "mic",
  "badge-progress-three-exercises": "book",
  "badge-progress-ten-exercises": "dumbbell",
  "badge-progress-twenty-five": "dumbbell",
  "badge-progress-fifty": "star",
  "badge-skill-good-listener": "ear",
  "badge-skill-clear-speaker": "mic",
  "badge-skill-excellent-pronunciation": "star",
  "badge-streak-3": "flame",
  "badge-streak-7": "calendar",
  "badge-streak-14": "diamond",
  "badge-streak-30": "diamond",
  "badge-streak-100": "trophy",
  "badge-improvement-comeback": "trending-up",
  "badge-ranking-weekly-top-10": "trophy",
  "badge-killer-top3": "trophy",
  "badge-explorer-all-topics": "book",
  "badge-explorer-versatile": "star",
  "badge-social-sharer": "star",
  "badge-effort-persistent": "dumbbell",
  "badge-effort-phoenix": "trending-up",
} as const;

/**
 * Get the SVG file path for a badge icon at a given rarity.
 * Returns null if no SVG mapping exists for the badge ID.
 *
 * @example getBadgeSvgPath("badge-streak-3", "COMMON") → "/icons/badges/colored/flame-common.svg"
 */
export function getBadgeSvgPath(badgeId: string, rarity: BadgeRarity): string | null {
  const svgFile = BADGE_SVG_FILES[badgeId];
  if (!svgFile) return null;
  return `/icons/badges/colored/${svgFile}-${rarity.toLowerCase()}.svg`;
}
