"use client";

import React, { useEffect, useMemo, useState } from "react";
import confetti from "canvas-confetti";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { BadgeIcon } from "@/components/gamification/BadgeIcon";
import { SkeletonCardGrid } from "@/components/ui/Skeleton";
import { TabButton } from "@/components/ui/TabButton";
import { localizeBadgeType, getBadgeVariant } from "@/lib/badges";

type BadgeCategory = "progress" | "skill" | "streak" | "improvement" | "ranking" | "exploration" | "social" | "effort" | "performance";

type BadgeProgress = {
  current: number;
  target: number;
  unit: string;
} | null;

type EarnedBadge = {
  id: string;
  name: string;
  description: string | null;
  rarity: string;
  image: string | null;
  condition: string | null;
  category: BadgeCategory;
  earnedAt: string;
  validPeriod: string | null;
};

type AvailableBadge = {
  id: string;
  name: string;
  description: string;
  rarity: string;
  image: string | null;
  condition: string;
  category: BadgeCategory;
  progress: BadgeProgress;
};

type BadgesData = {
  earned: EarnedBadge[];
  available: AvailableBadge[];
  summary: {
    earnedCount: number;
    totalCount: number;
  };
};

type BadgesResponse =
  | {
      success: true;
      data: BadgesData;
    }
  | {
      success: false;
      error?: {
        code: string;
        message: string;
      };
    };

const categories: Array<{ id: BadgeCategory | "all"; name: string }> = [
  { id: "all", name: "Tất cả" },
  { id: "progress", name: "Tiến độ" },
  { id: "skill", name: "Kỹ năng" },
  { id: "streak", name: "Chuỗi ngày" },
  { id: "performance", name: "Thành tích" },
  { id: "exploration", name: "Khám phá" },
  { id: "effort", name: "Nỗ lực" },
  { id: "social", name: "Cộng đồng" },
];

/** Rarity-based card styles — solid white bg to stand out from page gradient */
const CARD_RARITY_STYLES: Record<string, string> = {
  COMMON: "border-blue-200 bg-white",
  RARE: "border-blue-300 bg-white shadow-md shadow-blue-100/50",
  EPIC: "border-purple-400 bg-white shadow-lg shadow-purple-200/40 ring-1 ring-purple-200",
  LEGENDARY:
    "border-amber-400 bg-white shadow-lg shadow-amber-200/40 ring-1 ring-amber-300",
  PERIODIC: "border-emerald-300 bg-white shadow-md shadow-emerald-100/50",
};

/**
 * Returns a contextual progress message based on Goal-Gradient theory.
 * Effort increases when user sees they're close to the goal.
 */
function getProgressMessage(current: number, target: number): string {
  const percent = current / target;
  const remaining = target - current;
  if (percent >= 1) return "🎉 Đã đạt!";
  if (percent >= 0.8) return `🔥 Gần đạt rồi! Chỉ cần ${remaining} nữa!`;
  if (percent >= 0.5) return "Hơn nửa đường rồi! 🚀";
  if (percent >= 0.3) return "Đang tiến bộ! 💪";
  return "Mới bắt đầu — tiếp tục nào!";
}
const RARITY_LABEL: Record<string, string> = {
  COMMON: "Phổ thông",
  RARE: "Hiếm",
  EPIC: "Sử thi",
  LEGENDARY: "Huyền thoại",
  PERIODIC: "Định kỳ",
};

// WCAG 3:1 contrast — darker fills for progress bars
const ACCENT_RARITY_STYLES: Record<string, { conditionBg: string; progressBar: string }> = {
  COMMON: { conditionBg: "bg-blue-50", progressBar: "bg-blue-600" },
  RARE: { conditionBg: "bg-blue-50", progressBar: "bg-blue-600" },
  EPIC: { conditionBg: "bg-purple-50", progressBar: "bg-purple-600" },
  LEGENDARY: { conditionBg: "bg-amber-50", progressBar: "bg-amber-600" },
  PERIODIC: { conditionBg: "bg-emerald-50", progressBar: "bg-emerald-600" },
};

