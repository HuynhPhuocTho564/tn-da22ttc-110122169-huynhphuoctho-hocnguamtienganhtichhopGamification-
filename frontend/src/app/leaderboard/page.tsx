"use client";

import React, { useEffect, useState } from "react";
import { getAvatarUrl } from "@/lib/avatar";
import Card from "@/components/ui/Card";
import { TabButton } from "@/components/ui/TabButton";
import PodiumCard from "@/components/gamification/PodiumCard";
import TierPromotionBanner from "@/components/gamification/TierPromotionBanner";
import { SkeletonLeaderboardList } from "@/components/ui/Skeleton";
import {
  TIER_DISPLAY,
  TIER_ORDER,
  TIER_PROMOTION_COUNT,
  TIER_DEMOTION_COUNT,
  type LeagueTier,
  isValidTier,
} from "@/lib/gamification/league";
import type { WeekCountdown as WeekCountdownData } from "@/lib/gamification/league-zone";
import { checkAndTriggerTransition } from "@/lib/season";

// ─── Types ───────────────────────────────────────────────────

type LeaderboardItem = {
  rank: number;
  userId: string;
  username: string;
  avatarUrl: string | null;
  level: number;
  streak: number;
  score: number;
  currentTier?: string;
  correctAnswers: number;
  completedExercises: number;
  badges: Array<{ name: string; type: string }>;
};

type LeaderboardResponse =
  | { success: true; data: LeaderboardData }
  | { success: false; error?: { code: string; message: string } };

type LeaderboardData = {
  type: "tuan";
  period: string;
  items: LeaderboardItem[];
  currentUser: { rank: number; score: number; currentTier: string; level: number; xp: number };
  totalPlayers: number;
  tierFilter: string | null;
  promotionCount: number;
  demotionCount: number;
  weekCountdown: WeekCountdownData;
};

// ─── Helpers ─────────────────────────────────────────────────

/**
 * Format countdown ngắn gọn cho badge cạnh tiêu đề.
 * VD: "2 ngày 11h", "5 giờ 30 phút", "12 phút"
 */
function formatCompactCountdown(c: WeekCountdownData): string {
  if (c.daysLeft > 0) return `${c.daysLeft} ngày ${c.hoursLeft}h`;
  if (c.hoursLeft > 0) return `${c.hoursLeft} giờ ${c.minutesLeft}p`;
  return `${c.minutesLeft} phút`;
}

// ─── Component ───────────────────────────────────────────────

