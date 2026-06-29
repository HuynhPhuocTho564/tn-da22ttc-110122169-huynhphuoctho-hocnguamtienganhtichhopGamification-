/**
 * AdminErrorBlock — Inline error/success message block for admin pages.
 *
 * Replaces the inline left-border message pattern that was duplicated
 * across 8+ admin components. Uses the standard rose / emerald palette.
 */

type AdminErrorBlockProps = {
  /** Message to display. If null/undefined, the block does not render. */
  message: string | null | undefined;
  /** Visual variant. Default "error". */
  variant?: "error" | "success";
  /** Optional className for outer wrapper (e.g. margin). */
  className?: string;
};

export default function AdminErrorBlock({
  message,
  variant = "error",
  className,
}: AdminErrorBlockProps) {
  if (!message) return null;

  const classes =
    variant === "success"
      ? "border-l-4 border-emerald-500 bg-emerald-50 p-4"
      : "border-l-4 border-rose-500 bg-rose-50 p-4";

  const textClass = variant === "success" ? "text-emerald-800" : "text-rose-800";

  return (
    <div className={className} role={variant === "error" ? "alert" : "status"}>
      <div className={classes}>
        <p className={`text-sm font-medium ${textClass}`}>{message}</p>
      </div>
    </div>
  );
}
