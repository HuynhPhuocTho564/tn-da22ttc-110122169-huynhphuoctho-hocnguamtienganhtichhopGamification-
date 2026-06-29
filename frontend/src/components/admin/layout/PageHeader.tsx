"use client";

import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { tabMeta } from "./tab-meta";
import type { AdminTab } from "./types";

type PageHeaderProps = {
  activeTab: AdminTab;
};

export default function PageHeader({ activeTab }: PageHeaderProps) {
  const meta = tabMeta[activeTab];

  return (
    <div className="mb-5 border-b border-slate-300 pb-5">
      <div>
        <nav className="mb-2 flex items-center gap-1 text-xs font-semibold text-slate-500" aria-label="Breadcrumb">
          <Link href="/dashboard" className="rounded-sm hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
            Home
          </Link>
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
          <Link href="/admin" className="rounded-sm hover:text-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500">
            Admin
          </Link>
          <ChevronRight aria-hidden="true" className="h-4 w-4" />
          <span className="text-slate-800">{meta.title}</span>
        </nav>
        <h1 className="text-2xl font-semibold text-slate-950">{meta.title}</h1>
        <p className="mt-1 max-w-3xl text-sm text-slate-600">{meta.description}</p>
      </div>
    </div>
  );
}
