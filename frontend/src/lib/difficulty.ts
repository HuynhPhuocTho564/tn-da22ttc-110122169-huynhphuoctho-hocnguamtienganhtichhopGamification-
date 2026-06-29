/**
 * Exercise difficulty helper — suy luận độ khó từ tên bài (Task 5.4).
 *
 * Dùng exact Vietnamese keywords thay vì substring matching quá rộng
 * (vd: "de" match "đề"/"để" → sai). Pure function — dễ test.
 *
 * @see maintainable-code: Constants (keywords centralized)
 * @see maintainable-code: Testability (pure function)
 * @see nielsen H2: Match real world (Vietnamese keywords chính xác)
 * @module lib/difficulty
 */

export type DifficultyLevel = "easy" | "medium" | "hard";

export type DifficultyInfo = {
  level: DifficultyLevel;
  label: string;
  /** Tailwind classes cho badge (semantic colors — ui-color-harmony) */
  color: string;
  stars: number;
};

const DIFFICULTY_INFO: Record<DifficultyLevel, DifficultyInfo> = {
  easy: { level: "easy", label: "Dễ", color: "bg-success-100 text-success-700", stars: 1 },
  medium: { level: "medium", label: "Trung bình", color: "bg-warning-100 text-warning-700", stars: 2 },
  hard: { level: "hard", label: "Khó", color: "bg-error-100 text-error-700", stars: 3 },
};

/** Exact keywords — không dùng substring quá rộng như "de"/"kho" */
const EASY_KEYWORDS: readonly string[] = [
  "dễ", "easy", "basic", "cơ bản", "co ban", "nhận diện", "nhập môn", "nhap mon",
];
const HARD_KEYWORDS: readonly string[] = [
  "khó", "hard", "advanced", "nâng cao", "nang cao", "thực chiến", "thuc chien",
];

/**
 * Kiểm tra text có chứa keyword (match theo từ hoặc phrase).
 * Dùng word boundary + phrase matching thay vì substring thuần.
 */
function matchesAnyKeyword(text: string, keywords: readonly string[]): boolean {
  const lower = text.toLowerCase();
  return keywords.some((keyword) => {
    // Match phrase: "dễ" trong "bài dễ nhận diện" → OK
    // Không match: "de" trong "đề kiểm tra" → skip
    if (keyword.length >= 3) {
      return lower.includes(keyword);
    }
    // Keyword ngắn (<3 ký tự, vd "dễ", "khó"): match theo word boundary
    const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return new RegExp(`(^|\\s)${escaped}($|\\s)`).test(lower);
  });
}

/**
 * Suy luận độ khó từ tên bài. Pure function.
 * @example getDifficultyLevel("Bài dễ — nhận diện /ʃ/") → easy
 * @example getDifficultyLevel("Advanced linking practice") → hard
 * @example getDifficultyLevel("Đề kiểm tra cuối kỳ") → medium (không phải easy!)
 */
export function getDifficultyLevel(name: string): DifficultyInfo {
  if (matchesAnyKeyword(name, EASY_KEYWORDS)) {
    return DIFFICULTY_INFO.easy;
  }
  if (matchesAnyKeyword(name, HARD_KEYWORDS)) {
    return DIFFICULTY_INFO.hard;
  }
  return DIFFICULTY_INFO.medium;
}
