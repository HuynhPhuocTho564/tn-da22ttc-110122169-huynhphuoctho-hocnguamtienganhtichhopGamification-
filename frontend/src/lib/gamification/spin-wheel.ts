/**
 * Spin Wheel Logic
 *
 * Prize pool, weight-based selection, and eligibility check.
 *
 * @module gamification/spin-wheel
 */

import { MIN_FULL_SPINS, EXTRA_SPINS_RANGE } from "./constants";

// Prize pool — weights sum to 100 for easy probability reasoning.
// Expected value per spin ≈ 14 diamonds (weighted avg).
// Jackpot (1%) is intentionally rare to create excitement.

export type SpinPrize = {
  id: string;
  /** Human-readable label (kept for aria-label, result copy, logs). */
  label: string;
  /** Short text displayed inside the wheel slice (e.g. "10", "100", "—"). */
  shortLabel: string;
  /** Emoji icon displayed above the shortLabel inside the wheel slice. */
  icon: string;
  weight: number;
  value: { gems?: number; xp?: number; streakFreezes?: number };
  /** Angle in degrees for the wheel (360 / totalPrizes * index) */
  angle: number;
};

export const SPIN_WHEEL_PRIZES: SpinPrize[] = [
  { id: "gems_10", label: "10 💎", shortLabel: "10", icon: "💎", weight: 25, value: { gems: 10 }, angle: 0 },
  { id: "xp_100", label: "100 EXP", shortLabel: "100", icon: "⭐", weight: 20, value: { xp: 100 }, angle: 45 },
  { id: "gems_5", label: "5 💎", shortLabel: "5", icon: "💎", weight: 15, value: { gems: 5 }, angle: 90 },
  { id: "streak_freeze", label: "Bùa Đóng Băng", shortLabel: "1", icon: "🛡️", weight: 15, value: { streakFreezes: 1 }, angle: 135 },
  { id: "gems_20", label: "20 💎", shortLabel: "20", icon: "💎", weight: 10, value: { gems: 20 }, angle: 180 },
  { id: "gems_50", label: "50 💎", shortLabel: "50", icon: "💎", weight: 10, value: { gems: 50 }, angle: 225 },
  { id: "nothing", label: "Hên xui!", shortLabel: "—", icon: "😅", weight: 4, value: {}, angle: 270 },
  { id: "jackpot", label: "JACKPOT 100💎", shortLabel: "100", icon: "🏆", weight: 1, value: { gems: 100 }, angle: 315 },
];

const TOTAL_WEIGHT = SPIN_WHEEL_PRIZES.reduce((sum, p) => sum + p.weight, 0);

/** Minimum streak required to earn a spin */
export const SPIN_ELIGIBLE_STREAK = 3;

/** Diamond cost to buy an extra spin (bypasses streak/daily limit) */
export const SPIN_BUY_COST = 15;

/**
 * Check if user is eligible to spin the wheel.
 * Requires streak >= 3 and hasn't spun today.
 */
export function canSpin(
  currentStreak: number,
  lastSpinDate: Date | null,
  today: Date,
): boolean {
  if (currentStreak < SPIN_ELIGIBLE_STREAK) return false;

  if (lastSpinDate) {
    const lastDay = new Date(lastSpinDate);
    lastDay.setHours(0, 0, 0, 0);
    const todayDay = new Date(today);
    todayDay.setHours(0, 0, 0, 0);
    if (lastDay.getTime() === todayDay.getTime()) return false;
  }

  return true;
}

/**
 * Spin the wheel and select a prize based on weight.
 * Returns the selected prize and the rotation angle for animation.
 */
export function spinWheel(): { prize: SpinPrize; rotationDegrees: number } {
  const rand = Math.random() * TOTAL_WEIGHT;
  let cumulative = 0;

  for (const prize of SPIN_WHEEL_PRIZES) {
    cumulative += prize.weight;
    if (rand < cumulative) {
      // Calculate rotation: full spins + offset to land on the prize
      const fullSpins = MIN_FULL_SPINS + Math.floor(Math.random() * EXTRA_SPINS_RANGE);
      const targetAngle = 360 - prize.angle; // counter-clockwise to land on prize
      const rotationDegrees = fullSpins * 360 + targetAngle;
      return { prize, rotationDegrees };
    }
  }

  // Fallback (should never reach here)
  return { prize: SPIN_WHEEL_PRIZES[0], rotationDegrees: 360 * 3 };
}
