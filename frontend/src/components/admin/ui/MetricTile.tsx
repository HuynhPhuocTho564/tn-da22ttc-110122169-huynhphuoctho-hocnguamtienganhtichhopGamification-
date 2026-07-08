"use client";

import type { LucideIcon } from "lucide-react";
import { classNames } from "../layout/admin-utils";
import { TONE_CLASSES, type Tone } from "../layout/tone-classes";

type MetricTileProps = {
  icon: LucideIcon;
  label: string;
  value: number | string;
  hint: string;
  tone: Tone;
};

/**
 * Compact metric card (icon + label + value + hint) with tone-based coloring.
 * Used on the Overview dashboard.
 */
export default function MetricTile({ icon: Icon, label, value, hint, tone }: MetricTileProps) {
  const toneClass = TONE_CLASSES[tone];

  return (
    <div className={classNames("rounded-lg border p-4 shadow-sm", toneClass.tile)}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <dt className="text-xs font-bold uppercase text-slate-600">{label}</dt>
          <dd className="mt-2 text-2xl font-bold text-slate-950">{value}</dd>
          <p className="mt-1 text-xs text-slate-600">{hint}</p>
        </div>
        <div className={classNames("flex h-10 w-10 shrink-0 items-center justify-center rounded-md", toneClass.icon)}>
          <Icon aria-hidden="true" className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
