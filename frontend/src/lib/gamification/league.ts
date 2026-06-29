/**
 * League Tier System — constants và helpers cho giải đấu theo hạng.
 *
 * Mỗi user thuộc 1 hạng cố định (persist qua các tuần).
 * Cạnh tranh trong cùng hạng. Top 10 lên hạng, bottom 10 xuống hạng.
 * Top 5 mỗi hạng nhận diamonds thưởng giảm dần.
 *
 * @module gamification/league
 */

// ─── Tier Order (thấp → cao) ─────────────────────────────────

export const TIER_ORDER = ["bronze", "silver", "gold", "diamond", "legend"] as const;
export type LeagueTier = (typeof TIER_ORDER)[number];

// ─── Promotion / Demotion ────────────────────────────────────

/**
 * Số người top đầu được lên hạng mỗi tuần.
 * THIETKE Micro-Leaderboards: cohort 30 người → top ~20% = 7 người thăng hạng.
 */
export const TIER_PROMOTION_COUNT = 7;

/**
 * Số người cuối bảng bị xuống hạng mỗi tuần.
 * THIETKE: bottom ~20% = 7 người rớt hạng (kích hoạt Loss Aversion).
 */
export const TIER_DEMOTION_COUNT = 7;

/**
 * Số người tối thiểu trong hạng để có demotion (dưới ngưỡng này thì không ai xuống,
 * tránh việc tier nhỏ vơi hết người).
 */
export const MIN_PLAYERS_FOR_DEMOTION = 15;

/**
 * Kích thước bảng vi mô (THIETKE: 30 người — lớp học lý tưởng, đủ cạnh tranh
 * nhưng user vẫn cảm thấy có cơ hội leo lên Top 1).
 */
export const COHORT_SIZE = 30;

// ─── Diamond Rewards (Top 7 mỗi hạng) ────────────────────────────

/**
 * Diamonds thưởng cho top 7, index 0 = rank 1, giảm dần theo rank.
 * Tạo Goal-Gradient Effect: user thấy "gần tới đích" → tăng effort.
 */
export const TIER_GEM_REWARDS = [50, 40, 30, 20, 15, 10, 5] as const;

// ─── Tier Display ────────────────────────────────────────────

export const TIER_DISPLAY: Record<LeagueTier, {
  name: string;
  icon: string;
  gradient: string;
  badgeClass: string;
}> = {
  bronze: {
    name: "Đồng",
    icon: "🥉",
    gradient: "from-amber-600 to-amber-700",
    badgeClass: "bg-amber-100 text-amber-800 border-amber-300",
  },
  silver: {
    name: "Bạc",
    icon: "🥈",
    gradient: "from-gray-300 to-gray-400",
    badgeClass: "bg-neutral-100 text-neutral-700 border-neutral-300",
  },
  gold: {
    name: "Vàng",
    icon: "🥇",
    gradient: "from-yellow-400 to-amber-500",
    badgeClass: "bg-yellow-100 text-yellow-800 border-yellow-400",
  },
  diamond: {
    name: "Kim Cương",
    icon: "💎",
    gradient: "from-purple-400 to-indigo-600",
    badgeClass: "bg-purple-100 text-purple-800 border-purple-400",
  },
  legend: {
    name: "Huyền Thoại",
    icon: "🏆",
    gradient: "from-amber-400 to-red-500",
    badgeClass: "bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-800 border-amber-400",
  },
};

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Lấy hạng kế tiếp (lên hạng). Legend → Legend (max).
 * Pure function — dễ test.
 */
export function getNextTier(current: LeagueTier): LeagueTier {
  const idx = TIER_ORDER.indexOf(current);
  if (idx < 0 || idx >= TIER_ORDER.length - 1) return current;
  return TIER_ORDER[idx + 1];
}

/**
 * Lấy hạng trước đó (xuống hạng). Bronze → Bronze (min).
 * Pure function — dễ test.
 */
export function getPrevTier(current: LeagueTier): LeagueTier {
  const idx = TIER_ORDER.indexOf(current);
  if (idx <= 0) return current;
  return TIER_ORDER[idx - 1];
}

/**
 * Diamonds thưởng cho rank trong tier (1-based).
 * Rank > 5 → 0 diamonds.
 */
export function getGemReward(rankInTier: number): number {
  if (rankInTier < 1 || rankInTier > TIER_GEM_REWARDS.length) return 0;
  return TIER_GEM_REWARDS[rankInTier - 1];
}

/**
 * Kiểm tra tier string có hợp lệ không.
 */
export function isValidTier(tier: string): tier is LeagueTier {
  return (TIER_ORDER as readonly string[]).includes(tier);
}
