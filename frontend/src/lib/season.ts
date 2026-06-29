import { getWeekPeriod, getMonthPeriod } from "./period";

/**
 * Season helpers — phát hiện khi season (tuần/tháng) sắp kết thúc
 * và trigger season transition (promotion/demotion + diamonds).
 *
 * @module lib/season
 */

export type SeasonInfo = {
  type: "tuan" | "thang";
  period: string;
};

/**
 * Kiểm tra hiện tại có phải "golden hour" cuối season không.
 * - Tuần: Chủ nhật (day=0) 20-21h
 * - Tháng: ngày cuối tháng 20-21h
 */
export function isSeasonEnding(now = new Date()): SeasonInfo | null {
  const day = now.getDay();
  const hour = now.getHours();

  if (hour < 20 || hour >= 21) return null;

  if (day === 0) {
    return { type: "tuan", period: getWeekPeriod(now) };
  }

  const lastDayOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  if (now.getDate() === lastDayOfMonth) {
    return { type: "thang", period: getMonthPeriod(now) };
  }

  return null;
}

/**
 * Kiểm tra và trigger weekly season transition nếu cần.
 * Gọi khi user mở app — nếu tuần mới và chưa transition → gọi API.
 * Dùng localStorage để tránh gọi trùng.
 *
 * Client-side only — gọi từ layout hoặc dashboard page.
 */
export async function checkAndTriggerTransition(): Promise<void> {
  if (typeof window === "undefined") return;

  const now = new Date();
  const day = now.getDay(); // 0=Sunday
  const hour = now.getHours();

  // Chỉ trigger sau golden hour: Monday trở đi, hoặc Sunday sau 21h
  const isAfterGoldenHour = day >= 1 || (day === 0 && hour >= 21);
  if (!isAfterGoldenHour) return;

  const currentWeek = getWeekPeriod(now);
  const lastTransition = localStorage.getItem("linguaecho_last_transition_week");

  if (lastTransition === currentWeek) return; // Already done this week

  try {
    const res = await fetch("/api/season-transition", { method: "POST" });
    const body = await res.json();
    if (body.success) {
      localStorage.setItem("linguaecho_last_transition_week", currentWeek);
      // Clear the "seen" flag so TierPromotionBanner can show
      localStorage.removeItem("linguaecho_transition_seen");
    }
  } catch {
    // Silent fail — will retry next visit
  }
}
