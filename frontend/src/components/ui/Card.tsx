import React from "react";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  /** ARIA role cho container (vd. "region", "status", "alert"). */
  role?: React.AriaRole;
  /** Nhãn accessible cho screen reader khi card không có heading rõ ràng. */
  "aria-label"?: string;
  /** Politeness level cho live region update. */
  "aria-live"?: "polite" | "assertive" | "off";
}

/**
 * Card Component - Container với shadow và border
 * HCI: Visual grouping, clear boundaries
 */
export default function Card({
  children,
  className = "",
  padding = "md",
  hover = false,
  role,
  "aria-label": ariaLabel,
  "aria-live": ariaLive,
}: CardProps) {

  const paddingStyles = {
    none: "",
    sm: "p-4",
    md: "p-6",
    lg: "p-8"
  };

  const hoverStyle = hover ? "hover:shadow-2xl hover:shadow-primary-400/40 hover:border-primary-400 hover:scale-[1.02] duration-300" : "";

  return (
    <div
      role={role}
      aria-label={ariaLabel}
      aria-live={ariaLive}
      className={`rounded-2xl border-2 border-primary-300/50 bg-white shadow-lg shadow-primary-200/30 transition-all ${paddingStyles[padding]} ${hoverStyle} ${className}`}
    >
      {children}
    </div>
  );
}
