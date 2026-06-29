import React from "react";

export type BadgeVariant = "default" | "success" | "warning" | "error" | "info";

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  size?: "sm" | "md" | "lg";
  className?: string;
}

/**
 * Badge Component - Hiển thị trạng thái, nhãn
 * Accessibility: Color + text (không chỉ dựa vào màu)
 */
export default function Badge({ 
  children, 
  variant = "default",
  size = "md",
  className = "" 
}: BadgeProps) {
  
  const variantStyles = {
    default: "bg-neutral-100 text-neutral-800 border-neutral-300",
    success: "bg-success-50 text-success-700 border-success-200",
    warning: "bg-warning-50 text-warning-700 border-warning-200",
    error: "bg-error-50 text-error-700 border-error-200",
    info: "bg-primary-50 text-primary-700 border-primary-200"
  };
  
  const sizeStyles = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-3 py-1 text-sm",
    lg: "px-4 py-1.5 text-base"
  };
  
  return (
    <span className={`inline-flex items-center font-semibold rounded-full border ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}>
      {children}
    </span>
  );
}
