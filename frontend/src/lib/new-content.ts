/**
 * New content helper — detect bài tập user chưa từng thấy (Task 6.3).
 *
 * Cách tiếp cận: Exercise model không có `createdAt` (plan giả định sai).
 * Dùng localStorage track "đã xem" mỗi exercise — bài nào user chưa từng
 * mở = "MỚI". Persist per-browser, reset khi user xoá localStorage.
 *
 * Lưu ý: đây là heuristic client-side, không phải "tạo trong 7 ngày" thật.
 * Nếu sau này thêm `createdAt` vào schema → chuyển lại sang date-based.
 *
 * @module lib/new-content
 */

const SEEN_KEY_PREFIX = "linguaecho_seen_exercise_";

/** Kiểm tra user đã "thấy" exercise này chưa (client-side, localStorage). */
export function isUnseenExercise(exerciseId: string): boolean {
  if (typeof window === "undefined") return false; // SSR: không có localStorage, ẩn badge
  return localStorage.getItem(`${SEEN_KEY_PREFIX}${exerciseId}`) !== "true";
}

/** Đánh dấu user đã thấy exercise (gọi khi click vào bài hoặc mở card). */
export function markExerciseSeen(exerciseId: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`${SEEN_KEY_PREFIX}${exerciseId}`, "true");
}
