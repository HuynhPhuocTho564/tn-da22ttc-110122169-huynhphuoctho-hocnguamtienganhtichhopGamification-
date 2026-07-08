/**
 * Game-style SVG shop icons inspired by game-icons.net aesthetic.
 * Bold strokes, RPG feel, centered in viewBox.
 *
 * @module gamification/ShopIcons
 */

import React from "react";

interface ShopIconProps {
  size?: number;
  className?: string;
}

/** Kính Lúp IPA — Magnifying glass */
export function IconMagnifier({ size = 28, className }: ShopIconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      <circle cx="28" cy="26" r="16" stroke="currentColor" strokeWidth="4" fill="currentColor" fillOpacity="0.1" />
      <line x1="40" y1="38" x2="54" y2="52" stroke="currentColor" strokeWidth="5" strokeLinecap="round" />
      <text x="21" y="31" fontSize="13" fontWeight="bold" fill="currentColor" fontFamily="monospace">Aa</text>
    </svg>
  );
}

/** Loa Ma Thuật — Speaker with sound waves */
export function IconSpeaker({ size = 28, className }: ShopIconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      <path d="M12 24 L20 24 L32 14 L32 50 L20 40 L12 40 Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" fill="currentColor" fillOpacity="0.1" />
      <path d="M40 22 C44 26 44 38 40 42" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <path d="M46 16 C54 24 54 40 46 48" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

/** Sách Thần — Spellbook with star */
export function IconSpellbook({ size = 28, className }: ShopIconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      <path d="M14 8 L50 8 L50 56 L14 56 Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" fill="currentColor" fillOpacity="0.1" />
      <path d="M14 8 C10 8 8 12 8 14 L8 50 C8 54 10 56 14 56" stroke="currentColor" strokeWidth="4" />
      <line x1="20" y1="8" x2="20" y2="56" stroke="currentColor" strokeWidth="2" />
      <polygon points="35,20 37,26 43,26 38,30 40,36 35,32 30,36 32,30 27,26 33,26" fill="currentColor" fillOpacity="0.4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

/** Gợi Ý Vàng — Lightbulb */
export function IconLightbulb({ size = 28, className }: ShopIconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      <path d="M32 6 C20 6 12 16 12 26 C12 34 18 38 22 42 L22 48 L42 48 L42 42 C46 38 52 34 52 26 C52 16 44 6 32 6Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15" />
      <line x1="24" y1="52" x2="40" y2="52" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="26" y1="56" x2="38" y2="56" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="32" y1="20" x2="32" y2="32" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="26" y1="26" x2="38" y2="26" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Bùa Đóng Băng — Ice crystal snowflake */
export function IconFreeze({ size = 28, className }: ShopIconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      <line x1="32" y1="6" x2="32" y2="58" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line x1="10" y1="19" x2="54" y2="45" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line x1="10" y1="45" x2="54" y2="19" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <line x1="32" y1="14" x2="24" y2="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="32" y1="14" x2="40" y2="10" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="32" y1="50" x2="24" y2="54" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <line x1="32" y1="50" x2="40" y2="54" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="32" cy="32" r="4" fill="currentColor" fillOpacity="0.3" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}

/** Cơ Hội Thứ Hai — Circular retry arrows */
export function IconRetry({ size = 28, className }: ShopIconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      <path d="M16 20 A20 20 0 0 1 48 20" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <path d="M48 44 A20 20 0 0 1 16 44" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
      <polygon points="48,12 52,22 42,22" fill="currentColor" />
      <polygon points="16,52 12,42 22,42" fill="currentColor" />
    </svg>
  );
}

/** Khung Avatar Vàng — Ornate frame */
export function IconFrameGold({ size = 28, className }: ShopIconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      <rect x="10" y="10" width="44" height="44" rx="4" stroke="currentColor" strokeWidth="4" fill="currentColor" fillOpacity="0.05" />
      <rect x="16" y="16" width="32" height="32" rx="2" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" />
      <circle cx="10" cy="10" r="3" fill="currentColor" fillOpacity="0.4" />
      <circle cx="54" cy="10" r="3" fill="currentColor" fillOpacity="0.4" />
      <circle cx="10" cy="54" r="3" fill="currentColor" fillOpacity="0.4" />
      <circle cx="54" cy="54" r="3" fill="currentColor" fillOpacity="0.4" />
    </svg>
  );
}

/** Khung Avatar Lửa — Frame with fire corners */
export function IconFrameFire({ size = 28, className }: ShopIconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      <rect x="12" y="12" width="40" height="40" rx="4" stroke="currentColor" strokeWidth="4" fill="currentColor" fillOpacity="0.05" />
      <path d="M8 16 C8 8 16 4 16 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="currentColor" fillOpacity="0.2" />
      <path d="M56 16 C56 8 48 4 48 12" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="currentColor" fillOpacity="0.2" />
      <path d="M8 48 C8 56 16 60 16 52" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="currentColor" fillOpacity="0.2" />
      <path d="M56 48 C56 56 48 60 48 52" stroke="currentColor" strokeWidth="3" strokeLinecap="round" fill="currentColor" fillOpacity="0.2" />
    </svg>
  );
}

/** Viền Avatar Bạc — Silver frame with subtle shine */
export function IconFrameSilver({ size = 28, className }: ShopIconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      <rect x="10" y="10" width="44" height="44" rx="6" stroke="currentColor" strokeWidth="4" fill="currentColor" fillOpacity="0.1" />
      <rect x="14" y="14" width="36" height="36" rx="4" stroke="currentColor" strokeWidth="2" strokeDasharray="4 2" fill="none" />
      <line x1="10" y1="10" x2="20" y2="10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      <line x1="10" y1="10" x2="10" y2="20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/** Viền Avatar Kim Cương — Diamond frame with sparkle */
export function IconFrameDiamond({ size = 28, className }: ShopIconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      <rect x="8" y="8" width="48" height="48" rx="4" stroke="currentColor" strokeWidth="4" fill="currentColor" fillOpacity="0.1" />
      <rect x="12" y="12" width="40" height="40" rx="3" stroke="currentColor" strokeWidth="2" fill="none" />
      <circle cx="16" cy="16" r="2" fill="currentColor" fillOpacity="0.6" />
      <circle cx="48" cy="16" r="2" fill="currentColor" fillOpacity="0.6" />
      <circle cx="16" cy="48" r="2" fill="currentColor" fillOpacity="0.6" />
      <circle cx="48" cy="48" r="2" fill="currentColor" fillOpacity="0.6" />
      <path d="M32 8 L34 12 L30 12 Z" fill="currentColor" fillOpacity="0.4" />
    </svg>
  );
}

/** Danh Hiệu Học Giả — Graduation cap */
export function IconScholar({ size = 28, className }: ShopIconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      <polygon points="32,10 58,24 32,38 6,24" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15" />
      <path d="M16 28 L16 44 C16 48 24 52 32 52 C40 52 48 48 48 44 L48 28" stroke="currentColor" strokeWidth="3" strokeLinejoin="round" />
      <line x1="54" y1="24" x2="54" y2="44" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <circle cx="54" cy="46" r="2" fill="currentColor" />
    </svg>
  );
}

