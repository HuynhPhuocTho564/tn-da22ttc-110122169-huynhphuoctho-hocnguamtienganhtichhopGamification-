/**
 * Rank Tier system — gán tier (Đồng/Bạc/Vàng/Kim Cương/Huyền Thoại) cho user
 * dựa trên vị trí xếp hạng (Goal-Gradient Effect — identity + động lực cạnh tranh).
 *
 * Tier tính theo percentile (rank / totalPlayers), không phụ thuộc số điểm tuyệt đối
 * → công bằng dù kỳ có ít/nhiều người chơi.
 *
 * @module gamification/rank-tiers
 */

export type RankTier = "bronze" | "silver" | "gold" | "diamond" | "legend";

export const RANK_TIERS = {
  bronze: {
    name: "Đồng",
    icon: "🥉",
    color: "text-amber-700",
    bgColor: "bg-amber-100",
    borderColor: "border-amber-300",
    condition: "Top 50%",
  },
  silver: {
    name: "Bạc",
    icon: "🥈",
    color: "text-neutral-600",
    bgColor: "bg-neutral-100",
    borderColor: "border-neutral-300",
    condition: "Top 25%",
  },
  gold: {
    name: "Vàng",
    icon: "🥇",
    color: "text-yellow-600",
    bgColor: "bg-yellow-100",
    borderColor: "border-yellow-400",
    condition: "Top 10%",
  },
  diamond: {
    name: "Kim Cương",
    icon: "💎",
    color: "text-purple-600",
    bgColor: "bg-purple-100",
    borderColor: "border-purple-400",
    condition: "Top 3%",
  },
  legend: {
    name: "Huyền Thoại",
    icon: "🏆",
    color: "text-amber-600",
    bgColor: "bg-gradient-to-r from-yellow-100 to-amber-100",
    borderColor: "border-amber-400",
    condition: "#1 kỳ",
  },
} as const satisfies Record<RankTier, { name: string; icon: string; color: string; bgColor: string; borderColor: string; condition: string }>;

/**
 * Xác định tier từ vị trí xếp hạng. Pure function — dễ unit test.
 *
 * @param rank — vị trí 1-based
 * @param totalPlayers — tổng số người chơi trong kỳ
 *
 * @example getRankTier(1, 100) → "legend"
 * @example getRankTier(3, 100) → "diamond"   (3%)
 * @example getRankTier(10, 100) → "gold"     (10%)
 * @example getRankTier(25, 100) → "silver"   (25%)
 * @example getRankTier(50, 100) → "bronze"   (50%)
 */
export function getRankTier(rank: number, totalPlayers: number): RankTier {
  if (totalPlayers <= 0) return "bronze";
  if (rank <= 0) return "bronze";
  if (rank === 1) return "legend";

  const percentile = (rank / totalPlayers) * 100;
  if (percentile <= 3) return "diamond";
  if (percentile <= 10) return "gold";
  if (percentile <= 25) return "silver";
  return "bronze";
}
