import React from "react";

interface ProgressBarProps {
  value: number; // 0-100
  max?: number;
  label?: string;
  showPercentage?: boolean;
  color?: "primary" | "success" | "warning" | "error";
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * ProgressBar Component
 * Accessibility: ARIA attributes, visible label
 */
export default function ProgressBar({
  value,
  max = 100,
  label,
  showPercentage = true,
  color = "primary",
  size = "md",
  className = ""
}: ProgressBarProps) {
  
  const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
  
  const colorStyles = {
    primary: "bg-primary-600",
    success: "bg-success-600",
    warning: "bg-warning-500",
    error: "bg-error-500"
  };
  
  const sizeStyles = {
    sm: "h-1.5",
    md: "h-2.5",
    lg: "h-4"
  };
  
  return (
    <div className={className}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-2">
          {label && <span className="text-sm font-medium text-neutral-700">{label}</span>}
          {showPercentage && <span className="text-sm font-bold text-neutral-600">{Math.round(percentage)}%</span>}
        </div>
      )}
      <div 
        className={`w-full bg-neutral-100 rounded-full overflow-hidden ${sizeStyles[size]}`}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || "Progress"}
      >
        <div 
          className={`${colorStyles[color]} ${sizeStyles[size]} rounded-full transition-all duration-500 ease-out`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}
