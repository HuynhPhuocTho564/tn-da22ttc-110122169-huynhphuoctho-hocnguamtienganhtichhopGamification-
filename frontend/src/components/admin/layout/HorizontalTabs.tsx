/**
 * HorizontalTabs — Tab bar for "Nội dung (Maps)" section
 *
 * Renders 4 map tabs horizontally (like GitHub Code|Issues|PRs).
 * Design: border-bottom bar, active tab has blue underline, responsive scroll.
 */

import type { LucideIcon } from "lucide-react";
import { classNames } from "./admin-utils";

type Tab = {
  id: string;
  name: string;
  icon: LucideIcon;
};

type HorizontalTabsProps = {
  tabs: Tab[];
  activeTab: string;
  onTabChange: (id: string) => void;
};

export default function HorizontalTabs({ tabs, activeTab, onTabChange }: HorizontalTabsProps) {
  return (
    <div className="border-b border-slate-200 bg-white">
      <nav className="-mb-px flex space-x-8 overflow-x-auto px-6" aria-label="Maps tabs">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = tab.id === activeTab;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onTabChange(tab.id)}
              className={classNames(
                "group inline-flex items-center gap-2 border-b-2 px-1 py-4 text-sm font-medium whitespace-nowrap transition-colors",
                isActive
                  ? "border-blue-600 text-blue-700"
                  : "border-transparent text-slate-600 hover:border-slate-300 hover:text-slate-800"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon
                className={classNames(
                  "h-5 w-5 transition-colors",
                  isActive ? "text-blue-600" : "text-slate-500 group-hover:text-slate-700"
                )}
                aria-hidden="true"
              />
              {tab.name}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