function BadgeCard({
  badge,
  earned,
}: {
  badge: EarnedBadge | AvailableBadge;
  earned: boolean;
}) {
  const progress = "progress" in badge ? badge.progress : null;
  const progressPercent = progress ? Math.min(100, Math.round((progress.current / progress.target) * 100)) : 0;
  const rarity = badge.rarity as string;
  const cardStyle = CARD_RARITY_STYLES[rarity] ?? CARD_RARITY_STYLES.COMMON;
  const accent = ACCENT_RARITY_STYLES[rarity] ?? ACCENT_RARITY_STYLES.COMMON;

  // Gradient backgrounds for icon container based on rarity
  const iconBg: Record<string, string> = {
    COMMON: "bg-gradient-to-br from-blue-100 to-blue-200",
    RARE: "bg-gradient-to-br from-blue-100 to-blue-200",
    EPIC: "bg-gradient-to-br from-purple-100 to-purple-200",
    LEGENDARY: "bg-gradient-to-br from-amber-100 to-amber-200",
    PERIODIC: "bg-gradient-to-br from-emerald-100 to-emerald-200",
  };
  const iconBgClass = iconBg[rarity] ?? iconBg.COMMON;

  return (
    <div className={`rounded-2xl border-2 p-6 transition-all duration-300 ${cardStyle} ${earned ? "hover:shadow-lg hover:scale-[1.02]" : ""}`}>
      {/* Centered icon with gradient background */}
      <div className="flex justify-center mb-4 relative">
        <div className={`w-20 h-20 rounded-2xl ${iconBgClass} flex items-center justify-center ${earned ? "shadow-md" : ""}`}>
          <BadgeIcon
            badgeId={badge.id}
            rarity={badge.rarity as "COMMON" | "RARE" | "EPIC" | "LEGENDARY" | "PERIODIC"}
            size="lg"
            earned={earned}
          />
        </div>
        {/* Rarity tag — top-right for F-pattern eye flow */}
        <Badge variant={earned ? "info" : "default"} size="sm" className="absolute -top-1 -right-1">
          {RARITY_LABEL[rarity] ?? rarity}
        </Badge>
      </div>

      {/* Centered content */}
      <div className="text-center mb-4">
        <h3 className="text-lg font-bold text-neutral-900 mb-1">{badge.name}</h3>
        <p className="text-sm text-neutral-900">{badge.description}</p>
      </div>

      {/* Progress or earned status */}
      {earned && "earnedAt" in badge ? (
        <div className="flex items-center justify-center gap-2">
          <Badge variant="success" size="sm">
            Đã đạt
          </Badge>
        </div>
      ) : progress ? (
        <div>
          <div className="flex justify-between text-xs text-neutral-900 mb-2">
            <span className="font-medium">{progress.current}/{progress.target}</span>
            <span className="text-neutral-900">{getProgressMessage(progress.current, progress.target)}</span>
          </div>
          {/* WCAG 3:1 contrast — darker track for better visibility */}
          <div className="w-full bg-neutral-300 rounded-full h-3 overflow-hidden">
            <div className={`${accent.progressBar} h-full rounded-full transition-all duration-500`} style={{ width: `${progressPercent}%` }} />
          </div>
        </div>
      ) : (
        <div className="flex justify-center">
          <Badge variant="default" size="sm">
            Chưa đạt
          </Badge>
        </div>
      )}
    </div>
  );
}

/** localStorage key for badge onboarding — shown once per user */
const BADGE_ONBOARDING_KEY = "badge_onboarding_seen";

/**
 * Badge onboarding tooltip — explains the badge system to first-time visitors.
 * Nielsen H10: Help & documentation. Dismissible, reopenable via "?" button.
 */
