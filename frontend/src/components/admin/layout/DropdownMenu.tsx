/**
 * DropdownMenu — Expandable dropdown for sidebar "Gamification" section
 *
 * Renders 6 gamification items in expandable menu (like AWS Console).
 * Design: chevron icon, max-height transition, nested items indented.
 */

"use client";

import { ChevronDown, ChevronRight, type LucideIcon } from "lucide-react";
import { useState } from "react";
import { classNames } from "./admin-utils";
import type { AdminTab } from "./types";

type DropdownItem = {
  id: AdminTab;
  name: string;
  icon: LucideIcon;
  description?: string;
};

type DropdownMenuProps = {
  title: string;
  icon: LucideIcon;
  items: DropdownItem[];
  activeItem: AdminTab | null;
  onItemSelect: (id: AdminTab) => void;
};

export default function DropdownMenu({ title, icon: TitleIcon, items, activeItem, onItemSelect }: DropdownMenuProps) {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className="space-y-1">
      {/* Dropdown Header */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={classNames(
          "flex w-full items-center justify-between gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          "text-slate-200 hover:bg-blue-700 hover:text-white"
        )}
      >
        <div className="flex items-center gap-3">
          <TitleIcon className="h-5 w-5" aria-hidden="true" />
          <span>{title}</span>
        </div>
        {isOpen ? (
          <ChevronDown className="h-4 w-4 transition-transform" aria-hidden="true" />
        ) : (
          <ChevronRight className="h-4 w-4 transition-transform" aria-hidden="true" />
        )}
      </button>

      {/* Dropdown Items */}
      {isOpen && (
        <div className="space-y-0.5 pl-3">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = item.id === activeItem;

            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onItemSelect(item.id)}
                className={classNames(
                  "flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left text-sm transition-colors",
                  isActive
                    ? "bg-blue-900 text-white font-medium"
                    : "text-slate-200 hover:bg-blue-700 hover:text-white"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" aria-hidden="true" />
                <div className="flex-1 min-w-0">
                  <div className={classNames("truncate", isActive && "font-medium")}>{item.name}</div>
                  {item.description && (
                    <div className="mt-0.5 text-xs text-slate-300 line-clamp-2">{item.description}</div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
