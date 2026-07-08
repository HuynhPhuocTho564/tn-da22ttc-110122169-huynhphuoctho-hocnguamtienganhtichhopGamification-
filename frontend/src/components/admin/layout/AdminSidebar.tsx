"use client";

import Link from "next/link";
import { ShieldCheck, X } from "lucide-react";
import { classNames, getInitials } from "./admin-utils";
import type { AdminIdentity, AdminTab, SidebarSection } from "./types";
import DropdownMenu from "./DropdownMenu";
import { gamificationDropdown } from "./gamification-dropdown";

/**
 * Resolve which top-level sidebar item should be highlighted for a given tab.
 *
 * Implements PLAN/ADMIN_DASHBOARD_new.md — two sidebar items are parent
 * containers, so child tabs must roll up to them:
 *   1. "Nội dung" sidebar item id is `map_vowels` (the first map tab); all
 *      4 map tabs map to it so the sidebar item stays highlighted.
 *   2. "Gamification" sidebar item id is `badges` (the first dropdown item);
 *      every gamification dropdown tab maps to it.
 *   3. Legacy tab ids still referenced internally → their current equivalents.
 */
function getSidebarActiveTab(tab: AdminTab): AdminTab {
  // Map tabs → "Nội dung" sidebar item (map_vowels)
  if (["map_vowels", "map_consonants", "map_minimal_pairs", "map_stress_linking"].includes(tab)) {
    return "map_vowels";
  }

  // Gamification dropdown tabs → "Gamification" sidebar item (badges)
  if (
    ["badges", "xp_levels", "gems_economy", "shop_items", "lucky_wheel", "streaks_quests", "leaderboard"].includes(tab)
  ) {
    return "badges";
  }

  return tab;
}

type AdminSidebarProps = {
  activeTab: AdminTab;
  admin: AdminIdentity | undefined;
  filteredSections: SidebarSection[];
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: AdminTab) => void;
};

export default function AdminSidebar({
  activeTab,
  admin,
  filteredSections,
  isOpen,
  onClose,
  onSelectTab,
}: AdminSidebarProps) {
  const adminName = admin?.name ?? "Admin";
  const adminEmail = admin?.email ?? "Quản trị hệ thống";
  const sidebarActiveTab = getSidebarActiveTab(activeTab);

  return (
    <aside
      className={classNames(
        "fixed inset-y-0 left-0 z-50 w-72 border-r border-blue-900 bg-blue-800 text-blue-50 transition-transform duration-200",
        isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
      )}
      aria-label="Admin sidebar"
    >
      <div className="flex h-full flex-col">
        <div className="flex h-14 items-center justify-between border-b border-blue-700 px-4">
          <Link
            href="/admin"
            className="flex min-h-11 items-center gap-3 rounded-md text-sm font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <span className="flex h-9 w-9 items-center justify-center rounded-md bg-white text-blue-800">
              <ShieldCheck aria-hidden="true" className="h-5 w-5" />
            </span>
            <span>LinguaEcho Admin</span>
          </Link>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex h-10 w-10 items-center justify-center rounded-md text-blue-100 hover:bg-blue-700 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-white lg:hidden"
            aria-label="Đóng menu admin"
          >
            <X aria-hidden="true" className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4" aria-label="Module quản trị">
          {filteredSections.length === 0 ? (
            <p className="rounded-md border border-blue-700 px-3 py-4 text-sm text-blue-100">
              Không có module phù hợp.
            </p>
          ) : (
            filteredSections.map((section) => (
              <div key={section.label} className="mb-5">
                <div className="mb-2 px-2 text-xs font-bold uppercase text-blue-100">{section.label}</div>
                <div className="space-y-1">
                  {section.items.map((item) => {
                    const Icon = item.icon;
                    const isActive = sidebarActiveTab === item.id;
                    
                    // Dropdown type: render expandable menu
                    if (item.type === "dropdown") {
                      return (
                        <DropdownMenu
                          key={item.id}
                          title={item.name}
                          icon={Icon}
                          items={gamificationDropdown}
                          activeItem={activeTab}
                          onItemSelect={onSelectTab}
                        />
                      );
                    }

                    // Default & tabs type: render as button
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => onSelectTab(item.id)}
                        aria-current={isActive ? "page" : undefined}
                        className={classNames(
                          "flex min-h-11 w-full items-center gap-3 rounded-md px-3 py-2 text-left text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-white",
                          isActive
                            ? "bg-white text-blue-800"
                            : "text-blue-50 hover:bg-blue-700 hover:text-white",
                        )}
                      >
                        <Icon aria-hidden="true" className="h-5 w-5 shrink-0" />
                        <span className="min-w-0">
                          <span className="block font-semibold">{item.name}</span>
                          <span className={classNames("block truncate text-xs", isActive ? "text-blue-700" : "text-blue-100")}>
                            {item.description}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))
          )}
        </nav>

        <div className="border-t border-blue-700 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-sm font-bold text-blue-800">
              {getInitials(adminName)}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-bold text-white">{adminName}</p>
              <p className="truncate text-xs text-blue-100">{adminEmail}</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