export default function LeaderboardPage() {
  const [tier, setTier] = useState<LeagueTier | null>(null); // null = user's tier
  const [data, setData] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Client-side fallback: trigger season transition khi user mở app (golden hour Sun 20-21h).
  useEffect(() => {
    checkAndTriggerTransition();
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadLeaderboard() {
      setIsLoading(true);
      setError(null);

      try {
        const tierParam = tier ? `&tier=${tier}` : "";
        const response = await fetch(`/api/leaderboard?limit=50${tierParam}`);
        const body = (await response.json()) as LeaderboardResponse;

        if (cancelled) return;

        if (body.success) {
          setData(body.data);
        } else {
          setError(body.error?.message ?? "Không lấy được bảng xếp hạng.");
        }
      } catch (err) {
        console.warn("[LeaderboardPage] Load failed:", err);
        if (!cancelled) {
          setError("Không thể kết nối API bảng xếp hạng.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadLeaderboard();

    return () => {
      cancelled = true;
    };
  }, [tier]);

  const userTier = (data?.currentUser?.currentTier ?? tier ?? "bronze") as LeagueTier;
  const userTierDisplay = isValidTier(userTier) ? TIER_DISPLAY[userTier] : null;

  return (
    <div className="min-h-screen py-10 px-4 pb-24 sm:px-6 lg:px-8">
      {/* Tier Promotion Banner (shows after season transition) */}
      <TierPromotionBanner />

      <main className="max-w-4xl mx-auto">
        {/* ═══ 1. Header: Title + Countdown Badge (Minimalist) ═══ */}
        <div className="mb-4 flex flex-wrap items-center gap-3">
          <h1 className="text-3xl font-bold text-neutral-900 sm:text-4xl">
            🏆 Giải Đấu Tuần
          </h1>
          {data && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full bg-orange-100 px-3 py-1 text-sm font-medium text-orange-600"
              role="status"
              aria-live="polite"
              data-testid="countdown-badge"
            >
              <span aria-hidden>⏳</span>
              {formatCompactCountdown(data.weekCountdown)} nữa
            </span>
          )}
        </div>
        <p className="mb-6 text-sm text-neutral-600">
          Cạnh tranh trong cùng hạng. Top {TIER_PROMOTION_COUNT} lên hạng, cuối{" "}
          {TIER_DEMOTION_COUNT} xuống hạng.
        </p>

        {/* ═══ 2. Tier Filter Tabs (Hick ≤7 options) — shared TabButton (44px touch target) ═══ */}
        <div
          className="mb-6 flex flex-wrap gap-1.5"
          role="tablist"
          aria-label="Chọn hạng để xem"
        >
          <TabButton
            active={tier === null}
            onClick={() => setTier(null)}
            className="text-xs px-3 py-1.5 min-h-[36px] rounded-full"
          >
            Hạng của tôi
          </TabButton>
          {TIER_ORDER.map((t) => {
            const d = TIER_DISPLAY[t];
            return (
              <TabButton
                key={t}
                active={tier === t}
                onClick={() => setTier(t)}
                className="text-xs px-3 py-1.5 min-h-[36px] rounded-full"
              >
                {d.icon} {d.name}
              </TabButton>
            );
          })}
        </div>

        {/* ═══ 3. "Thứ hạng của bạn" — Sticky bottom bar ═══ */}
        {data && userTierDisplay && (
          <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-slate-200 bg-white/95 shadow-[0_-2px_10px_rgba(0,0,0,0.08)] backdrop-blur-sm">
            <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
              <div className="flex items-center gap-3">
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-bold ${userTierDisplay.badgeClass}`}
                >
                  {userTierDisplay.icon} {userTierDisplay.name}
                </span>
                <div>
                  <div className="font-bold text-neutral-900">Thứ hạng của bạn</div>
                  <div className="text-xs text-neutral-500">Cấp {data.currentUser.level} · {(data.currentUser.xp ?? 0).toLocaleString("vi-VN")} XP</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-primary-600 tabular-nums">
                  {data.currentUser.rank > 0 ? `#${data.currentUser.rank}` : "—"}
                </div>
                <div className="text-xs text-neutral-600">
                  {data.currentUser.score > 0
                    ? `${data.currentUser.score.toLocaleString("vi-VN")} điểm hạng`
                    : "Chưa có điểm tuần này"}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ═══ Loading / Error ═══ */}
        {isLoading && <SkeletonLeaderboardList count={5} />}
        {error && <Card className="border-error-200 text-error-600">{error}</Card>}

        {/* ═══ 4. Podium Top 3 ═══ */}
        {!isLoading && !error && data && data.items.length >= 3 && (
          <div className="mb-8">
            <div className="relative rounded-2xl bg-gradient-to-b from-amber-50/80 via-white to-neutral-50 border border-amber-200/50 p-6 pt-8 shadow-inner overflow-hidden">
              <div className="pointer-events-none absolute inset-0" aria-hidden="true">
                <span className="absolute left-[15%] top-4 text-lg opacity-30">✨</span>
                <span className="absolute right-[15%] top-6 text-sm opacity-25">✨</span>
                <span className="absolute left-[40%] top-2 text-xs opacity-20">⭐</span>
                <span className="absolute right-[35%] top-8 text-xs opacity-20">⭐</span>
              </div>
              <div className="flex items-end justify-center gap-3 sm:gap-6">
                <PodiumCard user={data.items[1]} rank={2} />
                <PodiumCard user={data.items[0]} rank={1} isChampion />
                <PodiumCard user={data.items[2]} rank={3} />
              </div>
            </div>
          </div>
        )}

        {/* ═══ 5. Rest List — rank 4+ ═══ */}
        {!isLoading && !error && data && data.items.length > 3 && (
          <>
            <div className="mb-3 flex items-center gap-2">
              <div className="h-px flex-1 bg-neutral-200" />
              <span className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                Xếp hạng tiếp theo
              </span>
              <div className="h-px flex-1 bg-neutral-200" />
            </div>

            <Card padding="none">
              <div className="divide-y divide-neutral-100">
                {(() => {
                  const total = data.totalPlayers;
                  const promoCount = data.promotionCount || TIER_PROMOTION_COUNT;
                  const demoCount = data.demotionCount || TIER_DEMOTION_COUNT;

                  return data.items
                    .filter((u) => u.rank > 3)
                    .map((user) => {
                      const isInPromoZone = user.rank <= promoCount;
                      const isInDemoZone =
                        total > 0 && user.rank > total - demoCount;

                      const zoneBg = isInPromoZone
                        ? "bg-success-50/50"
                        : isInDemoZone
                          ? "bg-error-50/30"
                          : "";

                      const row = (
                        <div
                          key={`${user.rank}-${user.userId}`}
                          className={`flex items-center justify-between p-4 hover:bg-neutral-50 transition-colors ${zoneBg}`}
                        >
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            <div
                              className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                                isInPromoZone
                                  ? "bg-success-100 text-success-700 border border-success-300"
                                  : isInDemoZone
                                    ? "bg-error-100 text-error-600 border border-error-200"
                                    : "bg-neutral-100 text-neutral-600"
                              }`}
                            >
                              #{user.rank}
                            </div>

                            <img
                              src={getAvatarUrl(user.username, user.avatarUrl)}
                              alt={`${user.username} avatar`}
                              className="w-12 h-12 rounded-full border-2 border-white shadow-sm bg-white"
                            />
                            <div className="flex-1 min-w-0">
                              <div className="font-bold text-neutral-900 truncate flex items-center gap-2">
                                {user.username}
                                {isInPromoZone && (
                                  <span className="inline-flex items-center rounded-full bg-success-100 px-2 py-0.5 text-[10px] font-bold text-success-700">
                                    🔺 Lên hạng
                                  </span>
                                )}
                                {isInDemoZone && (
                                  <span className="inline-flex items-center rounded-full bg-error-100 px-2 py-0.5 text-[10px] font-bold text-error-600">
                                    🔻 Xuống hạng
                                  </span>
                                )}
                                {isInPromoZone && (
                                  <span className="inline-flex items-center rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                                    💎 Diamonds
                                  </span>
                                )}
                              </div>
                              <div className="text-sm text-neutral-600">
                                Cấp {user.level}
                              </div>
                            </div>
                          </div>

                          <div className="text-right">
                            <div className="text-xl font-bold text-neutral-900">
                              {user.score.toLocaleString("vi-VN")}
                            </div>
                            <div className="text-xs text-neutral-500">điểm hạng</div>
                          </div>
                        </div>
                      );

                      if (user.rank === promoCount) {
                        return (
                          <React.Fragment key={`group-promo-${user.rank}`}>
                            {row}
                            <div className="flex items-center gap-3 bg-gradient-to-r from-success-50 via-success-100 to-success-50 px-4 py-3">
                              <div className="h-px flex-1 bg-success-300" />
                              <span className="text-xs font-bold text-success-700">
                                🔺 Hết vùng lên hạng (Top {promoCount})
                              </span>
                              <div className="h-px flex-1 bg-success-300" />
                            </div>
                          </React.Fragment>
                        );
                      }

                      if (
                        total > 0 &&
                        user.rank === total - demoCount + 1 &&
                        user.rank > promoCount
                      ) {
                        return (
                          <React.Fragment key={`group-demo-${user.rank}`}>
                            <div className="flex items-center gap-3 bg-gradient-to-r from-error-50 via-error-100 to-error-50 px-4 py-3">
                              <div className="h-px flex-1 bg-error-200" />
                              <span className="text-xs font-bold text-error-600">
                                🔻 Vùng xuống hạng (Cuối {demoCount})
                              </span>
                              <div className="h-px flex-1 bg-error-200" />
                            </div>
                            {row}
                          </React.Fragment>
                        );
                      }

                      return row;
                    });
                })()}
              </div>
            </Card>
          </>
        )}

        {/* ═══ Empty states ═══ */}
        {!isLoading && !error && data && data.items.length === 0 && (
          <Card className="p-6 text-neutral-600">
            Chưa có dữ liệu xếp hạng cho tuần này. Hãy làm bài hoặc điểm danh để tạo điểm hạng đầu tiên.
          </Card>
        )}
        {!isLoading && !error && !data && (
          <Card className="p-6 text-neutral-600">
            Chưa có dữ liệu xếp hạng cho tuần này. Hãy làm bài hoặc điểm danh để tạo điểm hạng đầu tiên.
          </Card>
        )}

        <Card className="mt-6 bg-primary-50 border-primary-200">
          <h3 className="font-bold text-neutral-900 mb-2">Cách tăng điểm hạng</h3>
          <ul className="text-sm text-neutral-700 space-y-1">
            <li>Hoàn thành bài lần đầu: cộng theo điểm bài làm.</li>
            <li>Làm lại điểm cao hơn: cộng phần cải thiện.</li>
            <li>Làm lại điểm thấp hơn: vẫn có điểm ôn tập nhỏ.</li>
            <li>Điểm danh mỗi ngày: +2 điểm hạng và +10 EXP.</li>
          </ul>
        </Card>
      </main>
    </div>
  );
}
