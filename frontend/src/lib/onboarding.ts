/**
 * Onboarding helpers — storage + tour steps constants.
 *
 * Storage dùng localStorage để ghi nhớ user đã xem tour (không hiện lại).
 * TOUR_STEPS là dữ liệu tour, tách khỏi component (maintainable-code: constants
 * không hardcode trong UI).
 *
 * @module lib/onboarding
 */

const ONBOARDING_KEY = "linguaecho_onboarding_complete";

/** Kiểm tra user đã hoàn thành onboarding chưa. Trả true ở SSR (không hiện tour server-side). */
export function hasCompletedOnboarding(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(ONBOARDING_KEY) === "true";
}

/** Đánh dấu user đã hoàn thành onboarding (gọi khi tour kết thúc hoặc skip). */
export function markOnboardingComplete(): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(ONBOARDING_KEY, "true");
}

/** Xóa flag onboarding (dùng cho demo / debug / "xem lại tour"). */
export function resetOnboarding(): void {
  if (typeof window === "undefined") return;
  localStorage.removeItem(ONBOARDING_KEY);
}

export type TourStep = {
  id: string;
  title: string;
  description: string;
  /** CSS selector đến element cần highlight. null = overlay giữa màn hình (welcome). */
  target: string | null;
};

/**
 * 5 bước tour cho user mới (Nielsen H10 — Help & Documentation, contextual).
 * Thứ tự: welcome → stats → continue → learning-map → widgets.
 * target khớp `data-tour` attribute trong dashboard page.
 */
export const TOUR_STEPS: readonly TourStep[] = [
  {
    id: "welcome",
    title: "Chào mừng bạn! 👋",
    description:
      "Hãy cùng khám phá các tính năng chính trong 30 giây. Nhấn 'Tiếp theo' để bắt đầu.",
    target: null,
  },
  {
    id: "stats",
    title: "Theo dõi tiến độ",
    description:
      "Chuỗi ngày học, cấp độ và số bài đã đạt — tất cả ở đây. Duy trì chuỗi để tăng động lực!",
    target: "[data-tour='stats']",
  },
  {
    id: "continue",
    title: "Tiếp tục học",
    description: "Nhấn vào đây để quay lại bài tập gần nhất của bạn.",
    target: "[data-tour='continue-wrapper']",
  },
  {
    id: "suggested",
    title: "Gợi ý hôm nay",
    description:
      "Hoặc thử bài mới — bài tiếp theo bạn chưa hoàn thành. 1 click là vào luyện ngay.",
    target: "[data-tour='suggested']",
  },
  {
    id: "widgets",
    title: "Gamification",
    description:
      "Điểm danh, thử thách tuần, vòng quay may mắn — học vui hơn! Chuyển tab để xem.",
    target: "[data-tour='widgets']",
  },
] as const;
