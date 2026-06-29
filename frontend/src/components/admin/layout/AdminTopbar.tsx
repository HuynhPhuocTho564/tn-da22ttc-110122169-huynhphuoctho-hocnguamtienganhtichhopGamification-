"use client";

import Link from "next/link";
import { Activity, Menu, Search } from "lucide-react";
import { getInitials } from "./admin-utils";
import type { AdminIdentity } from "./types";

type AdminTopbarProps = {
  admin: AdminIdentity | undefined;
  navSearch: string;
  onMenuClick: () => void;
  onNavSearchChange: (value: string) => void;
};

export default function AdminTopbar({
  admin,
  navSearch,
  onMenuClick,
  onNavSearchChange,
}: AdminTopbarProps) {
  const adminName = admin?.name ?? "Admin";

  return (
    <header className="sticky top-0 z-30 border-b border-slate-300 bg-white">
      <div className="flex min-h-14 items-center gap-3 px-4 sm:px-6">
        <button
          type="button"
          onClick={onMenuClick}
          className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500 lg:hidden"
          aria-label="Mở menu admin"
        >
          <Menu aria-hidden="true" className="h-5 w-5" />
        </button>

        <div className="hidden items-center gap-2 text-sm text-slate-600 md:flex">
          <Link href="/dashboard" className="rounded-md px-2 py-2 font-semibold hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500">
            Home
          </Link>
          <Link href="/admin" className="rounded-md px-2 py-2 font-semibold text-slate-900 hover:bg-slate-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-500">
            Admin
          </Link>
        </div>

        <label className="relative ml-auto hidden w-full max-w-md md:block">
          <span className="sr-only">Tìm module quản trị</span>
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
          <input
            value={navSearch}
            onChange={(event) => onNavSearchChange(event.target.value)}
            placeholder="Tìm module quản trị"
            className="h-10 w-full rounded-md border border-slate-300 bg-slate-50 pl-9 pr-3 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-600 focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-100"
          />
        </label>

        <div className="ml-auto flex items-center gap-3 md:ml-0">
          <div className="hidden items-center gap-2 rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-700 sm:flex">
            <Activity aria-hidden="true" className="h-4 w-4" />
            Live DB
          </div>
          <div className="flex items-center gap-2 border-l border-slate-200 pl-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-800 text-xs font-bold text-white">
              {getInitials(adminName)}
            </div>
            <div className="hidden min-w-0 lg:block">
              <p className="truncate text-sm font-bold text-slate-900">{adminName}</p>
              <p className="truncate text-xs text-slate-500">Administrator</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
