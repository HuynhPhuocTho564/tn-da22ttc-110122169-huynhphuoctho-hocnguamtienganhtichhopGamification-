/**
 * AdminSearchInput — Controlled search input with consistent styling.
 *
 * Replaces inline `<input type="search">` patterns across 7 admin pages.
 * State management is the parent's responsibility (controlled component).
 */

import { Search } from "lucide-react";

type AdminSearchInputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  /** Optional id for label association. */
  id?: string;
  /** Optional aria-label. Defaults to placeholder or "Tìm kiếm". */
  "aria-label"?: string;
  className?: string;
};

export default function AdminSearchInput({
  value,
  onChange,
  placeholder = "Tìm kiếm...",
  id,
  "aria-label": ariaLabel,
  className,
}: AdminSearchInputProps) {
  return (
    <div className={className}>
      <label className="sr-only" htmlFor={id}>
        {ariaLabel ?? placeholder}
      </label>
      <div className="relative">
        <Search
          aria-hidden="true"
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500"
        />
        <input
          id={id}
          type="search"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg border border-slate-300 bg-white px-4 py-2 pl-9 text-sm text-slate-900 outline-none transition-colors placeholder:text-slate-600 focus:border-blue-500 focus:ring-4 focus:ring-blue-100"
        />
      </div>
    </div>
  );
}
