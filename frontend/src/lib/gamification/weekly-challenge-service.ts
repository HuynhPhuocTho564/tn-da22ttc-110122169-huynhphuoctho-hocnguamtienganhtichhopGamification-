/**
 * Weekly Challenge Service
 *
 * DB side-effect layer for weekly challenge progress tracking.
 * Calls pure functions from weekly-challenge-progress.ts for calculation,
 * then persists results via Prisma (maintainable-code: SLAP — separates
 * calculation from persistence).
 *
 * @module gamification/weekly-challenge-service
 */

import { Prisma } from "@prisma/client";
import { getCurrentWeekKey } from "./weekly-challenge";
import {
  calculateChallengeProgress,
  isChallengeComplete,
  type ExerciseResult,
  type UserChallengeContext,
} from "./weekly-challenge-progress";

/**
 * Update weekly challenge progress after an exercise submission.
 * Auto-creates participation if user hasn't viewed the challenge page yet.
 *
 * Called inside the exercise submit transaction.
 */
export async function updateWeeklyChallengeProgress(
  tx: Prisma.TransactionClient,
  userId: string,
  exerciseResult: ExerciseResult,
  userContext: UserChallengeContext,
): Promise<void> {
  const weekKey = getCurrentWeekKey();

  const challenge = await tx.weeklyChallenge.findFirst({
    where: { weekKey },
  });

  if (!challenge) return; // No active challenge this week

  // Find existing participation
  let participation = await tx.weeklyChallengeParticipant.findUnique({
    where: { challengeId_userId: { challengeId: challenge.id, userId } },
  });

  // Auto-create if user hasn't opened weekly challenges page yet
  if (!participation) {
    participation = await tx.weeklyChallengeParticipant.create({
      data: {
        challengeId: challenge.id,
        userId,
        progress: 0,
      },
    });
  }

  // Skip if already completed
  if (participation.completed) return;

  const newProgress = calculateChallengeProgress(
    challenge.targetMetric,
    participation.progress,
    exerciseResult,
    userContext,
  );

  const completed = isChallengeComplete(newProgress, challenge.targetValue);

  await tx.weeklyChallengeParticipant.update({
    where: { id: participation.id },
    data: {
      progress: newProgress,
      completed,
    },
  });
}
