/**
 * Game-style SVG badge icons inspired by game-icons.net aesthetic.
 * Bold strokes, RPG/game feel, centered in viewBox.
 *
 * Each icon is a React component returning an inline SVG.
 * Colors are controlled via `currentColor` so parent can set stroke/fill.
 *
 * @module gamification/GameBadgeIcons
 */

import React from "react";

interface GameIconProps {
  /** Size in pixels (width and height) */
  size?: number;
  /** Icon color — passed as currentColor */
  className?: string;
}

/** Microphone — Phát âm */
export function IconMic({ size = 28, className }: GameIconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      <rect x="22" y="8" width="20" height="32" rx="10" stroke="currentColor" strokeWidth="4" />
      <path d="M16 30 C16 42 26 50 32 50 C38 50 48 42 48 30" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line x1="32" y1="50" x2="32" y2="58" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line x1="24" y1="58" x2="40" y2="58" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

/** Open Book — Học tập */
export function IconBook({ size = 28, className }: GameIconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      <path d="M8 12 L32 18 L56 12 L56 52 L32 46 L8 52 Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" />
      <line x1="32" y1="18" x2="32" y2="46" stroke="currentColor" strokeWidth="3" />
      <path d="M16 22 L28 25" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M16 28 L28 31" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M36 25 L48 22" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <path d="M36 31 L48 28" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Dumbbell — Kiên trì luyện tập */
export function IconDumbbell({ size = 28, className }: GameIconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      <rect x="6" y="20" width="10" height="24" rx="2" stroke="currentColor" strokeWidth="4" />
      <rect x="48" y="20" width="10" height="24" rx="2" stroke="currentColor" strokeWidth="4" />
      <rect x="16" y="24" width="6" height="16" rx="1" stroke="currentColor" strokeWidth="3" />
      <rect x="42" y="24" width="6" height="16" rx="1" stroke="currentColor" strokeWidth="3" />
      <line x1="22" y1="32" x2="42" y2="32" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
    </svg>
  );
}

/** Ear — Kỹ năng nghe */
export function IconEar({ size = 28, className }: GameIconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      <path d="M38 10 C50 10 56 22 54 34 C52 44 44 46 42 52 C40 56 36 58 32 58" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M28 14 C20 18 16 28 18 38 C20 44 24 48 28 48" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M32 24 C36 24 40 28 38 34 C36 38 32 38 30 36" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Star — Xuất sắc */
export function IconStar({ size = 28, className }: GameIconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      <polygon
        points="32,6 39,24 58,24 43,36 48,54 32,44 16,54 21,36 6,24 25,24"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.15"
      />
    </svg>
  );
}

/** Flame — Streak fire */
export function IconFlame({ size = 28, className }: GameIconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      <path
        d="M32 4 C32 4 42 18 42 32 C42 40 38 46 32 48 C26 46 22 40 22 32 C22 18 32 4 32 4Z"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.15"
      />
      <path
        d="M32 24 C32 24 36 30 36 36 C36 40 34 42 32 42 C30 42 28 40 28 36 C28 30 32 24 32 24Z"
        stroke="currentColor"
        strokeWidth="2"
        fill="currentColor"
        fillOpacity="0.3"
      />
      <path d="M24 52 C28 56 36 56 40 52" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Calendar with check — Tuần bền bỉ */
export function IconCalendar({ size = 28, className }: GameIconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      <rect x="8" y="14" width="48" height="42" rx="4" stroke="currentColor" strokeWidth="4" />
      <line x1="8" y1="26" x2="56" y2="26" stroke="currentColor" strokeWidth="3" />
      <line x1="22" y1="8" x2="22" y2="18" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line x1="42" y1="8" x2="42" y2="18" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <polyline points="22,38 28,44 42,32" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Diamond — Kim cương, ổn định */
export function IconDiamond({ size = 28, className }: GameIconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      <polygon
        points="32,6 52,24 32,58 12,24"
        stroke="currentColor"
        strokeWidth="4"
        strokeLinejoin="round"
        fill="currentColor"
        fillOpacity="0.1"
      />
      <line x1="12" y1="24" x2="52" y2="24" stroke="currentColor" strokeWidth="3" />
      <line x1="32" y1="6" x2="24" y2="24" stroke="currentColor" strokeWidth="2" />
      <line x1="32" y1="6" x2="40" y2="24" stroke="currentColor" strokeWidth="2" />
      <line x1="24" y1="24" x2="32" y2="58" stroke="currentColor" strokeWidth="2" />
      <line x1="40" y1="24" x2="32" y2="58" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

/** Trending Up Arrow — Tiến bộ */
export function IconTrendUp({ size = 28, className }: GameIconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      <polyline points="8,48 24,32 36,40 56,16" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points="42,16 56,16 56,30" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Trophy Cup — Xếp hạng */
export function IconTrophy({ size = 28, className }: GameIconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      <path d="M18 8 L46 8 L44 30 C44 38 38 42 32 42 C26 42 20 38 20 30 Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" fill="currentColor" fillOpacity="0.1" />
      <path d="M18 14 C10 14 8 22 14 26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M46 14 C54 14 56 22 50 26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="32" y1="42" x2="32" y2="50" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <rect x="22" y="50" width="20" height="6" rx="2" stroke="currentColor" strokeWidth="3" />
    </svg>
  );
}
