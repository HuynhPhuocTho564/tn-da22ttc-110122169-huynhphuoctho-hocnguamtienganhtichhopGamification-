/**
 * Scoring Helpers — On-the-fly stars calculation for /learning_map progression.
 *
 * Rule 60-80-90 (Mastery Curriculum):
 * - Micro level (individual exercise in CampExerciseView, ExerciseSummaryScreen):
 *   Score 90-100 = ⭐⭐⭐ (Excellent)
 *   Score 80-89  = ⭐⭐   (Good)
 *   Score 60-79  = ⭐    (Pass — Intelligible)
 *   Score 0-59   = ☆    (Needs Practice)
 *
 * - Macro level (ProgressRing on island map):
 *   Stars = (count of exercises with bestScore >= 90) / total exercises × 3
 *   100% (tất cả bài con đều 3 sao) = ⭐⭐⭐ (Mastery Island)
 *
 * IMPORTANT: KHÔNG dùng avg(score) === 100 để hiển thị Macro stars.
 * Dùng count(score >= 90) === total. Tôn trọng dung sai 10% Web Speech API.
 *
 * On-the-fly: tính từ bestScore hiện có, KHÔNG lưu DB, KHÔNG cần migration.
 * Backward compat: bestScore 60-69% cũ → auto pass + 1 sao.
 */

/** Thresholds cho stars (điểm tối thiểu để đạt N sao) */
export const STAR_THRESHOLDS = {
  ONE: 60,
  TWO: 80,
  THREE: 90,
} as const;

/** Số sao: 0 = chưa đạt, 1-3 = đạt mức tương ứng */
export type Stars = 0 | 1 | 2 | 3;

/**
 * Trả về số sao (0-3) cho một bài tập dựa trên điểm số.
 * On-the-fly, không cần DB.
 */
export function getStarsFromScore(score: number): Stars {
  if (score >= STAR_THRESHOLDS.THREE) return 3;
  if (score >= STAR_THRESHOLDS.TWO) return 2;
  if (score >= STAR_THRESHOLDS.ONE) return 1;
  return 0;
}

/**
 * Render stars cho UI Micro (CampExerciseView, ExerciseSummaryScreen).
 * - 0 sao: ☆ (empty star) + "Chưa đạt sao"
 * - 1 sao: ⭐ + "1 Sao — Pass"
 * - 2 sao: ⭐⭐ + "2 Sao — Giỏi"
 * - 3 sao: ⭐⭐⭐ + "3 Sao — Hoàn hảo"
 */
export function getStarsDisplay(stars: Stars): {
  emoji: string;
  label: string;
  colorClass: string;
} {
  if (stars === 3) {
    return { emoji: "⭐⭐⭐", label: "3 Sao — Hoàn hảo", colorClass: "text-amber-700" };
  }
  if (stars === 2) {
    return { emoji: "⭐⭐", label: "2 Sao — Giỏi", colorClass: "text-amber-600" };
  }
  if (stars === 1) {
    return { emoji: "⭐", label: "1 Sao — Pass", colorClass: "text-amber-500" };
  }
  return { emoji: "☆", label: "Chưa đạt sao", colorClass: "text-slate-400" };
}

/**
 * 🌟 MASTERY ISLAND RULE (Macro level):
 * Trả về số sao trên ProgressRing của island ngoài lộ trình.
 *
 * KHÔNG dùng avg(score) === 100. Dùng count(score >= 90) === total.
 * Đảm bảo dung sai 10% Web Speech API được tôn trọng.
 *
 * @param countBestScore90Plus Số bài có bestScore >= 90 (3 sao)
 * @param totalExercises Tổng số bài trong island
 * @returns Số sao (0-3) hiển thị trên ProgressRing
 */
export function getIslandMasteryStars(
  countBestScore90Plus: number,
  totalExercises: number
): Stars {
  if (totalExercises === 0) return 0;
  const ratio = countBestScore90Plus / totalExercises;
  if (ratio >= 1) return 3;        // 100% — tất cả bài đều 3 sao
  if (ratio >= 2 / 3) return 2;    // 67-99%
  if (ratio >= 1 / 3) return 1;    // 34-66%
  return 0;                         // 0-33%
}

/**
 * Render stars trên ProgressRing dạng "★★★", "★★☆", "★☆☆", "☆☆☆"
 * (Hiển thị đầy đủ 3 ký tự để dễ đọc, kể cả 0 sao)
 */
export function getMasteryStarsDisplay(stars: Stars): {
  filled: string;
  empty: string;
  display: string;
  colorClass: string;
} {
  const filled = "★";
  const empty = "☆";
  if (stars === 3) {
    return { filled, empty, display: "★★★", colorClass: "text-amber-300" };
  }
  if (stars === 2) {
    return { filled, empty, display: "★★☆", colorClass: "text-amber-400" };
  }
  if (stars === 1) {
    return { filled, empty, display: "★☆☆", colorClass: "text-amber-500" };
  }
  return { filled, empty, display: "☆☆☆", colorClass: "text-white/70" };
}