function BadgeOnboardingTooltip({ show, onDismiss, onReopen }: {
  show: boolean;
  onDismiss: () => void;
  onReopen: () => void;
}) {
  return (
    <>
      <button
        onClick={onReopen}
        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-neutral-200 text-neutral-900 hover:bg-neutral-300 transition-colors text-sm font-bold"
        title="Trợ giúp hệ thống huy hiệu"
        aria-label="Trợ giúp hệ thống huy hiệu"
      >
        ?
      </button>
      {show && (
        <Card className="absolute top-12 right-0 z-50 w-80 border-primary-300 shadow-lg">
          <h3 className="font-bold text-neutral-900 mb-2">💡 Hệ thống huy hiệu</h3>
          <ul className="text-sm text-neutral-900 space-y-1.5 mb-3">
            <li>• Mỗi huy hiệu = 1 mục tiêu học tập cụ thể</li>
            <li>• Thanh tiến trình cho biết bạn còn bao xa để đạt</li>
            <li>• Huy hiệu càng hiếm càng khó đạt nhưng càng tự hào!</li>
          </ul>
          <div className="flex gap-2 mb-3 text-xs">
            <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-900">Thường</span>
            <span className="px-2 py-0.5 rounded bg-purple-50 text-purple-600">Hiếm</span>
            <span className="px-2 py-0.5 rounded bg-amber-50 text-amber-600">Huyền thoại</span>
            <span className="px-2 py-0.5 rounded bg-rose-50 text-rose-600">Tối cao</span>
          </div>
          <button
            onClick={onDismiss}
            className="w-full bg-primary-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-primary-700 transition-colors min-h-[36px]"
          >
            Đã hiểu ✓
          </button>
        </Card>
      )}
    </>
  );
}

