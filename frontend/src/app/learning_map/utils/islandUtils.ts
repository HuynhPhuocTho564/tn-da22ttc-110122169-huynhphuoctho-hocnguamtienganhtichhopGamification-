/**
 * Island Map Utility Functions — Pure functions, dễ unit test.
 * maintainable-code: mỗi function 1 trách nhiệm, ≤ 50 dòng, no side effects.
 */

import type { TopicUI, LearningMapUI } from "../types/island";
import type { IslandData, CampData, IslandState, CampState, IslandHealth, CampPosition } from "../types/island";
import {
  ISLAND_UNLOCK_THRESHOLD_PERCENT,
  EXERCISE_COMPLETE_SCORE,
  ISLAND_BIOMES,
  ISLAND_ORDER,
  FALLBACK_BIOME,
  CAMP_LAYOUTS,
  STREAK_GLOW_THRESHOLDS,
} from "../constants/islands";

// ─── Progress Calculation ─────────────────────────────────────

/**
 * Tính tổng progress của topic (đảo).
 * Pure function — test không cần mock DB.
 */
export function calculateTopicProgress(topic: TopicUI): {
  completed: number;
  total: number;
  percent: number;
} {
  const total = topic.maps.reduce((sum, map) => sum + map.exercises.length, 0);
  const completed = topic.maps.reduce(
    (sum, map) => sum + map.exercises.filter((ex) => ex.isCompleted).length,
    0,
  );
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, percent };
}

/**
 * Tính progress của 1 map (camp).
 */
export function calculateMapProgress(map: LearningMapUI): {
  completed: number;
  total: number;
  percent: number;
} {
  const total = map.exercises.length;
  const completed = map.exercises.filter((ex) => ex.isCompleted).length;
  const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
  return { completed, total, percent };
}

// ─── State Determination ─────────────────────────────────────

/**
 * Xác định state của đảo.
 * nielsen H1: User luôn biết đảo ở trạng thái nào.
 */
export function determineIslandState(topic: TopicUI, completionPercent: number): IslandState {
  if (topic.isLocked) return "locked";
  if (completionPercent >= 100) return "completed";
  if (completionPercent > 0) return "current";
  return "available";
}

/**
 * Xác định state của camp.
 * Color-blind safe: state dùng icon + text + shape, không chỉ màu.
 */
export function determineCampState(
  map: LearningMapUI,
  islandLocked: boolean,
): CampState {
  if (islandLocked) return "locked";
  if (map.status !== "ACTIVE" || map.exercises.length === 0) return "locked";

  const completed = map.exercises.filter((ex) => ex.isCompleted).length;
  if (completed === map.exercises.length && map.exercises.length > 0) return "completed";
  if (completed > 0) return "current";
  return "available";
}

// ─── Data Transformation ──────────────────────────────────────

/**
 * Chuyển đổi TopicUI[] → IslandData[] cho UI rendering.
 * Pure function — nhận data, trả data, không side effect.
 */
export function transformTopicsToIslands(topics: TopicUI[]): IslandData[] {
  return topics.map((topic, index) => {
    const progress = calculateTopicProgress(topic);
    const positions = CAMP_LAYOUTS[index] ?? CAMP_LAYOUTS[0];

    const camps: CampData[] = topic.maps.map((map, mapIndex) => {
      const mapProgress = calculateMapProgress(map);
      const position: CampPosition = positions[mapIndex] ?? { x: 50, y: 50 };

      return {
        mapId: map.id,
        name: map.name,
        state: determineCampState(map, !!topic.isLocked),
        completionPercent: mapProgress.percent,
        totalExercises: mapProgress.total,
        completedExercises: mapProgress.completed,
        exercises: map.exercises,
        requirement: map.requirement,
        subcategory: map.subcategory,
        status: map.status,
        position,
      };
    });

    return {
      topicId: topic.id,
      name: topic.name,
      description: topic.description ?? "",
      state: determineIslandState(topic, progress.percent),
      completionPercent: progress.percent,
      // Prereq progress was set by page.tsx for topics with an unlock threshold.
      // Preserve it here so the UI can show "🧭 64% → mở" on locked islands.
      prerequisiteCompletionPercent: topic.completionPercent,
      totalCamps: topic.maps.length,
      completedCamps: camps.filter((c) => c.state === "completed").length,
      totalExercises: progress.total,
      completedExercises: progress.completed,
      camps,
      isLocked: !!topic.isLocked,
      prerequisiteName: topic.prerequisiteName,
    };
  });
}

