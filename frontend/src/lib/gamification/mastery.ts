/**
 * Mastery Percentage Logic
 *
 * Computes mastery % for each sound group based on completion rate
 * and average score. Used by MasteryTree component.
 *
 * @module gamification/mastery
 */

import { COMPLETION_WEIGHT, SCORE_WEIGHT, MAX_EXERCISE_SCORE } from "./constants";

/**
 * Compute mastery percentage for a sound group.
 *
 * Formula: completionWeight * 60% + scoreWeight * 40%
 * - completionWeight = completedExercises / totalExercises
 * - scoreWeight = avgScore / 100
 *
 * @returns number 0-100
 */
export function computeMasteryPercentage(
  completedExercises: number,
  totalExercises: number,
  avgScore: number,
): number {
  if (totalExercises === 0) return 0;

  const completionWeight = Math.min(1, completedExercises / totalExercises);
  const scoreWeight = Math.min(1, avgScore / MAX_EXERCISE_SCORE);

  return Math.round((completionWeight * COMPLETION_WEIGHT + scoreWeight * SCORE_WEIGHT) * 100);
}

/**
 * Get color tier based on mastery percentage.
 */
export function getMasteryTier(percentage: number): "none" | "bronze" | "silver" | "gold" {
  if (percentage >= 100) return "gold";
  if (percentage >= 50) return "silver";
  if (percentage >= 1) return "bronze";
  return "none";
}

export type MasteryNode = {
  soundGroupId: string;
  name: string;
  topicName: string;
  percentage: number;
  tier: "none" | "bronze" | "silver" | "gold";
  totalExercises: number;
  completedExercises: number;
};

export type TopicMastery = {
  topicId: string;
  topicName: string;
  orderIndex: number;
  overallPercentage: number;
  soundGroups: MasteryNode[];
};

// --- Input shapes for buildMasteryData ---

type TopicRow = {
  id: string;
  name: string;
  orderIndex: number;
  soundGroups: Array<{
    id: string;
    name: string;
    subcategory: string | null;
    _count: { questionBankItems: number };
  }>;
};

type AttemptRow = {
  exerciseId: string;
  score: number;
  exercise: {
    map: {
      subcategory: string | null;
      exercises: { id: string }[];
    } | null;
  };
};

/**
 * Build mastery data for all topics from raw Prisma query results.
 * Pure function — no DB access, easy to test.
 */
export function buildMasteryData(
  topics: TopicRow[],
  userAttempts: AttemptRow[],
): TopicMastery[] {
  return topics.map((topic) => {
    const soundGroups: MasteryNode[] = topic.soundGroups.map((sg) => {
      const totalExercises = Math.max(1, sg._count.questionBankItems);

      const groupAttempts = userAttempts.filter(
        (a) => a.exercise.map?.subcategory === sg.subcategory,
      );
      const completedExercises = new Set(groupAttempts.map((a) => a.exerciseId)).size;
      const avgScore =
        groupAttempts.length > 0
          ? groupAttempts.reduce((sum, a) => sum + a.score, 0) / groupAttempts.length
          : 0;

      const percentage = computeMasteryPercentage(completedExercises, totalExercises, avgScore);

      return {
        soundGroupId: sg.id,
        name: sg.name,
        topicName: topic.name,
        percentage,
        tier: getMasteryTier(percentage),
        totalExercises,
        completedExercises,
      };
    });

    const overallPercentage =
      soundGroups.length > 0
        ? Math.round(soundGroups.reduce((sum, sg) => sum + sg.percentage, 0) / soundGroups.length)
        : 0;

    return {
      topicId: topic.id,
      topicName: topic.name,
      orderIndex: topic.orderIndex,
      overallPercentage,
      soundGroups,
    };
  });
}
