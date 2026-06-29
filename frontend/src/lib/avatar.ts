/**
 * Avatar URL utility — single source of truth cho DiceBear API.
 *
 * Extracted from 4 files (Navbar, dashboard, leaderboard, PodiumCard)
 * để tuân thủ DRY. Đổi API version 1 chỗ, áp dụng mọi nơi.
 *
 * @see maintainable-code: DRY (trùng thật — cùng intent + cùng logic ở 4 chỗ)
 * @see maintainable-code: Constants (API URL phải là constant)
 */

/** DiceBear API base URL — đổi 1 chỗ khi upgrade version */
const DICEBEAR_BASE_URL = "https://api.dicebear.com/7.x/avataaars/svg";

/**
 * Tạo URL avatar cho user. Ưu tiên avatar tùy chỉnh, fallback DiceBear.
 * @param username - tên user dùng làm seed cho DiceBear
 * @param customUrl - avatar URL tùy chỉnh (nếu user upload hoặc OAuth cung cấp)
 */
export function getAvatarUrl(username: string, customUrl?: string | null): string {
  if (customUrl) return customUrl;
  const seed = encodeURIComponent(username || "default");
  return `${DICEBEAR_BASE_URL}?seed=${seed}`;
}
