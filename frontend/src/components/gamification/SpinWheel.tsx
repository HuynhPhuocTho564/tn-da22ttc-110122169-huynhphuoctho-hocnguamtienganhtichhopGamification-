"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import confetti from "canvas-confetti";
import { SPIN_WHEEL_PRIZES } from "@/lib/gamification/spin-wheel";
import { SPIN_ANIMATION_MS } from "@/lib/gamification/constants";
import { SPIN_BUY_COST } from "@/lib/gamification/spin-wheel";
import { useRewardEvents } from "./effects/RewardEventContext";

type SpinResult = {
  prize: {
    id: string;
    label: string;
    value: { gems?: number; xp?: number; streakFreezes?: number };
  };
  rotationDegrees: number;
};

/**
 * SpinWheel — Vòng quay may mắn.
 *
 * Game-UI redesign 2026-06-28 (SVG + 3D + realistic physics + dim/confetti):
 *  - Rendering: SVG `<path>` slices (viewBox 0 0 200 200) thay cho clipPath polygon.
 *  - Polar math: i*45deg start, (i+1)*45deg end, midAngle cho content ở radius 60.
 *  - Icon + shortLabel counter-rotated để giữ ngang khi slice nghiêng.
 *  - 3D layering: outer border-slate-100 (8px) + shadow-2xl, knob với shadow-inner.
 *  - Spin physics: 4s cubic-bezier(0.1, 0.7, 0.1, 1) — easeOut giả lập ma sát.
 *  - Celebration: winning slice highlight (other slices opacity-40) + canvas-confetti.
 *  - Theme preserved: alternating slate-100 / blue-100 + JACKPOT amber (Von Restorff).
 *  - A11y: aria-label cho buttons, role="status" cho result, aria-hidden cho slice icons.
 */
