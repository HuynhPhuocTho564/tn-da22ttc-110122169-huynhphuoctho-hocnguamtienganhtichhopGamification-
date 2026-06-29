import type { SkillScores } from "@/components/dashboard/SkillRadar";

/**
 * Tính điểm skill radar từ exercise attempts (Task 6.4).
 *
 * Group attempts by topic, tính avg score (best score per exercise,
 * để không bị "luyện nhiều lần điểm thấp" kéo xuống), normalize 0-100.
 *
 * Topic ID → axis mapping (theo lesson-catalog.ts):
 *   topic-1-vowels              → vowels
 *   topic-2-consonants          → consonants
 *   topic-3-minimal-pairs-hard  → difficult
 *   topic-4-stress-connected    → linking
 *
 * @module lib/skill-radar
 */

type AttemptWithTopic = {
  score: number;
  exerciseId: string;
  exercise: { topicId: string };
};

const TOPIC_TO_AXIS: Record<string, keyof SkillScores> = {
  "topic-1-vowels": "vowels",
  "topic-2-consonants": "consonants",
  "topic-3-minimal-pairs-hard": "difficult",
  "topic-4-stress-connected": "linking",
};

/**
 * Tính skill scores từ danh sách attempts.
 * Strategy: best score per exercise, rồi avg per topic.
 * Pure function — dễ test.
 */
export function calculateSkillScores(attempts: AttemptWithTopic[]): SkillScores {
  // Step 1: Best score per exercise (map: exerciseId → bestScore)
  const bestPerExercise = new Map<string, { score: number; topicId: string }>();
  for (const attempt of attempts) {
    if (attempt.score <= 0) continue; // Bỏ qua attempt không có score
    const existing = bestPerExercise.get(attempt.exerciseId);
    if (!existing || attempt.score > existing.score) {
      bestPerExercise.set(attempt.exerciseId, {
        score: attempt.score,
        topicId: attempt.exercise.topicId,
      });
    }
  }

  // Step 2: Group by topic axis
  const buckets: Record<keyof SkillScores, number[]> = {
    vowels: [],
    consonants: [],
    difficult: [],
    linking: [],
  };
  for (const entry of bestPerExercise.values()) {
    const axis = TOPIC_TO_AXIS[entry.topicId];
    if (!axis) continue; // Topic không nằm trong 4 chủ đề
    buckets[axis].push(entry.score);
  }

  // Step 3: Avg per axis, round integer
  const avg = (arr: number[]): number => {
    if (arr.length === 0) return 0;
    return Math.round(arr.reduce((sum, v) => sum + v, 0) / arr.length);
  };

  return {
    vowels: avg(buckets.vowels),
    consonants: avg(buckets.consonants),
    difficult: avg(buckets.difficult),
    linking: avg(buckets.linking),
  };
}
