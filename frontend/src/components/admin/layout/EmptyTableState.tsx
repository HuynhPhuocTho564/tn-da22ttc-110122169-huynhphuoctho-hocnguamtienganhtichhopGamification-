"use client";

import type { ReactNode } from "react";

type EmptyTableStateProps = {
  children: ReactNode;
};

/**
 * Dashed-border placeholder shown inside an AdminPanel when a table has no rows.
 */
export default function EmptyTableState({ children }: EmptyTableStateProps) {
  return (
    <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-600">
      {children}
    </div>
  );
}
