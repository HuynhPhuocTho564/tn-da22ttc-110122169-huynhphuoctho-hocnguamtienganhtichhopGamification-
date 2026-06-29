import { getRankTier, RANK_TIERS } from "@/lib/gamification/rank-tiers";

/**
 * RankTierBadge — hiển thị badge tier (Đồng/Bạc/Vàng/Kim Cương/Huyền Thoại)
 * cho user dựa trên vị trí xếp hạng (Nielsen H6 — Recognition, icon + text dual encoding).
 *
 * Pure presentational — nhận rank + totalPlayers, tự tính tier.
 *
 * @module gamification/RankTierBadge
 */

type RankTierBadgeProps = {
  rank: number;
  totalPlayers: number;
  size?: "sm" | "md" | "lg";
};

const SIZE_CLASSES = {
  sm: "text-xs px-2 py-0.5",
  md: "text-sm px-3 py-1",
  lg: "text-base px-4 py-1.5",
} as const;

export default function RankTierBadge({ rank, totalPlayers, size = "md" }: RankTierBadgeProps) {
  const tier = getRankTier(rank, totalPlayers);
  const config = RANK_TIERS[tier];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border font-bold ${config.bgColor} ${config.color} ${config.borderColor} ${SIZE_CLASSES[size]}`}
      title={`${config.name} — ${config.condition}`}
      aria-label={`Hạng ${config.name}: ${config.condition}`}
    >
      <span aria-hidden="true">{config.icon}</span>
      {config.name}
    </span>
  );
}
