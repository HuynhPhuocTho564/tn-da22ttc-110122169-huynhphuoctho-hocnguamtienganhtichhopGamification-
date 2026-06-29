"use client";

import React, { useState, useCallback } from "react";

/**
 * DashboardWidgetTabs — gom 5 sidebar widgets thành 3 tab để giảm cognitive load
 * (Nielsen H8 — Aesthetic/Minimalist, Hick's Law — giảm số item visible cùng lúc).
 *
 * Trước: sidebar stack DailyCheckIn + DailyQuests + WeeklyChallenge + SpinWheel +
 *        Recent Badges → scroll dài, overload.
 * Sau:  3 tab (Hôm nay / Thử thách / Phần thưởng), mỗi tab 1-2 widgets liên quan.
 *
 * Component chỉ quản lý tab state (maintainable-code: Single Responsibility).
 * Nội dung từng tab do dashboard page truyền vào qua props.
 *
 * @module gamification/DashboardWidgetTabs
 */

const TABS = [
  { id: "today", label: "Hôm nay", icon: "📅" },
  { id: "challenge", label: "Thử thách", icon: "🏆" },
  { id: "rewards", label: "Phần thưởng", icon: "🎁" },
] as const;

type TabId = (typeof TABS)[number]["id"];

type DashboardWidgetTabsProps = {
  /** Nội dung tab "Hôm nay" — DailyCheckIn + DailyQuestsWidget */
  todayContent: React.ReactNode;
  /** Nội dung tab "Thử thách" — WeeklyChallengeCard */
  challengeContent: React.ReactNode;
  /** Nội dung tab "Phần thưởng" — SpinWheel + Recent Badges */
  rewardsContent: React.ReactNode;
};

export default function DashboardWidgetTabs({
  todayContent,
  challengeContent,
  rewardsContent,
}: DashboardWidgetTabsProps) {
  const [active, setActive] = useState<TabId>("today");

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLDivElement>) => {
      const currentIndex = TABS.findIndex((tab) => tab.id === active);
      let nextIndex: number | null = null;

      if (event.key === "ArrowRight") {
        nextIndex = (currentIndex + 1) % TABS.length;
      } else if (event.key === "ArrowLeft") {
        nextIndex = (currentIndex - 1 + TABS.length) % TABS.length;
      } else if (event.key === "Home") {
        nextIndex = 0;
      } else if (event.key === "End") {
        nextIndex = TABS.length - 1;
      }

      if (nextIndex !== null) {
        event.preventDefault();
        setActive(TABS[nextIndex].id);
        // Di chuyển focus sang tab mới (accessibility — keyboard nav)
        const tabButton = document.getElementById(`widget-tab-${TABS[nextIndex].id}`);
        tabButton?.focus();
      }
    },
    [active],
  );

  const panelContent =
    active === "today"
      ? todayContent
      : active === "challenge"
      ? challengeContent
      : rewardsContent;

  return (
    <div data-tour="widgets">
      {/* Tab list — WAI-ARIA tabs pattern */}
      <div
        role="tablist"
        aria-label="Widget dashboard"
        aria-orientation="horizontal"
        onKeyDown={handleKeyDown}
        className="mb-6 grid grid-cols-3 gap-2"
      >
        {TABS.map((tab) => {
          const isActive = active === tab.id;
          return (
            <button
              key={tab.id}
              id={`widget-tab-${tab.id}`}
              role="tab"
              aria-selected={isActive}
              aria-controls={`widget-panel-${tab.id}`}
              tabIndex={isActive ? 0 : -1}
              onClick={() => setActive(tab.id)}
              className={`inline-flex min-h-[44px] items-center justify-center gap-1.5 rounded-lg px-2 text-xs font-bold transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 sm:text-sm ${
                isActive
                  ? "bg-primary-600 text-white shadow-sm"
                  : "bg-white text-neutral-700 hover:bg-neutral-100 border border-neutral-200"
              }`}
            >
              <span aria-hidden="true">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab panel — ẩn panel không active bằng `hidden` (không render) */}
      <div
        role="tabpanel"
        id={`widget-panel-${active}`}
        aria-labelledby={`widget-tab-${active}`}
        tabIndex={0}
        className="space-y-6 focus:outline-none"
      >
        {panelContent}
      </div>
    </div>
  );
}
