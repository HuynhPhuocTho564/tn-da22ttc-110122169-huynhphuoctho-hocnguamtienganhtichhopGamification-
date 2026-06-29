"use client";

import { useEffect, useState } from "react";
import { TIER_DISPLAY, type LeagueTier, isValidTier } from "@/lib/gamification/league";
import { celebrate } from "@/lib/confetti";

/**
 * TierPromotionBanner — Hiện khi user được lên/xuống hạng.
 * Kiểm tra localStorage để tránh hiện trùng.
 * Fetch từ /api/season-transition (GET).
 */
export default function TierPromotionBanner() {
  const [transition, setTransition] = useState<{
    fromTier: string;
    toTier: string;
    action: string;
    gemsEarned: number;
  } | null>(null);

  useEffect(() => {
    async function checkTransition() {
      const seen = localStorage.getItem("linguaecho_transition_seen");
      if (seen) return;

      try {
        const res = await fetch("/api/season-transition");
        const body = await res.json();
        if (body.success && body.data && body.data.action !== "stayed") {
          setTransition(body.data);
          localStorage.setItem("linguaecho_transition_seen", body.data.period);

          // Confetti for promotion
          if (body.data.action === "promoted") {
            setTimeout(() => celebrate(), 300);
          }
        }
      } catch {
        // Silent fail
      }
    }
    checkTransition();
  }, []);

  if (!transition) return null;

  const isPromoted = transition.action === "promoted";
  const fromDisplay = isValidTier(transition.fromTier) ? TIER_DISPLAY[transition.fromTier as LeagueTier] : null;
  const toDisplay = isValidTier(transition.toTier) ? TIER_DISPLAY[transition.toTier as LeagueTier] : null;

  if (!fromDisplay || !toDisplay) return null;

  return (
    <div className="animate-fade-in fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className={`w-full max-w-sm rounded-2xl bg-white p-8 text-center shadow-2xl ${
        isPromoted ? "ring-4 ring-success-300" : "ring-4 ring-error-200"
      }`}>
        {/* Title */}
        <h2 className={`text-2xl font-black ${isPromoted ? "text-success-700" : "text-error-700"}`}>
          {isPromoted ? "🎉 Lên hạng!" : "📉 Xuống hạng"}
        </h2>

        {/* Tier transition visual */}
        <div className="mt-6 flex items-center justify-center gap-4">
          <div className={`rounded-xl border-2 px-4 py-3 ${fromDisplay.badgeClass}`}>
            <span className="text-2xl">{fromDisplay.icon}</span>
            <p className="mt-1 text-sm font-bold">{fromDisplay.name}</p>
          </div>

          <span className="text-2xl font-bold text-neutral-400">→</span>

          <div className={`rounded-xl border-2 px-4 py-3 ${toDisplay.badgeClass} ${
            isPromoted ? "animate-unlock-pop" : ""
          }`}>
            <span className="text-2xl">{toDisplay.icon}</span>
            <p className="mt-1 text-sm font-bold">{toDisplay.name}</p>
          </div>
        </div>

        {/* Diamonds reward */}
        {transition.gemsEarned > 0 && (
          <div className="mt-4 rounded-lg bg-purple-50 px-4 py-3">
            <p className="text-sm font-semibold text-purple-700">
              🎁 Thưởng: <span className="text-lg font-black">+{transition.gemsEarned} 💎</span>
            </p>
          </div>
        )}

        {/* Message */}
        <p className="mt-4 text-sm text-neutral-600">
          {isPromoted
            ? "Xuất sắc! Bạn đã vượt qua đối thủ và tiến lên hạng mới."
            : "Đừng nản lòng! Luyện tập thêm để lấy lại vị trí nhé."}
        </p>

        {/* Close button */}
        <button
          type="button"
          onClick={() => setTransition(null)}
          className={`mt-6 w-full rounded-xl py-3 text-sm font-bold text-white transition hover:opacity-90 ${
            isPromoted
              ? "bg-gradient-to-r from-success-500 to-success-600"
              : "bg-gradient-to-r from-neutral-500 to-neutral-600"
          }`}
        >
          {isPromoted ? "Tuyệt vời! 🎉" : "Tiếp tục cố gắng! 💪"}
        </button>
      </div>
    </div>
  );
}
