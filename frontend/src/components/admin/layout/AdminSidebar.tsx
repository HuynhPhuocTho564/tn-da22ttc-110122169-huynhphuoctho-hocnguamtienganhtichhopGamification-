"use client";

import Link from "next/link";
import { LayoutDashboard, ShieldCheck, X } from "lucide-react";
import { classNames, getInitials } from "./admin-utils";
import type { AdminIdentity, AdminTab, SidebarSection } from "./types";

/**
 * Resolve which top-level sidebar item should be highlighted for a given tab.
 * Groups content sub-tabs (phonemes/words/soundgroups/minimalpairs/sentences)
 * under the "topics" entry, and "questions" under "exercises".
 */
function getSidebarActiveTab(tab: AdminTab): AdminTab {
  if (["phonemes", "words", "soundgroups", "minimalpairs", "sentences"].includes(tab)) return "topics";
  if (tab === "questions") return "exercises";
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
