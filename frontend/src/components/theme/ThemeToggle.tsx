"use client";

import { useTheme } from "./ThemeProvider";

const options = [
 { value: "light" as const, label: "Sáng", icon: "☀" },
 { value: "dark" as const, label: "Tối", icon: "◐" },
 { value: "system" as const, label: "Máy", icon: "⌁" },
];

export default function ThemeToggle({ compact = false }: { compact?: boolean }) {
 const { mode, resolvedTheme, setMode } = useTheme();

 return (
 <div
 className="inline-flex rounded-lg border border-neutral-200 bg-neutral-50 p-1 shadow-sm "
 role="group"
 aria-label={`Giao diện hiện tại: ${resolvedTheme === "dark" ? "tối" : "sáng"}`}
 >
 {options.map((option) => {
 const active = mode === option.value;

 return (
 <button
 key={option.value}
 type="button"
 onClick={() => setMode(option.value)}
 className={`inline-flex min-h-9 items-center justify-center gap-1.5 rounded-md px-2.5 text-xs font-bold transition-colors focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 ${
 active
 ? "bg-white text-primary-700 shadow-sm "
 : "text-neutral-600 hover:bg-white/70 hover:text-neutral-900 "
 }`}
 aria-pressed={active}
 title={`Chuyển sang giao diện ${option.label.toLowerCase()}`}
 >
 <span aria-hidden="true">{option.icon}</span>
 {!compact && <span>{option.label}</span>}
 </button>
 );
 })}
 </div>
 );
}
