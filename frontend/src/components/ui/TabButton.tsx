"use client";

import { ButtonHTMLAttributes, forwardRef } from "react";

export interface TabButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  active: boolean;
  count?: number;
  icon?: React.ReactNode;
}

export const TabButton = forwardRef<HTMLButtonElement, TabButtonProps>(
  ({ active, count, icon, children, className = "", ...rest }, ref) => (
    <button
      ref={ref}
      type="button"
      role="tab"
      aria-selected={active}
      className={[
        "inline-flex items-center gap-2 px-4 py-2.5 min-h-[44px] rounded-lg font-medium",
        "transition-all duration-200 active:scale-[0.97]",
        "focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/30",
        active
          ? "bg-primary-100 text-primary-700 shadow-sm"
          : "bg-transparent text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900",
        className,
      ].join(" ")}
      {...rest}
    >
      {icon}
      <span>{children}</span>
      {count !== undefined && (
        <span
          className={[
            "ml-1 px-2 py-0.5 text-xs rounded-full",
            active ? "bg-primary-200 text-primary-800" : "bg-neutral-200 text-neutral-700",
          ].join(" ")}
        >
          {count}
        </span>
      )}
    </button>
  ),
);
TabButton.displayName = "TabButton";