export default function SpinWheel() {
  const { emit } = useRewardEvents();
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [canSpinToday, setCanSpinToday] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [winningIndex, setWinningIndex] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  // Check if already spun today on mount
  useEffect(() => {
    const lastSpin = sessionStorage.getItem("lastSpinDate");
    if (lastSpin) {
      const today = new Date().toDateString();
      if (lastSpin === today) {
        setCanSpinToday(false);
      }
    }
  }, []);

  const handleSpin = useCallback(
    async (buySpin = false) => {
      if (spinning) return;
      setSpinning(true);
      setError(null);
      setResult(null);
      setWinningIndex(null);
      setShowConfetti(false);

      try {
        const res = await fetch("/api/spin-wheel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ buySpin }),
        });
        const payload = await res.json();

        if (!payload.success) {
          setError(payload.error?.message ?? "Không thể quay");
          setSpinning(false);
          return;
        }

        const { prize, rotationDegrees } = payload.data as SpinResult;
        setResult({ prize, rotationDegrees });
        setRotation((prev) => prev + rotationDegrees);

        // Only block free spin if it was a free spin (not bought)
        if (!buySpin) {
          setCanSpinToday(false);
          sessionStorage.setItem("lastSpinDate", new Date().toDateString());
        }

        // After animation completes, emit reward event + dim winner + confetti
        setTimeout(() => {
          if (prize.value.gems) {
            emit({
              type: "diamonds",
              amount: prize.value.gems,
              label: `Vòng quay: +${prize.value.gems} 💎`,
              icon: "💎",
            });
          } else if (prize.value.xp) {
            emit({
              type: "xp",
              amount: prize.value.xp,
              label: `Vòng quay: +${prize.value.xp} EXP`,
              icon: "⭐",
            });
          } else if (prize.value.streakFreezes) {
            emit({
              type: "streak_milestone",
              label: "Nhận Bùa Đóng Băng!",
              icon: "❄️",
            });
          }

          // Determine winning slice index from final rotation.
          // API computes targetAngle = 360 - prize.angle → pointer at top hits prize.
          // Inverting: prize.angle = (360 - normalizedRotation) % 360.
          // Index in SPIN_WHEEL_PRIZES = angle / 45 (8 slices × 45°).
          const finalRotation = rotation + rotationDegrees;
          const normalizedRotation = ((finalRotation % 360) + 360) % 360;
          const winnerIdx = Math.round((360 - normalizedRotation) / 45) % 8;
          setWinningIndex(winnerIdx);
          setShowConfetti(true);

          // Confetti burst — matches colors used by IslandMapView unlock celebration.
          confetti({
            particleCount: 120,
            spread: 80,
            origin: { x: 0.5, y: 0.6 },
            colors: ["#10b981", "#3b82f6", "#a855f7", "#f97316", "#facc15"],
          });

          setSpinning(false);
        }, SPIN_ANIMATION_MS);
      } catch {
        setError("Lỗi kết nối, thử lại sau");
        setSpinning(false);
      }
    },
    [spinning, emit, rotation],
  );

  const segmentAngle = 360 / SPIN_WHEEL_PRIZES.length;

  return (
    <section
      aria-labelledby="spinwheel-heading"
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      {/* ═══ Header ═══ */}
      <header className="mb-5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <span
            className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 text-xl shadow-md"
            aria-hidden
          >
            🎡
          </span>
          <div>
            <h3
              id="spinwheel-heading"
              className="text-lg font-black text-neutral-900"
            >
              Vòng Quay May Mắn
            </h3>
            <p className="text-xs text-neutral-500">
              Thử vận may — nhận Diamonds, EXP, Bùa Đóng Băng
            </p>
          </div>
        </div>

        {/* Status badge */}
        {canSpinToday && !spinning ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success-100 px-3 py-1 text-xs font-bold text-success-700 border border-success-200">
            <span className="h-1.5 w-1.5 rounded-full bg-success-500" aria-hidden />
            Miễn phí 1 lượt hôm nay
          </span>
        ) : !spinning ? (
          <span className="inline-flex items-center gap-1.5 rounded-full bg-neutral-100 px-3 py-1 text-xs font-bold text-neutral-600 border border-neutral-200">
            Đã dùng lượt hôm nay
          </span>
        ) : null}
      </header>

      {/* ═══ Wheel Container ═══ */}
      <div className="relative mx-auto mb-5 flex items-center justify-center">
        {/* Decorative sparkles */}
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
        >
          <span className="absolute left-[8%] top-[10%] text-lg opacity-40">
            ✨
          </span>
          <span className="absolute right-[8%] top-[15%] text-sm opacity-30">
            ⭐
          </span>
          <span className="absolute left-[15%] bottom-[12%] text-sm opacity-30">
            ✨
          </span>
          <span className="absolute right-[12%] bottom-[8%] text-base opacity-40">
            ⭐
          </span>
        </div>

        {/* Pointer (Kim chỉ) — SVG tam giác ngược, gradient orange→red, drop-shadow */}
        <div
          className="absolute -top-2 left-1/2 z-10 -translate-x-1/2"
          aria-hidden="true"
        >
          <svg
            width="32"
            height="28"
            viewBox="0 0 32 28"
            fill="none"
            style={{ filter: "drop-shadow(0 4px 8px rgba(220, 38, 38, 0.5))" }}
          >
            <path d="M16 28L0 0H32L16 28Z" fill="url(#pointerGradient)" />
            <defs>
              <linearGradient
                id="pointerGradient"
                x1="0"
                y1="0"
                x2="0"
                y2="28"
                gradientUnits="userSpaceOnUse"
              >
                <stop stopColor="#F97316" />
                <stop offset="1" stopColor="#DC2626" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Wheel — outer 3D ring + SVG slices + center knob */}
        <div
          ref={wheelRef}
          className="relative h-80 w-80 rounded-full border-[8px] border-slate-100 shadow-2xl"
        >
          {/* SVG slices — rotates with spin transition */}
          <svg
            viewBox="0 0 200 200"
            className="absolute inset-0"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning
                ? "transform 4s cubic-bezier(0.1, 0.7, 0.1, 1)"
                : "none",
            }}
          >
            {SPIN_WHEEL_PRIZES.map((prize, i) => {
              const startAngle = (i * Math.PI) / 4; // i * 45° in rad
              const endAngle = ((i + 1) * Math.PI) / 4;
              const midAngle = startAngle + Math.PI / 8; // center angle
              const x1 = 100 + 100 * Math.sin(startAngle);
              const y1 = 100 - 100 * Math.cos(startAngle);
              const x2 = 100 + 100 * Math.sin(endAngle);
              const y2 = 100 - 100 * Math.cos(endAngle);
              const tx = 100 + 60 * Math.sin(midAngle);
              const ty = 100 - 60 * Math.cos(midAngle);
              const segFill = getSegmentStyle(prize.id, i).fill;
              const segText = getSegmentStyle(prize.id, i).textClass;
              const isWinning = winningIndex === i;
              const dimOther = winningIndex !== null && !isWinning;
              // Counter-rotate text so icon+label stay horizontal
              const rotationDeg = -(i * 45 + 22.5);

              return (
                <g
                  key={prize.id}
                  style={{
                    opacity: dimOther ? 0.4 : 1,
                    transition: "opacity 0.6s ease",
                  }}
                >
                  {/* Slice path — 3-point polygon: center → start on circle → end on circle */}
                  <path
                    d={`M 100 100 L ${x1} ${y1} L ${x2} ${y2} Z`}
                    className={segFill}
                    stroke="white"
                    strokeWidth="0.5"
                  />
                  {/* Icon */}
                  <text
                    x={tx}
                    y={ty - 3}
                    textAnchor="middle"
                    fontSize="14"
                    transform={`rotate(${rotationDeg} ${tx} ${ty})`}
                  >
                    {prize.icon}
                  </text>
                  {/* Label */}
                  <text
                    x={tx}
                    y={ty + 9}
                    textAnchor="middle"
                    fontSize="7"
                    fontWeight="bold"
                    className={segText}
                    transform={`rotate(${rotationDeg} ${tx} ${ty})`}
                  >
                    {prize.shortLabel}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Center knob — overlay on top of SVG */}
          <div
            className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 rounded-full border-4 border-white bg-blue-600 shadow-inner shadow-blue-900/40 drop-shadow-lg flex items-center justify-center"
            style={{ width: 56, height: 56 }}
            aria-hidden="true"
          >
            <span className="text-2xl">⭐</span>
          </div>
        </div>
      </div>

      {/* ═── Button (unified — auto-detect free or buy) ─── */}
      <div className="space-y-3">
        <button
          onClick={() => handleSpin(!canSpinToday)}
          disabled={spinning}
          className={`min-h-14 w-full rounded-xl py-3.5 text-base font-black shadow-md transition-all focus:outline-none focus-visible:ring-4 disabled:cursor-not-allowed ${
            !canSpinToday && !spinning
              ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-amber-300"
              : "bg-gradient-to-r from-blue-600 to-blue-700 text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-blue-300"
          } disabled:hover:scale-100 disabled:opacity-70`}
          aria-label={
            spinning
              ? "Đang quay..."
              : canSpinToday
                ? "Quay miễn phí hôm nay"
                : `Mua lượt quay với ${SPIN_BUY_COST} diamonds`
          }
        >
          {spinning ? (
            <span className="inline-flex items-center gap-2">
              <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Đang quay...
            </span>
          ) : canSpinToday ? (
            "🎡 Quay miễn phí"
          ) : (
            <>💎 Quay với {SPIN_BUY_COST} diamonds</>
          )}
        </button>
        {/* Subtext: hiển thị rõ chi phí TRƯỚC khi click — user biết sẽ mất bao nhiêu diamonds */}
        {!canSpinToday && !spinning && (
          <p className="text-center text-sm font-medium text-amber-800">
            💎 Bạn sẽ mất <strong>{SPIN_BUY_COST} diamonds</strong> để quay tiếp
          </p>
        )}
      </div>

      {/* ═══ Error ═══ */}
      {error && (
        <p
          className="mt-4 rounded-lg bg-error-50 px-3 py-2 text-center text-sm font-medium text-error-700 border border-error-200"
          role="alert"
        >
          {error}
        </p>
      )}

      {/* ═══ Result ═══ */}
      {result && !spinning && (
        <div
          className="mt-4 rounded-xl border border-cyan-200 bg-gradient-to-br from-cyan-50 via-white to-blue-50 p-4 text-center shadow-sm animate-[scale-in_0.3s_ease-out] motion-reduce:animate-none"
          role="status"
        >
          <p className="text-xs font-bold uppercase tracking-wider text-cyan-700">
            🎉 Bạn nhận được
          </p>
          <p className="mt-1 text-2xl font-black text-cyan-900">
            {result.prize.label}
          </p>
        </div>
      )}

    </section>
  );
}

/**
 * Cohesive alternating palette cho wheel segments (Nielsen + 60-30-10).
 * - JACKPOT: amber đậm (Von Restorff — nổi bật vì tỉ lệ 1%)
 * - Còn lại: alternating slate-100 / blue-100 theo index chẵn/lẻ
 * - Text màu slate-900 để đảm bảo contrast cao trên nền sáng (WCAG AA)
 *
 * NOTE: `fill` returns Tailwind `fill-*` classes (SVG-specific), not `bg-*`,
 * because SVG <path> ignores background-color.
 */
function getSegmentStyle(
  prizeId: string,
  index: number,
  _segmentAngle?: number,
): { fill: string; textClass: string } {
  if (prizeId === "jackpot") {
    return {
      fill: "fill-amber-400",
      textClass: "text-white drop-shadow-sm font-black",
    };
  }
  if (index % 2 === 0) {
    return {
      fill: "fill-slate-100",
      textClass: "text-slate-800 font-bold",
    };
  }
  return {
    fill: "fill-blue-100",
    textClass: "text-slate-800 font-bold",
  };
}
