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
  newGems?: number;
};

const SEGMENT_COLORS: Array<{ fill: string; text: string }> = [
  { fill: "#6366F1", text: "#EEF2FF" }, // indigo
  { fill: "#F59E0B", text: "#FFFBEB" }, // amber
  { fill: "#10B981", text: "#ECFDF5" }, // emerald
  { fill: "#A78BFA", text: "#F5F3FF" }, // violet
  { fill: "#F472B6", text: "#FDF2F8" }, // pink
  { fill: "#38BDF8", text: "#F0F9FF" }, // sky
  { fill: "#FB923C", text: "#FFF7ED" }, // orange
  { fill: "#FBBF24", text: "#FEFCE8" }, // amber light (JACKPOT)
];

const JACKPOT_INDEX = 7;

export default function SpinWheel() {
  const { emit } = useRewardEvents();
  const [spinning, setSpinning] = useState(false);
  const [result, setResult] = useState<SpinResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [canSpinToday, setCanSpinToday] = useState(true);
  const [rotation, setRotation] = useState(0);
  const [winningIndex, setWinningIndex] = useState<number | null>(null);
  const wheelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check server for actual spin status (more reliable than sessionStorage)
    const checkSpinStatus = async () => {
      try {
        const res = await fetch("/api/spin-wheel/status");
        if (res.ok) {
          const data = await res.json();
          if (data.hasSpunToday) {
            setCanSpinToday(false);
          }
        }
      } catch {
        // Fallback to sessionStorage if API fails
        const lastSpin = sessionStorage.getItem("lastSpinDate");
        if (lastSpin) {
          const today = new Date().toDateString();
          if (lastSpin === today) {
            setCanSpinToday(false);
          }
        }
      }
    };
    checkSpinStatus();
  }, []);

  const handleSpin = useCallback(
    async (buySpin = false) => {
      if (spinning) return;
      setSpinning(true);
      setError(null);
      setResult(null);
      setWinningIndex(null);

      try {
        const res = await fetch("/api/spin-wheel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ buySpin }),
        });
        const payload = await res.json();

        if (!payload.success) {
          setError(payload.error?.message ?? "Không thể quay");
          // If already spun today, update state so UI shows buy option
          if (payload.error?.code === "ALREADY_SPUN_TODAY") {
            setCanSpinToday(false);
            sessionStorage.setItem("lastSpinDate", new Date().toDateString());
          }
          setSpinning(false);
          return;
        }

        const { prize, rotationDegrees, newGems } = payload.data as SpinResult & { newGems?: number };
        setResult({ prize, rotationDegrees });
        setRotation((prev) => prev + rotationDegrees);

        // Update navbar diamonds display
        if (typeof newGems === "number") {
          window.dispatchEvent(new CustomEvent("gems-updated", { detail: { gems: newGems } }));
        }

        if (!buySpin) {
          setCanSpinToday(false);
          sessionStorage.setItem("lastSpinDate", new Date().toDateString());
        }

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

          const finalRotation = rotation + rotationDegrees;
          const normalizedRotation = ((finalRotation % 360) + 360) % 360;
          const winnerIdx = Math.round((360 - normalizedRotation) / 45) % 8;
          setWinningIndex(winnerIdx);

          confetti({
            particleCount: 100,
            spread: 70,
            origin: { x: 0.5, y: 0.55 },
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

  return (
    <section
      aria-labelledby="spinwheel-heading"
      className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"
    >
      {/* ═══ Header ═══ */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-2xl" aria-hidden>🎡</span>
            <div>
              <h3 id="spinwheel-heading" className="text-lg font-bold text-white">
                Vòng Quay May Mắn
              </h3>
              <p className="text-xs text-blue-100">
                Nhận Diamonds, EXP, Bùa Đóng Băng
              </p>
            </div>
          </div>
          {canSpinToday && !spinning ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-green-300" aria-hidden />
              Miễn phí
            </span>
          ) : !spinning ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-bold text-blue-200">
              Đã dùng lượt
            </span>
          ) : null}
        </div>
      </div>

      {/* ═══ Wheel Area ═══ */}
      <div className="relative flex flex-col items-center px-5 pt-8 pb-6">
        {/* Pointer */}
        <div className="absolute top-6 left-1/2 z-20 -translate-x-1/2" aria-hidden="true">
          <svg width="28" height="24" viewBox="0 0 28 24" fill="none">
            <path d="M14 24L0 0H28L14 24Z" fill="#DC2626" />
            <path d="M14 20L4 0H24L14 20Z" fill="#EF4444" />
          </svg>
        </div>

        {/* Wheel */}
        <div
          ref={wheelRef}
          className="relative h-72 w-72 rounded-full shadow-[0_0_0_6px_#e2e8f0,0_0_0_10px_#ffffff,0_8px_30px_rgba(0,0,0,0.15)]"
        >
          <svg
            viewBox="0 0 200 200"
            className="absolute inset-0 rounded-full"
            style={{
              transform: `rotate(${rotation}deg)`,
              transition: spinning
                ? "transform 4s cubic-bezier(0.1, 0.7, 0.1, 1)"
                : "none",
            }}
          >
            {SPIN_WHEEL_PRIZES.map((prize, i) => {
              const startAngle = (i * Math.PI) / 4;
              const endAngle = ((i + 1) * Math.PI) / 4;
              const midAngle = startAngle + Math.PI / 8;
              const x1 = 100 + 98 * Math.sin(startAngle);
              const y1 = 100 - 98 * Math.cos(startAngle);
              const x2 = 100 + 98 * Math.sin(endAngle);
              const y2 = 100 - 98 * Math.cos(endAngle);
              const tx = 100 + 48 * Math.sin(midAngle);
              const ty = 100 - 48 * Math.cos(midAngle);
              const ix = 100 + 70 * Math.sin(midAngle);
              const iy = 100 - 70 * Math.cos(midAngle);
              const isWinning = winningIndex === i;
              const dimOther = winningIndex !== null && !isWinning;
              const radialDeg = (midAngle * 180) / Math.PI;
              const isJackpot = i === JACKPOT_INDEX;
              const colors = SEGMENT_COLORS[i];

              return (
                <g
                  key={prize.id}
                  style={{
                    opacity: dimOther ? 0.35 : 1,
                    transition: "opacity 0.5s ease",
                  }}
                >
                  <path
                    d={`M 100 100 L ${x1} ${y1} A 98 98 0 0 1 ${x2} ${y2} Z`}
                    fill={colors.fill}
                    stroke="white"
                    strokeWidth="1.5"
                  />
                  {/* Icon — SVG, points toward center */}
                  <g transform={`rotate(${radialDeg} ${ix} ${iy})`}>
                    <PrizeIcon id={prize.id} x={ix} y={iy - 6} />
                  </g>
                  {/* Value — points toward center */}
                  <text
                    x={tx}
                    y={ty + 2}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={isJackpot ? "10" : "9"}
                    fontWeight="bold"
                    fill="white"
                    transform={`rotate(${radialDeg} ${tx} ${ty})`}
                  >
                    {prize.shortLabel}
                  </text>
                  {isJackpot && (
                    <circle
                      cx="100"
                      cy="100"
                      r="97"
                      fill="none"
                      stroke="#FBBF24"
                      strokeWidth="3"
                      strokeDasharray="8 4"
                      opacity="0.5"
                    />
                  )}
                </g>
              );
            })}
          </svg>

          {/* Center knob */}
          <div className="absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2 flex h-12 w-12 items-center justify-center rounded-full border-[3px] border-white bg-gradient-to-br from-indigo-500 to-indigo-700 shadow-lg">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <polygon points="10,1 12.5,7.5 19,7.5 13.5,12 15.5,19 10,14.5 4.5,19 6.5,12 1,7.5 7.5,7.5" fill="#FBBF24" />
            </svg>
          </div>
        </div>

        {/* ═══ Spin Button ═══ */}
        <div className="mt-6 w-full max-w-xs space-y-2">
          <button
            onClick={() => handleSpin(!canSpinToday)}
            disabled={spinning}
            className={`flex h-12 w-full items-center justify-center gap-2 rounded-xl font-bold shadow-md transition-all focus:outline-none focus-visible:ring-4 disabled:cursor-not-allowed disabled:opacity-60 ${
              canSpinToday
                ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-blue-300"
                : "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] focus-visible:ring-amber-300"
            }`}
            aria-label={
              spinning
                ? "Đang quay..."
                : canSpinToday
                  ? "Quay miễn phí"
                  : `Mua lượt quay với ${SPIN_BUY_COST} diamonds`
            }
          >
            {spinning ? (
              <>
                <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Đang quay...
              </>
            ) : canSpinToday ? (
              "🎡 Quay miễn phí"
            ) : (
              <>💎 Quay với {SPIN_BUY_COST} diamonds</>
            )}
          </button>
          {!canSpinToday && !spinning && (
            <p className="text-center text-xs text-amber-600">
              Mất {SPIN_BUY_COST} 💎 để quay thêm
            </p>
          )}
        </div>

        {/* ═══ Result ═══ */}
        {result && !spinning && (
          <div
            className="mt-5 w-full max-w-xs rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-green-50 p-4 text-center shadow-sm animate-[scale-in_0.3s_ease-out] motion-reduce:animate-none"
            role="status"
          >
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-600">
              🎉 Chúc mừng!
            </p>
            <p className="mt-1 text-xl font-black text-emerald-900">
              {result.prize.label}
            </p>
          </div>
        )}

        {/* ═══ Error ═══ */}
        {error && (
          <p
            className="mt-4 w-full max-w-xs rounded-lg bg-red-50 px-3 py-2 text-center text-sm font-medium text-red-700 border border-red-200"
            role="alert"
          >
            {error}
          </p>
        )}
      </div>
    </section>
  );
}

function PrizeIcon({ id, x, y }: { id: string; x: number; y: number }) {
  const s = 8;
  switch (id) {
    case "gems_10":
    case "gems_5":
    case "gems_20":
    case "gems_50":
      return (
        <polygon
          points={`${x},${y - s} ${x + s * 0.6},${y} ${x},${y + s * 0.5} ${x - s * 0.6},${y}`}
          fill="#38BDF8"
          stroke="white"
          strokeWidth="0.8"
        />
      );
    case "xp_100":
      return (
        <polygon
          points={`${x},${y - s} ${x + s * 0.3},${y - s * 0.3} ${x + s},${y - s * 0.3} ${x + s * 0.45},${y + s * 0.15} ${x + s * 0.65},${y + s} ${x},${y + s * 0.4} ${x - s * 0.65},${y + s} ${x - s * 0.45},${y + s * 0.15} ${x - s},${y - s * 0.3} ${x - s * 0.3},${y - s * 0.3}`}
          fill="#FBBF24"
          stroke="white"
          strokeWidth="0.8"
        />
      );
    case "streak_freeze":
      return (
        <g>
          {/* Snowflake: 3 lines crossing at center */}
          <line x1={x} y1={y - s * 0.7} x2={x} y2={y + s * 0.7} stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          <line x1={x - s * 0.6} y1={y - s * 0.35} x2={x + s * 0.6} y2={y + s * 0.35} stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          <line x1={x - s * 0.6} y1={y + s * 0.35} x2={x + s * 0.6} y2={y - s * 0.35} stroke="white" strokeWidth="1.5" strokeLinecap="round" />
          {/* Small dots at tips */}
          <circle cx={x} cy={y - s * 0.7} r="1" fill="white" />
          <circle cx={x} cy={y + s * 0.7} r="1" fill="white" />
          <circle cx={x - s * 0.6} cy={y - s * 0.35} r="1" fill="white" />
          <circle cx={x + s * 0.6} cy={y + s * 0.35} r="1" fill="white" />
        </g>
      );
    case "nothing":
      return (
        <circle cx={x} cy={y} r={s * 0.6} fill="none" stroke="white" strokeWidth="1.2" strokeDasharray="3 2" />
      );
    case "jackpot":
      return (
        <g>
          <polygon
            points={`${x},${y - s} ${x + s * 0.3},${y - s * 0.3} ${x + s},${y - s * 0.3} ${x + s * 0.45},${y + s * 0.15} ${x + s * 0.65},${y + s} ${x},${y + s * 0.4} ${x - s * 0.65},${y + s} ${x - s * 0.45},${y + s * 0.15} ${x - s},${y - s * 0.3} ${x - s * 0.3},${y - s * 0.3}`}
            fill="#FBBF24"
            stroke="#92400E"
            strokeWidth="0.8"
          />
        </g>
      );
    default:
      return null;
  }
}
