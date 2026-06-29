"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Badge from "@/components/ui/Badge";
import Card from "@/components/ui/Card";
import { BadgeIcon } from "@/components/gamification/BadgeIcon";
import AchievementShare from "@/components/gamification/AchievementShare";
import { SkeletonCardGrid } from "@/components/ui/Skeleton";
import { TabButton } from "@/components/ui/TabButton";
import { localizeBadgeType, getBadgeVariant } from "@/lib/badges";

type BadgeCategory = "progress" | "skill" | "streak" | "improvement" | "ranking" | "exploration" | "social" | "effort";

type BadgeProgress = {
  current: number;
  target: number;
  unit: string;
} | null;

type EarnedBadge = {
  id: string;
  name: string;
  description: string | null;
  type: string;
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
  type: string;
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
  { id: "improvement", name: "Cải thiện" },
  { id: "ranking", name: "Xếp hạng" },
  { id: "exploration", name: "Khám phá" },
  { id: "social", name: "Cộng đồng" },
  { id: "effort", name: "Nỗ lực" },
];

/** Rarity-based card styles — entire card reflects tier, not just icon */
const CARD_RARITY_STYLES: Record<string, string> = {
  COMMON: "border-neutral-300 bg-gradient-to-br from-white to-neutral-50",
  RARE: "border-purple-400 bg-gradient-to-br from-white via-purple-50/40 to-purple-100/60 shadow-md shadow-purple-100",
  EPIC: "border-amber-400 bg-gradient-to-br from-amber-50 via-orange-50/50 to-amber-100/70 shadow-lg shadow-amber-200/50 ring-1 ring-amber-300",
  LEGENDARY:
    "border-rose-400 bg-gradient-to-br from-rose-50 via-purple-50/50 to-blue-100/60 shadow-lg shadow-rose-200/50 ring-1 ring-rose-400",
  PERIODIC: "border-emerald-400 bg-gradient-to-br from-white via-emerald-50/40 to-emerald-100/60 shadow-md shadow-emerald-100",
};

/**
 * Returns a contextual progress message based on Goal-Gradient theory.
 * Effort increases when user sees they're close to the goal.
 */
