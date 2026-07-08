/**
 * AvatarWithFrame — Renders a user avatar with optional cosmetic frame and title.
 *
 * Uses SVG overlay frames for visual quality (ui-color-harmony:
 * same hue family for ring + shadow, warm palette for cosmetic items).
 *
 * @module ui/AvatarWithFrame
 */

import React from "react";
import { getAvatarUrl } from "@/lib/avatar";

export type CosmeticFrame = "frame_silver" | "frame_gold" | "frame_diamond" | "frame_fire" | null;

interface AvatarWithFrameProps {
  username: string;
  avatarUrl?: string | null;
  size?: "sm" | "md" | "lg";
  frame?: CosmeticFrame;
  title?: string | null;
}

/** SVG frame overlays — professional look with gradients and decorations */
function SilverFrame({ size }: { size: number }): React.ReactElement {
  const stroke = size * 0.06;
  return (
    <svg className="absolute inset-0 -z-10" viewBox="0 0 100 100" width={size} height={size}>
      <defs>
        <linearGradient id="silver-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e2e8f0" />
          <stop offset="50%" stopColor="#cbd5e1" />
          <stop offset="100%" stopColor="#94a3b8" />
        </linearGradient>
      </defs>
      <circle cx="50" cy="50" r="48" fill="none" stroke="url(#silver-grad)" strokeWidth={stroke} />
      <circle cx="50" cy="50" r="44" fill="none" stroke="#cbd5e1" strokeWidth={stroke * 0.3} strokeDasharray="4 2" />
    </svg>
  );
}

function GoldFrame({ size }: { size: number }): React.ReactElement {
  const stroke = size * 0.07;
  return (
    <svg className="absolute inset-0 -z-10" viewBox="0 0 100 100" width={size} height={size}>
      <defs>
        <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#d97706" />
        </linearGradient>
        <filter id="gold-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx="50" cy="50" r="48" fill="none" stroke="url(#gold-grad)" strokeWidth={stroke} filter="url(#gold-glow)" />
      <circle cx="50" cy="50" r="44" fill="none" stroke="#fbbf24" strokeWidth={stroke * 0.25} />
      {/* Decorative dots */}
      <circle cx="50" cy="2" r="2" fill="#fbbf24" />
      <circle cx="98" cy="50" r="2" fill="#fbbf24" />
      <circle cx="50" cy="98" r="2" fill="#fbbf24" />
      <circle cx="2" cy="50" r="2" fill="#fbbf24" />
    </svg>
  );
}

function DiamondFrame({ size }: { size: number }): React.ReactElement {
  const stroke = size * 0.07;
  return (
    <svg className="absolute inset-0 -z-10" viewBox="0 0 100 100" width={size} height={size}>
      <defs>
        <linearGradient id="diamond-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#67e8f9" />
          <stop offset="50%" stopColor="#22d3ee" />
          <stop offset="100%" stopColor="#06b6d4" />
        </linearGradient>
        <filter id="diamond-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx="50" cy="50" r="48" fill="none" stroke="url(#diamond-grad)" strokeWidth={stroke} filter="url(#diamond-glow)" />
      <circle cx="50" cy="50" r="44" fill="none" stroke="#22d3ee" strokeWidth={stroke * 0.3} />
      {/* Sparkle dots */}
      <circle cx="50" cy="1" r="2.5" fill="#67e8f9" />
      <circle cx="99" cy="50" r="2.5" fill="#67e8f9" />
      <circle cx="50" cy="99" r="2.5" fill="#67e8f9" />
      <circle cx="1" cy="50" r="2.5" fill="#67e8f9" />
      <circle cx="85" cy="15" r="1.5" fill="#a5f3fc" />
      <circle cx="15" cy="85" r="1.5" fill="#a5f3fc" />
    </svg>
  );
}

function FireFrame({ size }: { size: number }): React.ReactElement {
  const stroke = size * 0.07;
  return (
    <svg className="absolute inset-0 -z-10" viewBox="0 0 100 100" width={size} height={size}>
      <defs>
        <linearGradient id="fire-grad" x1="0%" y1="100%" x2="0%" y2="0%">
          <stop offset="0%" stopColor="#f97316" />
          <stop offset="50%" stopColor="#ef4444" />
          <stop offset="100%" stopColor="#dc2626" />
        </linearGradient>
        <filter id="fire-glow">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <circle cx="50" cy="50" r="48" fill="none" stroke="url(#fire-grad)" strokeWidth={stroke} filter="url(#fire-glow)" />
      {/* Flame tips */}
      <path d="M50 0 Q55 8 50 6 Q45 8 50 0" fill="#ef4444" />
      <path d="M85 15 Q78 20 80 14 Q76 18 85 15" fill="#f97316" />
      <path d="M15 85 Q22 80 20 86 Q24 82 15 85" fill="#f97316" />
    </svg>
  );
}

const FRAME_COMPONENTS: Record<string, React.FC<{ size: number }>> = {
  frame_silver: SilverFrame,
  frame_gold: GoldFrame,
  frame_diamond: DiamondFrame,
  frame_fire: FireFrame,
};

const SIZE_MAP = { sm: 40, md: 64, lg: 96 };

export function AvatarWithFrame({
  username,
  avatarUrl,
  size = "md",
  frame,
  title,
}: AvatarWithFrameProps): React.ReactElement {
  const FrameComponent = frame ? FRAME_COMPONENTS[frame] : null;
  const pxSize = SIZE_MAP[size];
  const src = getAvatarUrl(username, avatarUrl);

  return (
    <div className="relative inline-flex flex-col items-center gap-1">
      <div className="relative" style={{ width: pxSize, height: pxSize }}>
        {FrameComponent && <FrameComponent size={pxSize} />}
        <img
          src={src}
          alt={`Avatar ${username}`}
          className="h-full w-full rounded-full object-cover"
        />
      </div>
      {title && (
        <span className="text-xs font-semibold text-primary-600">
          {title}
        </span>
      )}
    </div>
  );
}
