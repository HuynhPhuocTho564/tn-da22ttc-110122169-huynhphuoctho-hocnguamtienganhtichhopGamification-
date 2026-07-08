"use client";

import { ArrowDown, ArrowUp, Crown, Minus } from "lucide-react";
import { AdminPanel, EmptyTableState } from "@/components/admin/ui";
import { formatDate } from "./layout/admin-utils";

/**
 * Leaderboard management UI.
 *
 * PLAN/ADMIN_DASHBOARD_new.md §5 — Quản lý bảng xếp hạng + phân hạng
 * (bronze→silver→gold→diamond→legend) + lịch sử SeasonTransitionLog.
 *
 * Top 50 public rankings, reset weekly (ISO week) và monthly.
 * Tier rules là constants; current snapshots từ `Leaderboard`, lịch sử
 * transition từ `SeasonTransitionLog`.
 */

export type LeaderboardTier = "bronze" | "silver" | "gold" | "diamond" | "legend";

const TIER_ORDER: LeaderboardTier[] = ["bronze", "silver", "gold", "diamond", "legend"];

const TIER_LABEL: Record<LeaderboardTier, string> = {
  bronze: "Đồng",
  silver: "Bạc",
  gold: "Vàng",
  diamond: "Kim Cương",
  legend: "Huyền Thoại",
};

const TIER_TONE: Record<LeaderboardTier, string> = {
  bronze: "border-amber-300 bg-amber-50 text-amber-800",
  silver: "border-slate-300 bg-slate-50 text-slate-800",
  gold: "border-yellow-300 bg-yellow-50 text-yellow-800",
  diamond: "border-cyan-300 bg-cyan-50 text-cyan-800",
  legend: "border-pink-300 bg-pink-50 text-pink-800",
};

export type LeaderboardEntry = {
  id: string;
  userId: string;
  username: string;
  tier: LeaderboardTier;
  score: number;
  correctAnswers: number;
  completedExercises: number;
  type: "tuan" | "thang";
  period: string;
  updatedAt: string;
};

export type SeasonTransition = {
  id: string;
  username: string;
  period: string;
  fromTier: LeaderboardTier;
  toTier: LeaderboardTier;
  action: "promoted" | "demoted" | "stayed";
  rankInTier: number;
  gemsEarned: number;
  createdAt: string;
};

type LeaderboardManagementProps = {
  weekly: LeaderboardEntry[];
  transitions: SeasonTransition[];
};

