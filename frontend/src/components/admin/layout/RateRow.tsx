"use client";

import { classNames } from "./admin-utils";
import { TONE_CLASSES, type Tone } from "./tone-classes";

type RateRowProps = {
  label: string;
  value: number;
  tone: Tone;
};

/**
 * Label + percent label + progress bar row used in the Overview dashboard.
 * Tone controls both the percentage text color and the filled-bar color.
 */
export default function RateRow({ label, value, tone }: RateRowProps) {
  const toneClass = TONE_CLASSES[tone];

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold text-slate-700">{label}</span>
        <span className={classNames("font-bold", toneClass.text)}>{value}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-200">
        <div className={classNames("h-2 rounded-full", toneClass.bar)} style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}
