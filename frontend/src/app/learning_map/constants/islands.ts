/**
 * Island Map Constants — tất cả magic numbers/strings tập trung tại đây.
 * maintainable-code: Không hardcode trong component.
 * ui-color-harmony: Dùng Tailwind tokens, không hex trực tiếp.
 */

// ─── Thresholds ────────────────────────────────────────────────
/**
 * Tỷ lệ hoàn thành đảo trước để mở khóa đảo tiếp theo.
 * Hiện tại dùng 100% (count-based — phải hoàn thành TẤT CẢ trại).
 * Giữ constant để backward compat với data cũ trong DB,
 * nhưng logic unlock thực tế dùng count (xem learning_map/page.tsx).
 */
export const ISLAND_UNLOCK_THRESHOLD_PERCENT = 100;

/** Điểm tối thiểu để exercise được tính là hoàn thành (60/100) */
export const EXERCISE_COMPLETE_SCORE = 60;

// ─── Fog of War Opacity ───────────────────────────────────────
export const FOG_OPACITY_LOCKED = 0.85;
export const FOG_OPACITY_AVAILABLE = 0.25;
export const FOG_OPACITY_CLEARED = 0;

// ─── Touch Targets (Fitts's Law — nielsen WCAG 2.5.5) ─────────
/** Minimum touch target cho camp node: 48px (mobile) */
export const CAMP_NODE_MIN_SIZE_PX = 48;

/** Minimum touch target cho interactive island element */
export const ISLAND_INTERACTIVE_MIN_PX = 44;

// ─── Camp Positions (% coordinates trên mỗi đảo) ──────────────
/**
 * Vị trí tương đối của mỗi camp trên đảo.
 * Tọa độ % (0-100) để responsive trên mọi kích thước.
 * Mỗi đảo có layout positions riêng — index match với map index.
 */
export const CAMP_LAYOUTS: readonly (readonly { x: number; y: number }[])[] = [
  // Đảo 1: Vowels — camps rải đều theo đường cong
  [
    { x: 25, y: 70 }, { x: 40, y: 55 }, { x: 55, y: 45 },
    { x: 70, y: 50 }, { x: 60, y: 70 }, { x: 45, y: 78 },
    { x: 30, y: 60 }, { x: 50, y: 62 },
  ],
  // Đảo 2: Consonants — camps theo đường dài
  [
    { x: 15, y: 60 }, { x: 30, y: 50 }, { x: 45, y: 45 },
    { x: 60, y: 50 }, { x: 75, y: 55 }, { x: 85, y: 65 },
    { x: 50, y: 65 }, { x: 35, y: 70 },
  ],
  // Đảo 3: Minimal Pairs — camps chia 2 cụm
  [
    { x: 25, y: 55 }, { x: 35, y: 65 }, { x: 30, y: 75 },
    { x: 65, y: 55 }, { x: 75, y: 65 }, { x: 70, y: 75 },
  ],
  // Đảo 4: Stress — camps leo lên núi
  [
    { x: 30, y: 80 }, { x: 40, y: 65 }, { x: 50, y: 50 },
    { x: 60, y: 65 }, { x: 70, y: 80 },
  ],
];

// ─── Island Biome Configuration ───────────────────────────────
/**
 * Mỗi biome có palette riêng (ui-color-harmony: cùng hue family).
 * Light = background tint, base = border/icon, dark = text/shade.
 */
export interface IslandBiome {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly icon: string;
  readonly svgPath: string;
  readonly colors: {
    readonly base: string;
    readonly light: string;
    readonly dark: string;
    readonly gradientFrom: string;
    readonly gradientTo: string;
    readonly fogFrom: string;
    readonly fogTo: string;
  };
  readonly landmark: {
    readonly name: string;
    readonly icon: string;
    readonly description: string;
  };
  readonly decorationSvg: string;
}

