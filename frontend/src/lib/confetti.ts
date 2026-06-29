// SP2: Confetti wrapper — cô lập canvas-confetti, lazy-import để test được
// prefersReducedMotion trong Node mà không load DOM lib. Đổi particle/lib sau chỉ cần sửa đây.

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true; // SSR / non-browser → skip an toàn
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

// Pháo hoa nhẹ, 3 burst. Chỉ gọi khi exerciseScore >= 80 (gọi trong ExerciseSummaryScreen).
// Lazy import để confetti.ts importable trong Node test (canvas-confetti chạm document).
export type CelebrateOptions = {
  particleCount?: number;
  spread?: number;
};

const DEFAULT_PARTICLE_COUNT = 80;
const DEFAULT_SPREAD = 70;

export function celebrate(options: CelebrateOptions = {}): void {
  const particleCount = options.particleCount ?? DEFAULT_PARTICLE_COUNT;
  const spread = options.spread ?? DEFAULT_SPREAD;
  if (prefersReducedMotion()) return; // tôn trọng reduce-motion
  void import("canvas-confetti").then(({ default: confetti }) => {
    confetti({
      particleCount,
      spread,
      origin: { y: 0.6 },
      colors: ["#10b981", "#3b82f6", "#f59e0b"],
    });
    setTimeout(() => {
      confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0, y: 0.7 } });
    }, 200);
    setTimeout(() => {
      confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1, y: 0.7 } });
    }, 400);
  }).catch((error: unknown) => {
    console.warn("confetti failed:", error);
  });
}
