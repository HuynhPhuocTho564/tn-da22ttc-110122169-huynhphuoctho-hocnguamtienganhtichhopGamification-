"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRewardEvents } from "../effects/RewardEventContext";
import type { MilestoneInfo } from "@/lib/gamification/milestones";

interface MilestonePopupProps {
  /** Milestones available to claim (fetched from API) */
  unclaimed: MilestoneInfo[];
  /** Callback after successful claim */
  onClaimed?: (milestoneId: string) => void;
}

/**
 * MilestonePopup — Shows popup for unclaimed milestone rewards.
 *
 * When there are unclaimed milestones (user reached a level milestone
 * but hasn't claimed the reward), this component shows a claim dialog.
 *
 * Accessibility: role="dialog", focus trap, Esc to dismiss.
 */
export default function MilestonePopup({ unclaimed, onClaimed }: MilestonePopupProps) {
  const { emit } = useRewardEvents();
  const [current, setCurrent] = useState<MilestoneInfo | null>(null);
  const [claiming, setClaiming] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Show the first unclaimed milestone
  useEffect(() => {
    if (unclaimed.length > 0 && !current) {
      setCurrent(unclaimed[0]);
      setTimeout(() => buttonRef.current?.focus(), 100);
    }
  }, [unclaimed, current]);

  const dismiss = useCallback(() => {
    setCurrent(null);
  }, []);

  const handleClaim = useCallback(async () => {
    if (!current) return;
    setClaiming(true);

    try {
      const res = await fetch("/api/milestones/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ milestoneId: current.id }),
      });

      const payload = await res.json();
      if (payload.success) {
        // Emit reward event for celebration effects
        emit({
          type: "diamonds",
          amount: current.gemsReward,
          label: `Cột mốc: +${current.gemsReward} 💎`,
          icon: "💎",
        });
        if (current.badgeName) {
          emit({
            type: "badge_earned",
            badgeName: current.badgeName,
            label: `Huy hiệu: ${current.title}`,
            icon: "🏆",
          });
        }
        onClaimed?.(current.id);
        // Move to next unclaimed or dismiss
        const remaining = unclaimed.filter((m) => m.id !== current.id);
        setCurrent(remaining[0] ?? null);
      }
    } catch {
      // Network error — stay on current popup
    } finally {
      setClaiming(false);
    }
  }, [current, unclaimed, emit, onClaimed]);

  // Esc key dismiss
  useEffect(() => {
    if (!current) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [current, dismiss]);

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-[9992] flex items-center justify-center bg-black/50 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label={`Phần thưởng cột mốc: ${current.title}`}
      onClick={dismiss}
    >
      <div
        className="relative flex flex-col items-center gap-5 rounded-3xl bg-white px-8 py-10 shadow-2xl animate-[scale-in_0.4s_ease-out] motion-reduce:animate-none sm:px-12"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Decorative glow */}
        <div
          className="absolute -inset-4 -z-10 rounded-3xl opacity-30 blur-2xl motion-reduce:hidden"
          style={{ background: "radial-gradient(circle, #8B5CF6 0%, transparent 70%)" }}
          aria-hidden="true"
        />

        <span className="text-5xl" aria-hidden="true">🏅</span>

        <h2 className="text-center text-xl font-extrabold text-purple-600">
          PHẦN THƯỞNG CỘT MỐC
        </h2>

        <div className="flex flex-col items-center gap-1">
          <span className="text-lg font-bold text-neutral-900">
            Cấp {current.level}: {current.title}
          </span>
          <span className="text-sm text-neutral-500">{current.description}</span>
        </div>

        <div className="flex items-center gap-4 text-sm font-semibold">
          <span className="rounded-lg bg-amber-100 px-3 py-1 text-amber-700">
            +{current.gemsReward} 💎
          </span>
          {current.badgeName && (
            <span className="rounded-lg bg-purple-100 px-3 py-1 text-purple-700">
              🏆 Huy hiệu
            </span>
          )}
        </div>

        <div className="flex gap-3 mt-2">
          <button
            onClick={dismiss}
            className="min-h-11 rounded-xl border border-neutral-300 px-6 py-3 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-neutral-300"
            aria-label="Để sau"
          >
            Để sau
          </button>
          <button
            ref={buttonRef}
            onClick={handleClaim}
            disabled={claiming}
            className="min-h-11 rounded-xl bg-purple-600 px-6 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-purple-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-purple-300 disabled:opacity-50"
            aria-label="Nhận thưởng"
          >
            {claiming ? "Đang nhận..." : "Nhận thưởng"}
          </button>
        </div>
      </div>
    </div>
  );
}
