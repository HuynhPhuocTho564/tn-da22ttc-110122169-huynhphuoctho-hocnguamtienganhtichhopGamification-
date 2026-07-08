/**
 * Gamification Constants
 *
 * Centralized configuration for animation durations, thresholds,
 * and visual parameters used by celebration effects.
 *
 * @module gamification/constants
 */

// === Animation Durations (milliseconds) ===
export const TOAST_DISPLAY_MS = 2500;
export const TOAST_FADE_MS = 300;
export const LEVELUP_AUTO_DISMISS_MS = 5000;
export const QUEST_BANNER_DISPLAY_MS = 4000;
export const CONFETTI_DURATION_MS = 3000;

// === Toast Configuration ===
export const MAX_TOASTS_VISIBLE = 3;

// === Confetti Configuration ===
export const CONFETTI_COUNT_DESKTOP = 80;
export const CONFETTI_COUNT_MOBILE = 30;
export const CONFETTI_COLORS = [
  "#FF6B6B", // red
  "#4ECDC4", // teal
  "#45B7D1", // sky blue
  "#96CEB4", // sage
  "#FFEAA7", // gold
  "#DDA0DD", // plum
  "#FF9FF3", // pink
  "#54A0FF", // blue
];

// === Streak Fire Thresholds ===
// Weekly doubling pattern: 3 days → 1 week → 2 weeks → 1 month
// Each tier unlocks a bigger fire animation to reward consistency.
export const STREAK_FIRE_SMALL = 3;
export const STREAK_FIRE_MEDIUM = 7;
export const STREAK_FIRE_LARGE = 14;
export const STREAK_FIRE_DRAGON = 30;

// === Level Up Colors ===
export const LEVEL_UP_GOLD = "#F59E0B";
export const LEVEL_UP_GLOW = "rgba(245, 158, 11, 0.4)";

// === Time Constants (milliseconds) ===
export const MS_PER_DAY = 86_400_000;
export const MS_PER_HOUR = 3_600_000;

// === Spin Wheel Animation ===
// Must stay in sync: CSS transition duration in SpinWheel.tsx uses this value as seconds
export const SPIN_ANIMATION_MS = 4000;
export const MIN_FULL_SPINS = 3;
export const EXTRA_SPINS_RANGE = 3;

// === Mastery Formula Weights ===
// Completion weighted higher (60%) because consistent practice
// matters more than perfect scores for long-term retention.
export const COMPLETION_WEIGHT = 0.6;
export const SCORE_WEIGHT = 0.4;
export const MAX_EXERCISE_SCORE = 100;

// === Daily Check-in Rewards (Diamonds) ===
// 7-day streak cycle. Diamonds scale gently so shop economy stays balanced.
// Day 7 adds a badge bonus alongside the diamond reward.
// UI (DailyRewardsPopup) reads this array instead of hardcoding values,
// so reward tuning lives in one place (maintainable-code: constants).
export const DAILY_REWARD_GEMS = [
  { day: 1, gems: 5 },
  { day: 2, gems: 8 },
  { day: 3, gems: 10 },
  { day: 4, gems: 12 },
  { day: 5, gems: 15 },
  { day: 6, gems: 20 },
  { day: 7, gems: 25, bonus: "🏆 Huy hiệu" },
] as const;

export const DAILY_REWARD_CYCLE_DAYS = 7;

// === Speech Recording ===
// SpeakWordQuestion auto-stop sau RECORDING_LIMIT_SECONDS giây.
// Phải khớp với setTimeout trong SpeakWordQuestion.startRecording().
export const RECORDING_LIMIT_SECONDS = 3;

// === Shop: EXP Boost ===
// Số bài liên tiếp được nhân EXP khi mua Sách Thần.
export const XP_BOOST_ARTICLES = 3;
// Hệ số nhân EXP khi xp_boost active.
export const XP_BOOST_MULTIPLIER = 1.5;
