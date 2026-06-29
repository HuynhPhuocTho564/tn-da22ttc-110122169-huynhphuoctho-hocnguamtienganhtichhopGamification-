/**
 * Tone classes for MetricTile and RateRow components.
 *
 * Each tone maps to Tailwind v4 standard palette colors (blue/emerald/amber/purple)
 * per GIAODIEN guidelines §2.2 Semantic Colors.
 */

export type Tone = "blue" | "emerald" | "amber" | "purple";

export type ToneClasses = {
  tile: string;
  icon: string;
  text: string;
  bar: string;
};

export const TONE_CLASSES: Record<Tone, ToneClasses> = {
  blue: {
    tile: "border-blue-200 bg-blue-50",
    icon: "bg-blue-600 text-white",
    text: "text-blue-700",
    bar: "bg-blue-600",
  },
  emerald: {
    tile: "border-emerald-200 bg-emerald-50",
    icon: "bg-emerald-600 text-white",
    text: "text-emerald-700",
    bar: "bg-emerald-600",
  },
  amber: {
    tile: "border-amber-200 bg-amber-50",
    icon: "bg-amber-500 text-white",
    text: "text-amber-800",
    bar: "bg-amber-500",
  },
  purple: {
    tile: "border-purple-200 bg-purple-50",
    icon: "bg-purple-600 text-white",
    text: "text-purple-700",
    bar: "bg-purple-600",
  },
};