// ─── Biome Lookup ─────────────────────────────────────────────

/**
 * Lấy biome config cho topic ID.
 * Fallback an toàn nếu topic không có config.
 */
export function getBiomeForTopic(topicId: string) {
  return ISLAND_BIOMES[topicId] ?? FALLBACK_BIOME;
}

/**
 * Lấy biome ID cho topic index (để match CAMP_LAYOUTS).
 */
export function getBiomeIdByIndex(index: number): string {
  return ISLAND_ORDER[index] ?? `topic-${index + 1}`;
}

// ─── SVG Path Helpers ─────────────────────────────────────────

/**
 * Tính SVG quadratic bezier path giữa 2 điểm (% coordinates).
 * Pure function — trả SVG path string.
 */
export function calculateCurvedPath(
  from: CampPosition,
  to: CampPosition,
): string {
  const midX = (from.x + to.x) / 2;
  const midY = Math.min(from.y, to.y) - 8; // slight upward curve
  return `M ${from.x} ${from.y} Q ${midX} ${midY} ${to.x} ${to.y}`;
}

// ─── Island Health ────────────────────────────────────────────

/**
 * Xác định "sức khỏe" đảo dựa trên streak & activity.
 * Visual feedback: thriving = nở hoa, dormant = hơi âm u.
 */
export function calculateIslandHealth(
  completionPercent: number,
  streakDays: number,
  daysSinceLastVisit: number,
): IslandHealth {
  if (completionPercent >= 100) return "thriving";
  if (streakDays >= 7 && daysSinceLastVisit <= 2) return "healthy";
  if (daysSinceLastVisit > 7) return "wilting";
  return "dormant";
}

/**
 * CSS classes cho island health visual effects.
 */
export function getIslandHealthClasses(health: IslandHealth): {
  saturation: string;
  overlay: string;
} {
  switch (health) {
    case "thriving":
      return { saturation: "saturate-110", overlay: "" };
    case "healthy":
      return { saturation: "saturate-100", overlay: "" };
    case "wilting":
      return { saturation: "saturate-75", overlay: "bg-neutral-500/10" };
    case "dormant":
      return { saturation: "saturate-50", overlay: "bg-neutral-500/20" };
  }
}

// ─── Glow Level (Character Avatar) ────────────────────────────

/**
 * Xác định glow level dựa trên streak days.
 * Streak càng cao → glow càng sáng → motivation.
 */
export function getStreakGlowLevel(streakDays: number): {
  intensity: number;
  shadowClass: string;
} {
  if (streakDays >= STREAK_GLOW_THRESHOLDS.gold) {
    return { intensity: 3, shadowClass: "shadow-[0_0_20px_rgba(251,191,36,0.8)]" };
  }
  if (streakDays >= STREAK_GLOW_THRESHOLDS.blue) {
    return { intensity: 2, shadowClass: "shadow-[0_0_12px_rgba(59,130,246,0.6)]" };
  }
  if (streakDays >= STREAK_GLOW_THRESHOLDS.green) {
    return { intensity: 1, shadowClass: "shadow-[0_0_8px_rgba(16,185,129,0.4)]" };
  }
  return { intensity: 0, shadowClass: "" };
}

// ─── Overview Stats ───────────────────────────────────────────

/**
 * Tính overview stats cho toàn bộ archipelago.
 */
export function calculateArchipelagoStats(islands: IslandData[]) {
  const totalExercises = islands.reduce((sum, i) => sum + i.totalExercises, 0);
  const completedExercises = islands.reduce((sum, i) => sum + i.completedExercises, 0);
  const totalCamps = islands.reduce((sum, i) => sum + i.totalCamps, 0);
  const completedCamps = islands.reduce((sum, i) => sum + i.completedCamps, 0);
  const completedIslands = islands.filter((i) => i.state === "completed").length;
  const currentIsland = islands.find((i) => i.state === "current");

  return {
    totalExercises,
    completedExercises,
    totalCamps,
    completedCamps,
    totalIslands: islands.length,
    completedIslands,
    currentIslandName: currentIsland?.name ?? "—",
  };
}
