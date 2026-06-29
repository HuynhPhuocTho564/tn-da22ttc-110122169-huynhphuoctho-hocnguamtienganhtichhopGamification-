/**
 * League Zone & Week Countdown — pure helpers cho UI giải đấu.
 *
 * Tách logic zone-rank và countdown ra khỏi component để dễ unit test
 * (skill maintainable-code: KISS, testability, không side effect).
 *
 * Phục vụ THIETKE Micro-Leaderboards:
 *  - Cohort 30 người
 *  - Top 1-3 = Champion (Cup)
 *  - Top 4-7 = Promotion (lên hạng)
 *  - Top 8-23 = Safe (trụ hạng)
 *  - Top 24-30 = Demotion (rớt hạng)
 *
 * @module gamification/league-zone
 */

import {
  COHORT_SIZE,
  TIER_DEMOTION_COUNT,
  TIER_PROMOTION_COUNT,
} from "./league";
import { getWeekPeriod } from "@/lib/period";

// ─── Types ───────────────────────────────────────────────────

export type TierZone = "champion" | "promotion" | "safe" | "demotion";

export interface WeekCountdown {
  daysLeft: number;
  hoursLeft: number;
  minutesLeft: number;
  isLastDay: boolean;
  period: string;
}

// ─── Zone Logic (pure) ──────────────────────────────────────

/**
 * Trả về zone của user dựa trên rank (1-based) và tổng số player trong tier.
 * - rank 1-3 → champion (Podium)
 * - rank 4 → TIER_PROMOTION_COUNT → promotion (lên hạng)
 * - rank > total - TIER_DEMOTION_COUNT → demotion (rớt hạng)
 * - còn lại → safe (trụ hạng)
 *
 * Edge cases:
 * - totalPlayers < TIER_PROMOTION_COUNT: cả bảng đều là "promotion" trừ top 3
 * - totalPlayers < MIN_PLAYERS_FOR_DEMOTION: không có demotion (rank nào cũng safe)
 * - rank < 1: trả "safe" (defensive)
 */
export function getTierZone(rank: number, totalPlayers: number): TierZone {
  if (rank < 1 || totalPlayers < 1) return "safe";

  if (rank <= 3) return "champion";
  if (rank <= TIER_PROMOTION_COUNT) return "promotion";
  if (rank > totalPlayers - TIER_DEMOTION_COUNT) return "demotion";
  return "safe";
}

// ─── Countdown Logic (pure, accepts optional now for testing) ─

/**
 * Tính countdown đến Thứ Hai 00:00 ICT (UTC+7) — lúc giải đấu tuần kết thúc.
 *
 * Cron server-side chạy lúc CN 17:00 UTC = T2 00:00 ICT.
 * Client-side fallback cũng dùng hàm này để hiển thị countdown nhất quán.
 *
 * @param now - thời điểm hiện tại (mặc định new Date()). Inject để test.
 */
export function getWeekCountdown(now: Date = new Date()): WeekCountdown {
  // Target: Thứ Hai 00:00 ICT = Sunday 17:00 UTC của tuần hiện tại.
  // Nếu hôm nay là T2 → Monday tuần sau.
  // Nếu hôm nay là T3-CN → Monday tuần sau.
  const utcDay = now.getUTCDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const utcHour = now.getUTCHours();

  // Số ngày cần cộng thêm để tới Chủ nhật 17:00 UTC:
  // utcDay=0 (CN) 0h → đã qua 17h? +0 ngày nếu <17h, +7 ngày nếu >=17h
  // utcDay=1 (T2) → +6 ngày tới CN
  // utcDay=2 (T3) → +5 ngày
  // ...
  // utcDay=6 (T7) → +1 ngày
  let daysUntilSunday: number;
  if (utcDay === 0) {
    // Đúng 17:00 UTC = deadline → targetMs = now → diffMs = 0 (phải trả 0).
    // Sau 17:00 UTC → đã qua deadline tuần này → nhìn sang tuần sau (+7 ngày).
    daysUntilSunday = utcHour > 17 ? 7 : 0;
  } else {
    daysUntilSunday = 7 - utcDay;
  }

  // Tạo Date cho target: Sunday 17:00 UTC
  const targetMs = Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + daysUntilSunday,
    17,
    0,
    0,
    0,
  );

  const diffMs = targetMs - now.getTime();
  const totalMinutes = Math.max(0, Math.floor(diffMs / 60_000));
  const daysLeft = Math.floor(totalMinutes / (60 * 24));
  const hoursLeft = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutesLeft = totalMinutes % 60;
  const isLastDay = daysLeft === 0 && hoursLeft < 24;

  return {
    daysLeft,
    hoursLeft,
    minutesLeft,
    isLastDay,
    period: getWeekPeriod(now),
  };
}

/**
 * Re-export COHORT_SIZE cho component dùng nhanh (vd: hiển thị "Bảng 30 người").
 */
export { COHORT_SIZE };
