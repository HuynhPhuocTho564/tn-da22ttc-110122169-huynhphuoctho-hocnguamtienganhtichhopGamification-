/**
 * AvatarWithFrame — Renders a user avatar with optional cosmetic frame and title.
 *
 * Applies ring + shadow styles based on equipped frame (ui-color-harmony:
 * same hue family for ring + shadow, warm palette for cosmetic items).
 *
 * @module ui/AvatarWithFrame
 */

import React from "react";
import { getAvatarUrl } from "@/lib/avatar";

export type CosmeticFrame = "frame_gold" | "frame_fire" | null;

interface AvatarWithFrameProps {
  username: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  frame?: CosmeticFrame;
  title?: string | null;
}

/** Ring + shadow styles per frame type (ui-color-harmony: same hue family) */
const FRAME_STYLES: Record<string, string> = {
  frame_gold: "ring-4 ring-amber-400 shadow-lg shadow-amber-200/50",
  frame_fire: "ring-4 ring-orange-500 shadow-lg shadow-orange-300/50",
} as const;

const SIZE_STYLES: Record<string, string> = {
  sm: "h-10 w-10",
  md: "h-16 w-16",
  lg: "h-24 w-24",
} as const;

export function AvatarWithFrame({
  username,
  avatarUrl,
  size = "md",
  frame,
  title,
}: AvatarWithFrameProps): React.ReactElement {
  const frameClass = frame ? FRAME_STYLES[frame] ?? "" : "";
  const sizeClass = SIZE_STYLES[size] ?? SIZE_STYLES.md;
  const src = getAvatarUrl(username, avatarUrl);

  return (
    <div className="relative inline-flex flex-col items-center gap-1">
      <img
        src={src}
        alt={`Avatar ${username}`}
        className={`${sizeClass} rounded-full object-cover ${frameClass}`}
      />
      {title && (
        <span className="text-xs font-semibold text-primary-600">
          {title}
        </span>
      )}
    </div>
  );
}
