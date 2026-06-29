import React from "react";
import { getAvatarUrl } from "@/lib/avatar";

/**
 * PodiumCard — Bục vinh danh top 3 leaderboard.
 * Von Restorff: top 3 KHÁC BIỆT hoàn toàn so với #4+.
 * #1 Gold (giữa, cao nhất), #2 Silver (trái), #3 Bronze (phải).
 */

type PodiumUser = {
  username: string;
  avatarUrl: string | null;
  score: number;
  level: number;
};

type PodiumCardProps = {
  user: PodiumUser;
  rank: 1 | 2 | 3;
  isChampion?: boolean;
};

/** Cấu hình bục theo hạng — height, màu, medal */
const PODIUM_CONFIG: Record<1 | 2 | 3, {
  height: string;
  gradient: string;
  border: string;
  avatarSize: string;
  avatarBorder: string;
  medal: string;
  medalLabel: string;
  glow: string;
  nameColor: string;
}> = {
  1: {
    height: "h-44",
    gradient: "from-yellow-300 via-amber-400 to-yellow-500",
    border: "border-amber-400",
    avatarSize: "h-24 w-24",
    avatarBorder: "border-4 border-amber-400 shadow-[0_0_20px_rgba(251,191,36,0.5)]",
    medal: "🥇",
    medalLabel: "Vàng",
    glow: "drop-shadow-[0_0_16px_rgba(251,191,36,0.6)]",
    nameColor: "text-amber-800",
  },
  2: {
    height: "h-32",
    gradient: "from-gray-200 via-neutral-300 to-gray-400",
    border: "border-neutral-300",
    avatarSize: "h-20 w-20",
    avatarBorder: "border-4 border-neutral-300 shadow-[0_0_12px_rgba(156,163,175,0.4)]",
    medal: "🥈",
    medalLabel: "Bạc",
    glow: "drop-shadow-[0_0_10px_rgba(156,163,175,0.4)]",
    nameColor: "text-neutral-700",
  },
  3: {
    height: "h-24",
    gradient: "from-amber-500 via-orange-600 to-amber-700",
    border: "border-amber-600",
    avatarSize: "h-18 w-18",
    avatarBorder: "border-4 border-amber-600 shadow-[0_0_10px_rgba(217,119,6,0.4)]",
    medal: "🥉",
    medalLabel: "Đồng",
    glow: "drop-shadow-[0_0_10px_rgba(217,119,6,0.3)]",
    nameColor: "text-amber-800",
  },
};

export default function PodiumCard({ user, rank, isChampion = false }: PodiumCardProps) {
  const config = PODIUM_CONFIG[rank];

  return (
    <div className={`flex flex-col items-center ${isChampion ? "order-2" : rank === 2 ? "order-1" : "order-3"}`}>
      {/* Crown for champion */}
      {isChampion && (
        <span className="mb-1 text-4xl animate-bounce" style={{ animationDuration: "2s" }} aria-label="Quán quân" role="img">
          👑
        </span>
      )}

      {/* Avatar */}
      <div className="relative mb-2">
        <img
          src={user.avatarUrl ?? getAvatarUrl(user.username)}
          alt={`Avatar của ${user.username}`}
          className={`${config.avatarSize} rounded-full ${config.avatarBorder} bg-white object-cover`}
        />
        {/* Medal badge on avatar */}
        <span
          className={`absolute -bottom-1 -right-1 text-xl ${config.glow}`}
          aria-label={`Huy chương ${config.medalLabel}`}
        >
          {config.medal}
        </span>
      </div>

      {/* Name */}
      <p className={`max-w-[120px] truncate text-sm font-bold ${config.nameColor}`}>
        {user.username}
      </p>

      {/* Level */}
      <p className="text-xs text-neutral-500">Lv. {user.level}</p>

      {/* Score */}
      <p className="mt-1 text-base font-black text-neutral-900">
        {user.score.toLocaleString("vi-VN")}
      </p>
      <p className="text-[10px] text-neutral-500">điểm</p>

      {/* Podium base */}
      <div
        className={`mt-3 flex w-28 items-start justify-center rounded-t-xl bg-gradient-to-t ${config.gradient} ${config.height} pt-4 shadow-lg`}
      >
        <span className="text-4xl font-black text-white/80 drop-shadow">
          {rank}
        </span>
      </div>
    </div>
  );
}