/** Danh Hiệu Quán Quân — Crown */
export function IconCrown({ size = 28, className }: ShopIconProps): React.ReactElement {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" fill="none" className={className}>
      <path d="M8 44 L14 18 L26 30 L32 10 L38 30 L50 18 L56 44 Z" stroke="currentColor" strokeWidth="4" strokeLinejoin="round" fill="currentColor" fillOpacity="0.15" />
      <rect x="8" y="44" width="48" height="10" rx="2" stroke="currentColor" strokeWidth="3" fill="currentColor" fillOpacity="0.1" />
      <circle cx="20" cy="38" r="3" fill="currentColor" fillOpacity="0.4" />
      <circle cx="32" cy="34" r="3" fill="currentColor" fillOpacity="0.4" />
      <circle cx="44" cy="38" r="3" fill="currentColor" fillOpacity="0.4" />
    </svg>
  );
}

/** Map shop item IDs to icon components */
export const SHOP_ICON_MAP: Record<string, React.FC<ShopIconProps>> = {
  ipa_reveal: IconMagnifier,
  slow_audio: IconSpeaker,
  xp_boost: IconSpellbook,
  hint_token: IconLightbulb,
  streak_freeze: IconFreeze,
  second_chance: IconRetry,
  frame_silver: IconFrameSilver,
  frame_gold: IconFrameGold,
  frame_diamond: IconFrameDiamond,
  frame_fire: IconFrameFire,
} as const;

/** Category-based icon colors (ui-color-harmony: semantic by function) */
export const SHOP_CATEGORY_COLORS: Record<string, { bg: string; icon: string; border: string }> = {
  power_up: { bg: "bg-blue-50", icon: "text-blue-600", border: "border-blue-200" },
  protection: { bg: "bg-emerald-50", icon: "text-emerald-600", border: "border-emerald-200" },
  cosmetic: { bg: "bg-purple-50", icon: "text-purple-600", border: "border-purple-200" },
} as const;
