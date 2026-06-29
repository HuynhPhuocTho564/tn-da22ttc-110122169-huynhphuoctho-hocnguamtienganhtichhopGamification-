"use client";

import { classNames } from "./admin-utils";
import type { AdminTab, SidebarItem } from "./types";

type AdminSubTabsProps = {
  activeTab: AdminTab;
  items: Array<Pick<SidebarItem, "id" | "name" | "icon">>;
  onSelectTab: (tab: AdminTab) => void;
};

/**
 * Horizontally-scrollable tab strip used to switch between sub-sections
 * (e.g. Topics vs Phonemes vs Words) inside a top-level admin tab.
 */
export default function AdminSubTabs({ activeTab, items, onSelectTab }: AdminSubTabsProps) {
  return (
    <div className="mb-4 flex gap-2 overflow-x-auto rounded-lg border border-slate-300 bg-white p-2" role="tablist">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;

        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onSelectTab(item.id)}
            className={classNames(
              "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-bold transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500",
              isActive ? "bg-blue-600 text-white" : "text-slate-700 hover:bg-blue-50 hover:text-blue-800",
            )}
          >
            <Icon aria-hidden="true" className="h-4 w-4" />
            {item.name}
          </button>
        );
      })}
    </div>
  );
}
