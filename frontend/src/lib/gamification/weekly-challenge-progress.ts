/**
 * Weekly Challenge Progress Calculation
 *
 * Pure functions for computing challenge progress based on metric type.
 * Separated from DB side-effects for testability (maintainable-code: cohesion).
 *
 * @module gamification/weekly-challenge-progress
 */

/** Minimum score to count as a "perfect score" for weekly challenges */
export const PERFECT_SCORE_THRESHOLD = 90;

/** Data from a completed exercise — only fields needed for challenge tracking */
export interface ExerciseResult {
  score: number;
}

/** User state relevant to challenge progress */
export interface UserChallengeContext {
  currentStreak: number;
  weeklyXpEarned: number;
}

/**
 * Calculate new progress value for a challenge after an exercise submission.
 * Pure function — no side effects, easily testable.
 *
 * @param metric - The challenge's target metric type
 * @param currentProgress - Current progress value
 * @param exerciseResult - Result from the just-completed exercise
 * @param userContext - User's current streak and weekly EXP total
 * @returns New progress value (may equal currentProgress if metric doesn't apply)
 */
export function calculateChallengeProgress(
  metric: string,
  currentProgress: number,
  exerciseResult: ExerciseResult,
  userContext: UserChallengeContext,
): number {
  switch (metric) {
    case "exercises":
      // Every completed exercise counts +1
      return currentProgress + 1;

    case "perfect_scores":
      // Only exercises scoring >= PERFECT_SCORE_THRESHOLD count
      return exerciseResult.score >= PERFECT_SCORE_THRESHOLD
        ? currentProgress + 1
        : currentProgress;

    case "streak":
      // Streak metric tracks the current streak value directly (not cumulative)
      return Math.max(currentProgress, userContext.currentStreak);

    case "xp_weekly":
      // EXP metric tracks the total weekly EXP (not cumulative per exercise)
      return Math.max(currentProgress, userContext.weeklyXpEarned);

    default:
      return currentProgress;
  }
}

/**
 * Check if a challenge has been completed.
 */
export function isChallengeComplete(
  progress: number,
  targetValue: number,
): boolean {
  return progress >= targetValue;
}