export const ISLAND_BIOMES: Record<string, IslandBiome> = {
  "topic-1": {
    id: "vowels",
    name: "Đảo Nguyên Âm",
    description: "Rừng rậm nhiệt đới — nơi hành trình bắt đầu",
    icon: "🌴",
    svgPath: "/illustrations/islands/vowels-shape.svg",
    colors: {
      base: "biome-vowels",
      light: "biome-vowels-light",
      dark: "biome-vowels-dark",
      gradientFrom: "from-emerald-400",
      gradientTo: "to-green-600",
      fogFrom: "from-emerald-900/80",
      fogTo: "to-emerald-800/60",
    },
    landmark: {
      name: "Đền Nguyên Âm",
      icon: "🏛️",
      description: "Bài kiểm tra cuối: Phân biệt 12 nguyên âm IPA",
    },
    decorationSvg: "/illustrations/elements/palm-tree-simple.svg",
  },
  "topic-1-vowels": {
    id: "vowels",
    name: "Đảo Nguyên Âm",
    description: "Rừng rậm nhiệt đới — nơi hành trình bắt đầu",
    icon: "🌴",
    svgPath: "/illustrations/islands/vowels-shape.svg",
    colors: {
      base: "biome-vowels",
      light: "biome-vowels-light",
      dark: "biome-vowels-dark",
      gradientFrom: "from-emerald-400",
      gradientTo: "to-green-600",
      fogFrom: "from-emerald-900/80",
      fogTo: "to-emerald-800/60",
    },
    landmark: {
      name: "Đền Nguyên Âm",
      icon: "🏛️",
      description: "Bài kiểm tra cuối: Phân biệt 12 nguyên âm IPA",
    },
    decorationSvg: "/illustrations/elements/palm-tree-simple.svg",
  },
  "topic-2": {
    id: "consonants",
    name: "Đảo Phụ Âm",
    description: "Vùng biển sâu — đa dạng và bí ẩn",
    icon: "🌊",
    svgPath: "/illustrations/islands/consonants-shape.svg",
    colors: {
      base: "biome-consonants",
      light: "biome-consonants-light",
      dark: "biome-consonants-dark",
      gradientFrom: "from-blue-400",
      gradientTo: "to-indigo-600",
      fogFrom: "from-blue-900/80",
      fogTo: "to-blue-800/60",
    },
    landmark: {
      name: "Hải Đăng Phụ Âm",
      icon: "🗼",
      description: "Bài kiểm tra cuối: Chinh phục 24 phụ âm IPA",
    },
    decorationSvg: "/illustrations/elements/lighthouse-simple.svg",
  },
  "topic-2-consonants": {
    id: "consonants",
    name: "Đảo Phụ Âm",
    description: "Vùng biển sâu — đa dạng và bí ẩn",
    icon: "🌊",
    svgPath: "/illustrations/islands/consonants-shape.svg",
    colors: {
      base: "biome-consonants",
      light: "biome-consonants-light",
      dark: "biome-consonants-dark",
      gradientFrom: "from-blue-400",
      gradientTo: "to-indigo-600",
      fogFrom: "from-blue-900/80",
      fogTo: "to-blue-800/60",
    },
    landmark: {
      name: "Hải Đăng Phụ Âm",
      icon: "🗼",
      description: "Bài kiểm tra cuối: Chinh phục 24 phụ âm IPA",
    },
    decorationSvg: "/illustrations/elements/lighthouse-simple.svg",
  },
  "topic-3": {
    id: "pairs",
    name: "Đảo Cặp Tối Thiểu",
    description: "Vùng đất tím huyền bí — thử thách tinh tế",
    icon: "🔮",
    svgPath: "/illustrations/islands/pairs-shape.svg",
    colors: {
      base: "biome-pairs",
      light: "biome-pairs-light",
      dark: "biome-pairs-dark",
      gradientFrom: "from-purple-400",
      gradientTo: "to-fuchsia-600",
      fogFrom: "from-purple-900/80",
      fogTo: "to-purple-800/60",
    },
    landmark: {
      name: "Thánh Địa Phân Biệt",
      icon: "⛩️",
      description: "Bài kiểm tra cuối: Phân biệt cặp âm gần giống",
    },
    decorationSvg: "/illustrations/elements/crystal-simple.svg",
  },
  "topic-3-minimal-pairs-hard": {
    id: "pairs",
    name: "Đảo Cặp Tối Thiểu",
    description: "Vùng đất tím huyền bí — thử thách tinh tế",
    icon: "🔮",
    svgPath: "/illustrations/islands/pairs-shape.svg",
    colors: {
      base: "biome-pairs",
      light: "biome-pairs-light",
      dark: "biome-pairs-dark",
      gradientFrom: "from-purple-400",
      gradientTo: "to-fuchsia-600",
      fogFrom: "from-purple-900/80",
      fogTo: "to-purple-800/60",
    },
    landmark: {
      name: "Thánh Địa Phân Biệt",
      icon: "⛩️",
      description: "Bài kiểm tra cuối: Phân biệt cặp âm gần giống",
    },
    decorationSvg: "/illustrations/elements/crystal-simple.svg",
  },
  "topic-4": {
    id: "stress",
    name: "Đảo Trọng Âm & Nối Âm",
    description: "Núi lửa năng lượng — đỉnh cao phát âm",
    icon: "🌋",
    svgPath: "/illustrations/islands/stress-shape.svg",
    colors: {
      base: "biome-stress",
      light: "biome-stress-light",
      dark: "biome-stress-dark",
      gradientFrom: "from-orange-400",
      gradientTo: "to-red-600",
      fogFrom: "from-orange-900/80",
      fogTo: "to-orange-800/60",
    },
    landmark: {
      name: "Đỉnh Nối Âm",
      icon: "⛰️",
      description: "Bài kiểm tra cuối: Trọng âm & nối âm tự nhiên",
    },
    decorationSvg: "/illustrations/elements/volcano-simple.svg",
  },
  "topic-4-stress-connected": {
    id: "stress",
    name: "Đảo Trọng Âm & Nối Âm",
    description: "Núi lửa năng lượng — đỉnh cao phát âm",
    icon: "🌋",
    svgPath: "/illustrations/islands/stress-shape.svg",
    colors: {
      base: "biome-stress",
      light: "biome-stress-light",
      dark: "biome-stress-dark",
      gradientFrom: "from-orange-400",
      gradientTo: "to-red-600",
      fogFrom: "from-orange-900/80",
      fogTo: "to-orange-800/60",
    },
    landmark: {
      name: "Đỉnh Nối Âm",
      icon: "⛰️",
      description: "Bài kiểm tra cuối: Trọng âm & nối âm tự nhiên",
    },
    decorationSvg: "/illustrations/elements/volcano-simple.svg",
  },
};

