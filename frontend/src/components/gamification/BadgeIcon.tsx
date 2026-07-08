/**
 * BadgeIcon — Renders a game-icons.net SVG with rarity-based visual styling.
 *
 * Uses pre-colored SVG files from game-icons.net (CC BY 3.0) stored in
 * /public/icons/badges/colored/{name}-{rarity}.svg
 *
 * Rarity tiers follow RPG game color standards:
 *   COMMON  → Silver (neutral-500 #6b7280)
 *   RARE    → Purple (violet-600 #7c3aed)
 *   EPIC    → Gold (amber-600 #d97706) + glow
 *   PERIODIC → Emerald (emerald-600 #059669)
 *
 * @module gamification/BadgeIcon
 */

import React from "react";
import { type BadgeRarity, RARITY_STYLES, getBadgeSvgPath } from "@/lib/gamification/badge-icons";

type BadgeSize = "sm" | "md" | "lg" | "xl";

const SIZE_CONFIG: Record<BadgeSize, { wrapper: string; icon: number }> = {
  sm: { wrapper: "h-10 w-10", icon: 22 },
  md: { wrapper: "h-14 w-14", icon: 32 },
  lg: { wrapper: "h-16 w-16", icon: 44 },
  xl: { wrapper: "h-20 w-20", icon: 56 },
} as const;

interface BadgeIconProps {
  badgeId: string;
  rarity: BadgeRarity;
  size?: BadgeSize;
  earned?: boolean;
}

export function BadgeIcon({
  badgeId,
  rarity,
  size = "md",
  earned = true,
}: BadgeIconProps): React.ReactElement {
  const svgPath = getBadgeSvgPath(badgeId, rarity);
  const style = RARITY_STYLES[rarity] ?? RARITY_STYLES.COMMON;
  const sizeConfig = SIZE_CONFIG[size] ?? SIZE_CONFIG.md;

  if (!svgPath && process.env.NODE_ENV === "development") {
    console.warn(`[BadgeIcon] No SVG mapping for badge ID: "${badgeId}". Add entry to BADGE_SVG_FILES in badge-icons.ts.`);
  }

  // Nielsen H1: Clear visual distinction between locked/unlocked
  // Unlocked: full saturation, glow effect
  // Locked: grayscale + reduced opacity (dopamine hit on unlock)
  const unearnedFilter = earned ? "" : "grayscale opacity-40";
  const glowClass = earned ? style.glow : "";
  const scaleClass = earned ? "scale-100" : "scale-95";

  return (
    <div
      className={`
        flex items-center justify-center
        rounded-2xl ring-2 ${style.ring} ${style.bg} border-2 ${style.border}
        ${sizeConfig.wrapper}
        ${glowClass}
        ${unearnedFilter}
        ${scaleClass}
        transition-all duration-300
        shrink-0
      `}
      role="img"
      aria-label={earned ? `Huy hiệu đã mở khóa: ${badgeId}` : `Huy hiệu chưa mở khóa: ${badgeId}`}
    >
      {svgPath ? (
        <img
          src={svgPath}
          alt=""
          width={sizeConfig.icon}
          height={sizeConfig.icon}
        />
      ) : (
        <svg
          width={sizeConfig.icon}
          height={sizeConfig.icon}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          className="text-neutral-300"
          aria-hidden="true"
        >
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
        </svg>
      )}
    </div>
  );
}
