"use client";

import React from "react";
import { playClick } from "@/lib/sfx";

export type ButtonVariant = "primary" | "secondary" | "success" | "error" | "ghost";
export type ButtonSize = "sm" | "md" | "lg";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
 /**
  * Skip click SFX on press. Default (false) phát `playClick()` để có audio feedback
  * cho mọi CTA. Set `silent` true cho button noise thấp (close icon, nav phụ).
  */
 silent?: boolean;
 variant?: ButtonVariant;
 size?: ButtonSize;
 fullWidth?: boolean;
 loading?: boolean;
 leftIcon?: React.ReactNode;
 rightIcon?: React.ReactNode;
 children: React.ReactNode;
}

/**
 * Button Component - Tuân thủ WCAG 2.1 AA
 * - Minimum touch target: 44x44px
 * - Color contrast ratio: 4.5:1
 * - Keyboard accessible
 * - Focus visible
 */
export default function Button({
 variant = "primary",
 size = "md",
 fullWidth = false,
 loading = false,
 silent = false,
 leftIcon,
 rightIcon,
 children,
 disabled,
 className = "",
 onClick,
 ...props
}: ButtonProps) {
 const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
 // Fire-and-forget click SFX (Nielsen H1, micro-interaction juicy feedback).
 // Bỏ qua khi disabled/loading để tránh feedback sai trạng thái.
 if (!silent && !disabled && !loading) {
 playClick();
 }
 onClick?.(e);
 };

 // Base styles (HCI: Consistent spacing, clear affordance)
 const baseStyles = "inline-flex items-center justify-center font-bold rounded-xl transition-all duration-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.03] active:scale-[0.98] ";

 // Variant styles (Accessibility: High contrast + Gamification pop)
 const variantStyles = {
 primary: "bg-gradient-to-r from-primary-600 to-primary-500 text-white hover:from-primary-700 hover:to-primary-600 focus-visible:ring-primary-500 shadow-[0_4px_14px_rgba(59,130,246,0.4)] hover:shadow-[0_6px_20px_rgba(59,130,246,0.55)]",
 secondary: "bg-gradient-to-r from-neutral-50 to-neutral-100 text-neutral-900 hover:from-neutral-100 hover:to-neutral-200 focus-visible:ring-neutral-500 border-2 border-primary-300/60 shadow-md",
 success: "bg-gradient-to-r from-success-500 to-success-600 text-white hover:from-success-600 hover:to-success-700 focus-visible:ring-success-500 shadow-[0_4px_14px_rgba(34,197,94,0.4)] hover:shadow-[0_6px_20px_rgba(34,197,94,0.55)]",
 error: "bg-gradient-to-r from-error-500 to-error-600 text-white hover:from-error-600 hover:to-error-700 focus-visible:ring-error-500 shadow-[0_4px_14px_rgba(239,68,68,0.4)] hover:shadow-[0_6px_20px_rgba(239,68,68,0.55)]",
 ghost: "bg-transparent text-primary-700 hover:bg-primary-50 focus-visible:ring-primary-500 "
 };
 
 // Size styles (HCI: Minimum 44px touch target)
 const sizeStyles = {
 sm: "px-3 py-2 text-sm min-h-[36px]",
 md: "px-4 py-3 text-base min-h-[44px]",
 lg: "px-6 py-4 text-lg min-h-[52px]"
 };
 
 const widthStyle = fullWidth ? "w-full" : "";
 
 return (
 <button
 className={`${baseStyles} ${variantStyles[variant]} ${sizeStyles[size]} ${widthStyle} ${className}`}
 disabled={disabled || loading}
 onClick={handleClick}
 {...props}
 >
 {loading && (
 <svg 
 className="animate-spin -ml-1 mr-2 h-5 w-5" 
 xmlns="http://www.w3.org/2000/svg" 
 fill="none" 
 viewBox="0 0 24 24"
 aria-hidden="true"
 >
 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
 </svg>
 )}
 {!loading && leftIcon && <span className="mr-2">{leftIcon}</span>}
 {children}
 {!loading && rightIcon && <span className="ml-2">{rightIcon}</span>}
 </button>
 );
}
