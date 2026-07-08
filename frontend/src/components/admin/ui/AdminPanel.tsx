"use client";

import type { ReactNode } from "react";
import { classNames } from "../layout/admin-utils";

type AdminPanelProps = {
  title: string;
  subtitle?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
};

/**
 * Card-style panel used across the admin dashboard.
 * Header row holds title + optional subtitle and a right-aligned action node.
 */
export default function AdminPanel({ title, subtitle, action, children, className }: AdminPanelProps) {
  return (
    <section className={classNames("rounded-lg border border-slate-300 bg-white shadow-sm", className)}>
      <div className="flex min-h-12 items-start justify-between gap-3 border-b border-slate-200 px-4 py-3">
        <div>
          <h2 className="text-sm font-bold text-slate-900">{title}</h2>
          {subtitle && <p className="mt-1 text-xs text-slate-500">{subtitle}</p>}
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </section>
  );
}
