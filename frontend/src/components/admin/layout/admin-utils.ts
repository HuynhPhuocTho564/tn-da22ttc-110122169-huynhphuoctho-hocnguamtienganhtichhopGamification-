/**
 * Shared utility helpers for admin layout components.
 */

/**
 * Combine conditional className values into a single space-separated string.
 * Falsy values (false, null, undefined) are dropped.
 */
export function classNames(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(" ");
}

/**
 * Build user initials (up to 2 characters) for avatar fallbacks.
 * Uses first letter of first + last name when available, otherwise the first 2 characters.
 */
export function getInitials(name: string) {
  const parts = name.split(/\s+/).filter(Boolean);
  const initials = parts.length > 1 ? `${parts[0][0]}${parts[parts.length - 1][0]}` : name.slice(0, 2);
  return initials.toLocaleUpperCase("vi-VN") || "AD";
}

/**
 * Format an ISO date string as DD/MM/YYYY (vi-VN locale).
 */
export function formatDate(value: string) {
  return new Intl.DateTimeFormat("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}

/**
 * Compute a percentage (0-100) of `part` over `total`. Returns 0 when total <= 0.
 */
export function percent(part: number, total: number) {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((part / total) * 100));
}

/**
 * Count items whose `status` field equals "ACTIVE".
 */
export function countActive(items: Array<{ status?: string | null }>) {
  return items.filter((item) => item.status === "ACTIVE").length;
}

/**
 * Normalize a user-entered search query for sidebar filtering (lowercase, trimmed, vi-VN).
 */
export function normalizeSearch(value: string) {
  return value.trim().toLocaleLowerCase("vi-VN");
}