export default function BadgesPage() {
  const [selectedCategory, setSelectedCategory] = useState<BadgeCategory | "all">("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "earned" | "unearned" | "in-progress">("all");
  const [rarityFilter, setRarityFilter] = useState<"all" | "COMMON" | "RARE" | "EPIC" | "LEGENDARY" | "PERIODIC">("all");
  const [data, setData] = useState<BadgesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [showCollection, setShowCollection] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadBadges() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/badges");
        const body = (await response.json()) as BadgesResponse;

        if (cancelled) return;

        if (body.success) {
          setData(body.data);
        } else {
          setError(body.error?.message ?? "Không lấy được danh sách huy hiệu.");
        }
      } catch (error) {
        console.warn("[BadgesPage] Load failed:", error);
        if (!cancelled) {
          setError("Không thể kết nối API huy hiệu.");
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    }

    loadBadges();

    return () => {
      cancelled = true;
    };
  }, []);

  // UX-2: Show onboarding tooltip for first-time visitors (Nielsen H10)
  useEffect(() => {
    if (!isLoading && data && !localStorage.getItem(BADGE_ONBOARDING_KEY)) {
      setShowOnboarding(true);
    }
  }, [isLoading, data]);

  // Celebration animation when user has earned badges
  useEffect(() => {
    if (!isLoading && data && data.summary.earnedCount > 0) {
      // Fire confetti celebration
      const colors = ["#10b981", "#3b82f6", "#a855f7", "#f97316", "#facc15"];
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { x: 0.5, y: 0.5 },
        colors,
      });
    }
  }, [isLoading, data]);

  const badges = useMemo(() => {
    if (!data) return [];

    const allBadges = [
      ...data.earned.map((badge) => ({ badge, earned: true })),
      ...data.available.map((badge) => ({ badge, earned: false })),
    ];

    let filtered = allBadges;

    // Filter by category
    if (selectedCategory !== "all") {
      filtered = filtered.filter((item) => item.badge.category === selectedCategory);
    }

    // Filter by status
    if (statusFilter === "earned") {
      filtered = filtered.filter((item) => item.earned);
    } else if (statusFilter === "unearned") {
      filtered = filtered.filter((item) => !item.earned && !("progress" in item.badge));
    } else if (statusFilter === "in-progress") {
      filtered = filtered.filter((item) => !item.earned && "progress" in item.badge);
    }

    // Filter by rarity
    if (rarityFilter !== "all") {
      filtered = filtered.filter((item) => item.badge.rarity === rarityFilter);
    }

    return filtered;
  }, [data, selectedCategory, statusFilter, rarityFilter]);

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 lg:px-8">
      <main className="max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <div className="flex items-center justify-center gap-2 mb-3">
            <h1 className="text-4xl font-bold text-neutral-900">Huy hiệu & thành tích</h1>
            <div className="relative">
              <BadgeOnboardingTooltip
                show={showOnboarding}
                onDismiss={() => {
                  localStorage.setItem(BADGE_ONBOARDING_KEY, "true");
                  setShowOnboarding(false);
                }}
                onReopen={() => setShowOnboarding(true)}
              />
            </div>
          </div>
          <p className="text-lg text-neutral-900">Theo dõi các mốc học tập đã đạt và mục tiêu tiếp theo.</p>
        </div>

        <button
          type="button"
          onClick={() => setShowCollection(true)}
          className="w-full text-left mb-8 rounded-2xl border-2 p-6 transition-all duration-300 cursor-pointer hover:shadow-lg bg-gradient-to-br from-primary-50 to-accent-50 border-primary-200 hover:border-primary-300"
        >
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">Bộ sưu tập của tôi</h2>
              <p className="text-neutral-900">
                {data ? `${data.summary.earnedCount} / ${data.summary.totalCount} huy hiệu đã mở khóa` : "Đang tải dữ liệu"}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary-700">{data?.summary.earnedCount ?? 0}</div>
              <div className="text-xs text-neutral-700">đã đạt</div>
            </div>
          </div>
          {data && (
            <div className="mt-4">
              <div className="w-full bg-neutral-300 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-primary-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(data.summary.earnedCount / data.summary.totalCount) * 100}%` }}
                />
              </div>
            </div>
          )}
          <p className="mt-3 text-sm text-primary-600 font-medium">Nhấn để xem bộ sưu tập →</p>
        </button>

        <div className="flex flex-wrap justify-center gap-2 mb-8" role="tablist" aria-label="Danh mục huy hiệu">
          {categories.map((category) => (
            <TabButton
              key={category.id}
              active={selectedCategory === category.id}
              onClick={() => setSelectedCategory(category.id)}
            >
              {category.name}
            </TabButton>
          ))}
        </div>

        {/* Filter by status and rarity */}
        <div className="flex flex-wrap justify-center gap-3 mb-6">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}
            className="px-3 py-2 rounded-xl border-2 border-neutral-200 bg-white text-sm font-medium text-neutral-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors min-h-[44px]"
            aria-label="Lọc theo trạng thái"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="earned">Đã mở khóa</option>
            <option value="in-progress">Đang tiến triển</option>
            <option value="unearned">Chưa mở khóa</option>
          </select>
          <select
            value={rarityFilter}
            onChange={(e) => setRarityFilter(e.target.value as typeof rarityFilter)}
            className="px-3 py-2 rounded-xl border-2 border-neutral-200 bg-white text-sm font-medium text-neutral-700 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 transition-colors min-h-[44px]"
            aria-label="Lọc theo độ hiếm"
          >
            <option value="all">Tất cả độ hiếm</option>
            <option value="COMMON">Phổ thông</option>
            <option value="RARE">Hiếm</option>
            <option value="EPIC">Sử thi</option>
            <option value="LEGENDARY">Huyền thoại</option>
            <option value="PERIODIC">Định kỳ</option>
          </select>
        </div>

        {isLoading && <SkeletonCardGrid count={6} />}
        {error && <Card className="border-error-200 text-error-600">{error}</Card>}

        {!isLoading && !error && data && (() => {
          const nextBadge = data.available
            .filter((b) => b.progress !== null && b.progress.current < b.progress.target)
            .sort((a, b) => (b.progress!.current / b.progress!.target) - (a.progress!.current / a.progress!.target))[0];
          if (!nextBadge || !nextBadge.progress) return null;
          const pct = Math.min(100, Math.round((nextBadge.progress.current / nextBadge.progress.target) * 100));
          return (
            <Card className="mb-4 border-2 border-primary-300 bg-gradient-to-br from-primary-50 to-white">
              <h2 className="text-lg font-bold text-neutral-900 mb-3">🎯 Mục tiêu tiếp theo</h2>
              <div className="flex items-center gap-4">
                <BadgeIcon
                  badgeId={nextBadge.id}
                  rarity={nextBadge.rarity as "COMMON" | "RARE" | "EPIC" | "LEGENDARY" | "PERIODIC"}
                  size="md"
                  earned={false}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-neutral-900">{nextBadge.name}</span>
                    <Badge variant={getBadgeVariant(nextBadge.rarity)} size="sm">
                      {localizeBadgeType(nextBadge.rarity)}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-xs text-neutral-900 mb-1">
                    <span>{getProgressMessage(nextBadge.progress.current, nextBadge.progress.target)}</span>
                    <span>{nextBadge.progress.current}/{nextBadge.progress.target}</span>
                  </div>
                  <div className="w-full bg-neutral-300 rounded-full h-2 overflow-hidden">
                    <div className="bg-primary-600 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
            </Card>
          );
        })()}

        {!isLoading && !error && !showCollection && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {badges.map((item, idx) => (
              <div
                key={item.badge.id}
                className="animate-[slide-up_0.4s_ease-out] motion-reduce:animate-none"
                style={{
                  animationDelay: `${idx * 50}ms`,
                  animationFillMode: "backwards",
                }}
              >
                <BadgeCard badge={item.badge} earned={item.earned} />
              </div>
            ))}
          </div>
        )}

        {/* Collection Modal — Shows only earned badges */}
        {showCollection && data && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-neutral-200 bg-gradient-to-r from-primary-50 to-accent-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold text-neutral-900">Bộ sưu tập của tôi</h2>
                    <p className="text-neutral-700 mt-1">
                      {data.summary.earnedCount} / {data.summary.totalCount} huy hiệu đã mở khóa
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowCollection(false)}
                    className="w-10 h-10 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center transition-colors"
                  >
                    <svg className="w-5 h-5 text-neutral-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              {/* Content — Earned badges grid */}
              <div className="p-6 overflow-y-auto max-h-[60vh]">
                {data.earned.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🎯</div>
                    <h3 className="text-xl font-bold text-neutral-900 mb-2">Chưa có huy hiệu nào</h3>
                    <p className="text-neutral-700">Hoàn thành bài luyện tập để mở khóa huy hiệu đầu tiên!</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                    {data.earned.map((badge) => {
                      const rarity = badge.rarity as string;
                      const iconBg: Record<string, string> = {
                        COMMON: "from-blue-100 to-blue-200",
                        RARE: "from-blue-100 to-blue-200",
                        EPIC: "from-purple-100 to-purple-200",
                        LEGENDARY: "from-amber-100 to-amber-200",
                        PERIODIC: "from-emerald-100 to-emerald-200",
                      };
                      return (
                        <div
                          key={badge.id}
                          className="rounded-xl border-2 border-neutral-200 bg-white p-4 text-center hover:shadow-lg transition-all"
                        >
                          <div className={`w-16 h-16 mx-auto mb-3 rounded-xl bg-gradient-to-br ${iconBg[rarity] ?? iconBg.COMMON} flex items-center justify-center`}>
                            <BadgeIcon
                              badgeId={badge.id}
            rarity={badge.rarity as "COMMON" | "RARE" | "EPIC" | "LEGENDARY" | "PERIODIC"}
                              size="md"
                              earned={true}
                            />
                          </div>
                          <h4 className="font-bold text-neutral-900 text-sm mb-1">{badge.name}</h4>
                          <Badge variant={getBadgeVariant(badge.rarity)} size="sm">
                            {RARITY_LABEL[rarity] ?? rarity}
                          </Badge>
                          <div className="mt-3 pt-3 border-t border-neutral-100">
                            <div className="flex items-center justify-center gap-3 text-xs">
                              <Badge variant="success" size="sm">
                                Đã nhận
                              </Badge>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