/** Thứ tự hiển thị đảo (match với topic ID pattern) */
export const ISLAND_ORDER = ["topic-1", "topic-2", "topic-3", "topic-4"] as const;

/** Fallback biome cho topic không có config */
export const FALLBACK_BIOME: IslandBiome = {
  id: "unknown",
  name: "Đảo Bí Ẩn",
  description: "Nội dung đang được chuẩn bị",
  icon: "🏝️",
  svgPath: "/illustrations/islands/vowels-shape.svg",
  colors: {
    base: "biome-vowels",
    light: "biome-vowels-light",
    dark: "biome-vowels-dark",
    gradientFrom: "from-neutral-400",
    gradientTo: "to-neutral-600",
    fogFrom: "from-neutral-900/80",
    fogTo: "to-neutral-800/60",
  },
  landmark: {
    name: "Đền Bí Ẩn",
    icon: "🏰",
    description: "Sắp ra mắt",
  },
  decorationSvg: "",
};

// ─── Camp State Icons (nielsen H6: recognition) ───────────────
/** 3-channel: icon + color + text — color-blind safe */
export const CAMP_STATE_ICONS = {
  completed: "✅",
  current: "🏕️",
  available: "⛺",
  locked: "🔒",
} as const;

// ─── Glow levels for character avatar (streak-based) ──────────
export const STREAK_GLOW_THRESHOLDS = {
  gold: 30,    // 30+ days = gold glow
  blue: 14,    // 14+ days = blue glow
  green: 7,    // 7+ days = green glow
} as const;