export default function LeaderboardManagement({ weekly, transitions }: LeaderboardManagementProps) {
  const topWeekly = [...weekly].sort((a, b) => b.score - a.score).slice(0, 10);
  const tierCounts = TIER_ORDER.reduce<Record<LeaderboardTier, number>>(
    (acc, tier) => {
      acc[tier] = weekly.filter((entry) => entry.tier === tier).length;
      return acc;
    },
    { bronze: 0, silver: 0, gold: 0, diamond: 0, legend: 0 }
  );

  return (
    <div className="space-y-5">
      <AdminPanel title="Tier Distribution" subtitle="Số user hiện tại theo từng hạng (weekly)">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {TIER_ORDER.map((tier) => (
            <div key={tier} className={`rounded-lg border p-3 ${TIER_TONE[tier]}`}>
              <div className="text-xs font-bold uppercase opacity-80">{TIER_LABEL[tier]}</div>
              <div className="mt-1 text-2xl font-bold">{tierCounts[tier]}</div>
            </div>
          ))}
        </div>
      </AdminPanel>

      <AdminPanel title="🏆 Top 10 — Weekly" subtitle="Reset mỗi thứ 2 00:00 theo ISO week">
        <RankingTable entries={topWeekly} />
      </AdminPanel>

      <AdminPanel
        title="Lịch sử chuyển hạng (SeasonTransitionLog)"
        subtitle="Mỗi lần lên/xuống hạng khi kết thúc tuần"
      >
        {transitions.length === 0 ? (
          <EmptyTableState>Chưa có lịch sử chuyển hạng nào.</EmptyTableState>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
                <tr>
                  <th className="px-2 py-2 font-bold">User</th>
                  <th className="px-2 py-2 font-bold">Kỳ</th>
                  <th className="px-2 py-2 font-bold">Hạng cũ → mới</th>
                  <th className="px-2 py-2 font-bold">Hành động</th>
                  <th className="px-2 py-2 font-bold">Rank</th>
                  <th className="px-2 py-2 font-bold">Gems</th>
                  <th className="px-2 py-2 font-bold">Thời gian</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {transitions.slice(0, 15).map((row) => (
                  <tr key={row.id} className="hover:bg-slate-50">
                    <td className="px-2 py-3 font-semibold text-slate-900">{row.username}</td>
                    <td className="px-2 py-3 text-slate-600">{row.period}</td>
                    <td className="px-2 py-3 text-xs">
                      <span className={`mr-1 inline-block rounded border px-1.5 py-0.5 ${TIER_TONE[row.fromTier]}`}>
                        {TIER_LABEL[row.fromTier]}
                      </span>
                      →
                      <span className={`ml-1 inline-block rounded border px-1.5 py-0.5 ${TIER_TONE[row.toTier]}`}>
                        {TIER_LABEL[row.toTier]}
                      </span>
                    </td>
                    <td className="px-2 py-3">
                      <ActionBadge action={row.action} />
                    </td>
                    <td className="px-2 py-3 text-slate-700">#{row.rankInTier}</td>
                    <td className="px-2 py-3 text-amber-700">{row.gemsEarned > 0 ? `+${row.gemsEarned}` : "—"}</td>
                    <td className="px-2 py-3 text-slate-500">{formatDate(row.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </AdminPanel>
    </div>
  );
}

function RankingTable({ entries }: { entries: LeaderboardEntry[] }) {
  if (entries.length === 0) {
    return <EmptyTableState>Chưa có ranking cho kỳ này.</EmptyTableState>;
  }
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-slate-200 text-xs uppercase text-slate-500">
          <tr>
            <th className="px-2 py-2 font-bold">#</th>
            <th className="px-2 py-2 font-bold">User</th>
            <th className="px-2 py-2 font-bold">Hạng</th>
            <th className="px-2 py-2 font-bold">Score</th>
            <th className="px-2 py-2 font-bold">Đúng</th>
            <th className="px-2 py-2 font-bold">Bài</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {entries.map((entry, index) => (
            <tr key={entry.id} className="hover:bg-slate-50">
              <td className="px-2 py-3 font-bold text-slate-900">
                {index === 0 ? (
                  <span className="inline-flex items-center gap-1 text-yellow-600">
                    <Crown aria-hidden="true" className="h-4 w-4" />1
                  </span>
                ) : (
                  index + 1
                )}
              </td>
              <td className="px-2 py-3 font-semibold text-slate-900">{entry.username}</td>
              <td className="px-2 py-3">
                <span className={`inline-block rounded border px-2 py-0.5 text-xs font-bold ${TIER_TONE[entry.tier]}`}>
                  {TIER_LABEL[entry.tier]}
                </span>
              </td>
              <td className="px-2 py-3 text-slate-900">{entry.score}</td>
              <td className="px-2 py-3 text-slate-700">{entry.correctAnswers}</td>
              <td className="px-2 py-3 text-slate-700">{entry.completedExercises}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActionBadge({ action }: { action: "promoted" | "demoted" | "stayed" }) {
  if (action === "promoted") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-xs font-bold text-emerald-700">
        <ArrowUp aria-hidden="true" className="h-3 w-3" />
        Lên hạng
      </span>
    );
  }
  if (action === "demoted") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-rose-200 bg-rose-50 px-2 py-0.5 text-xs font-bold text-rose-700">
        <ArrowDown aria-hidden="true" className="h-3 w-3" />
        Xuống hạng
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-xs font-bold text-slate-700">
      <Minus aria-hidden="true" className="h-3 w-3" />
      Giữ nguyên
    </span>
  );
}