function getProgressMessage(current: number, target: number): string {
  const percent = current / target;
  const remaining = target - current;
  const unit = remaining === 1 ? "" : "";
  if (percent >= 1) return "🎉 Đã đạt!";
  if (percent >= 0.8) return `🔥 Gần đạt rồi! Chỉ cần ${remaining} nữa!`;
  if (percent >= 0.5) return "Hơn nửa đường rồi! 🚀";
  if (percent >= 0.3) return "Đang tiến bộ! 💪";
  return "Mới bắt đầu — tiếp tục nào!";
}
const ACCENT_RARITY_STYLES: Record<string, { conditionBg: string; progressBar: string }> = {
  COMMON: { conditionBg: "bg-neutral-100", progressBar: "bg-neutral-400" },
  RARE: { conditionBg: "bg-purple-50", progressBar: "bg-purple-500" },
  EPIC: { conditionBg: "bg-amber-50", progressBar: "bg-amber-500" },
  LEGENDARY: { conditionBg: "bg-rose-50", progressBar: "bg-rose-500" },
  PERIODIC: { conditionBg: "bg-emerald-50", progressBar: "bg-emerald-500" },
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
  const rarity = badge.type as string;
  const cardStyle = CARD_RARITY_STYLES[rarity] ?? CARD_RARITY_STYLES.COMMON;
  const accent = ACCENT_RARITY_STYLES[rarity] ?? ACCENT_RARITY_STYLES.COMMON;

  return (
    <div className={`rounded-2xl border-2 p-5 transition-all duration-300 ${cardStyle} ${earned ? "" : "opacity-70"}`}>
      <div className="flex items-start justify-between gap-4 mb-4">
        <BadgeIcon
          badgeId={badge.id}
          rarity={badge.type as "COMMON" | "RARE" | "EPIC" | "LEGENDARY" | "PERIODIC"}
          size="md"
          earned={earned}
        />
        <Badge variant={getBadgeVariant(badge.type)} size="sm">
          {localizeBadgeType(badge.type)}
        </Badge>
      </div>

      <h3 className="text-xl font-bold text-neutral-900 mb-2">{badge.name}</h3>
      <p className="text-sm text-neutral-600 mb-4">{badge.description}</p>

      <div className={`rounded-lg p-3 mb-4 ${accent.conditionBg}`}>
        <p className="text-xs text-neutral-600">{badge.condition}</p>
      </div>

      {earned && "earnedAt" in badge ? (
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Badge variant="success" size="sm">
              Đã đạt
            </Badge>
            <span className="text-xs text-neutral-500">{new Date(badge.earnedAt).toLocaleDateString("vi-VN")}</span>
          </div>
          <AchievementShare
            variant="compact"
            icon="🏅"
            title={`Tôi vừa đạt huy hiệu "${badge.name}" trên PhatAmEN!`}
            description={badge.description ?? `Huy hiệu ${localizeBadgeType(badge.type)}`}
          />
        </div>
      ) : progress ? (
        <div>
          <div className="flex justify-between text-xs text-neutral-600 mb-1">
            <span>Tiến độ</span>
            <span>
              {progress.current}/{progress.target}
            </span>
          </div>
          <div className="relative w-full bg-neutral-200/60 rounded-full h-2.5 overflow-hidden">
            <div className={`${accent.progressBar} h-full rounded-full transition-all duration-500`} style={{ width: `${progressPercent}%` }} />
            {/* Milestone markers at 50% and 80% */}
            {progressPercent < 100 && progressPercent > 0 && (
              <>
                <div className="absolute top-0 h-full w-px bg-neutral-400/50" style={{ left: "50%" }} title="50%" />
                <div className="absolute top-0 h-full w-px bg-neutral-400/50" style={{ left: "80%" }} title="80%" />
              </>
            )}
          </div>
          <p className="text-xs text-neutral-500 mt-1.5">
            {getProgressMessage(progress.current, progress.target)}
          </p>
        </div>
      ) : (
        <Badge variant="default" size="sm">
          Chưa đạt
        </Badge>
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
        className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-neutral-200 text-neutral-600 hover:bg-neutral-300 transition-colors text-sm font-bold"
        title="Trợ giúp hệ thống huy hiệu"
        aria-label="Trợ giúp hệ thống huy hiệu"
      >
        ?
      </button>
      {show && (
        <Card className="absolute top-12 right-0 z-50 w-80 border-primary-300 shadow-lg">
          <h3 className="font-bold text-neutral-900 mb-2">💡 Hệ thống huy hiệu</h3>
          <ul className="text-sm text-neutral-600 space-y-1.5 mb-3">
            <li>• Mỗi huy hiệu = 1 mục tiêu học tập cụ thể</li>
            <li>• Thanh tiến trình cho biết bạn còn bao xa để đạt</li>
            <li>• Huy hiệu càng hiếm càng khó đạt nhưng càng tự hào!</li>
          </ul>
          <div className="flex gap-2 mb-3 text-xs">
            <span className="px-2 py-0.5 rounded bg-neutral-100 text-neutral-600">Thường</span>
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
  const [data, setData] = useState<BadgesData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showOnboarding, setShowOnboarding] = useState(false);

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

  const badges = useMemo(() => {
    if (!data) return [];

    const allBadges = [
      ...data.earned.map((badge) => ({ badge, earned: true })),
      ...data.available.map((badge) => ({ badge, earned: false })),
    ];

    if (selectedCategory === "all") {
      return allBadges;
    }

    return allBadges.filter((item) => item.badge.category === selectedCategory);
  }, [data, selectedCategory]);

  return (
    <div className="min-h-screen bg-neutral-50 py-12 px-4 sm:px-6 lg:px-8">
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
          <p className="text-lg text-neutral-600">Theo dõi các mốc học tập đã đạt và mục tiêu tiếp theo.</p>
        </div>

        <Card className="mb-8 bg-gradient-to-br from-primary-50 to-accent-50 border-primary-200">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-neutral-900 mb-2">Bộ sưu tập của bạn</h2>
              <p className="text-neutral-600">
                {data ? `${data.summary.earnedCount} / ${data.summary.totalCount} huy hiệu đã mở khóa` : "Đang tải dữ liệu"}
              </p>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-primary-700">{data?.summary.earnedCount ?? 0}</div>
              <div className="text-xs text-neutral-500">đã đạt</div>
            </div>
          </div>
          {data && (
            <div className="mt-4">
              <div className="w-full bg-neutral-200 rounded-full h-3 overflow-hidden">
                <div
                  className="bg-primary-600 h-full rounded-full transition-all duration-500"
                  style={{ width: `${(data.summary.earnedCount / data.summary.totalCount) * 100}%` }}
                />
              </div>
            </div>
          )}
        </Card>

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

        {isLoading && <SkeletonCardGrid count={6} />}
        {error && <Card className="border-error-200 text-error-600">{error}</Card>}

        {/* UX-4: Next badge suggestion — Goal-Gradient effect */}
        {!isLoading && !error && data && (() => {
          const nextBadge = data.available
            .filter((b) => b.progress !== null)
            .sort((a, b) => (b.progress!.current / b.progress!.target) - (a.progress!.current / a.progress!.target))[0];
          if (!nextBadge || !nextBadge.progress) return null;
          const pct = Math.round((nextBadge.progress.current / nextBadge.progress.target) * 100);
          const remaining = nextBadge.progress.target - nextBadge.progress.current;
          return (
            <Card className="mb-8 border-2 border-primary-300 bg-gradient-to-br from-primary-50 to-white">
              <h2 className="text-lg font-bold text-neutral-900 mb-3">🎯 Mục tiêu tiếp theo</h2>
              <div className="flex items-center gap-4">
                <BadgeIcon
                  badgeId={nextBadge.id}
                  rarity={nextBadge.type as "COMMON" | "RARE" | "EPIC" | "LEGENDARY" | "PERIODIC"}
                  size="md"
                  earned={false}
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-neutral-900">{nextBadge.name}</span>
                    <Badge variant={getBadgeVariant(nextBadge.type)} size="sm">
                      {localizeBadgeType(nextBadge.type)}
                    </Badge>
                  </div>
                  <div className="flex justify-between text-xs text-neutral-600 mb-1">
                    <span>{getProgressMessage(nextBadge.progress.current, nextBadge.progress.target)}</span>
                    <span>{nextBadge.progress.current}/{nextBadge.progress.target}</span>
                  </div>
                  <div className="w-full bg-neutral-200/60 rounded-full h-2 overflow-hidden">
                    <div className="bg-primary-500 h-full rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
              <div className="mt-3 text-center">
                <Link
                  href="/exercises"
                  className="inline-block bg-primary-600 text-white font-medium px-6 py-2.5 rounded-xl hover:bg-primary-700 transition-colors min-h-[44px]"
                >
                  🎤 Làm bài tiếp theo →
                </Link>
              </div>
            </Card>
          );
        })()}

        {/* UX-3: Empty state — when user has no badges yet */}
        {!isLoading && !error && data && data.summary.earnedCount === 0 && selectedCategory === "all" && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">🎤</div>
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">
              Bắt đầu hành trình của bạn!
            </h2>
            <p className="text-neutral-600 mb-6 max-w-md mx-auto">
              Hoàn thành bài tập đầu tiên để nhận huy hiệu &quot;Bước đầu phát âm&quot; —
              huy hiệu dễ nhất trong bộ sưu tập!
            </p>
            <Link
              href="/exercises"
              className="inline-block bg-primary-600 text-white font-medium px-6 py-3 rounded-xl hover:bg-primary-700 transition-colors min-h-[44px]"
            >
              🎤 Làm bài đầu tiên →
            </Link>
          </div>
        )}

        {!isLoading && !error && (
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
      </main>
    </div>
  );
}
