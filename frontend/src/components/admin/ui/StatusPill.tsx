"use client";

import { classNames } from "../layout/admin-utils";

type StatusPillProps = {
  status: string;
};

/**
 * Map a status string to Tailwind pill classes.
 * ACTIVE -> emerald; BANNED/INACTIVE -> rose; anything else -> amber.
 */
function statusClass(status: string) {
  if (status === "ACTIVE") return "border-emerald-200 bg-emerald-50 text-emerald-700";
  if (status === "BANNED" || status === "INACTIVE") return "border-rose-200 bg-rose-50 text-rose-700";
  return "border-amber-200 bg-amber-50 text-amber-800";
}

/**
 * Small status badge used inside tables (e.g. user.status, exercise.status).
 */
export default function StatusPill({ status }: StatusPillProps) {
  return (
    <span className={classNames("inline-flex rounded-full border px-2 py-0.5 text-xs font-bold", statusClass(status))}>
      {status}
    </span>
  );
}
