"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRewardEvents } from "./RewardEventContext";
import ConfettiSystem from "./ConfettiSystem";
import type { RewardEvent } from "@/lib/gamification/types";
import { LEVELUP_AUTO_DISMISS_MS } from "@/lib/gamification/constants";
import { playSfx } from "@/lib/sfx";

/**
 * LevelUpOverlay — Fullscreen celebration when user levels up.
 *
 * Shows "LEVEL UP!" with the new level number, confetti,
 * and a "Tiếp tục" button. Auto-dismisses after LEVELUP_AUTO_DISMISS_MS.
 *
 * Accessibility: role="dialog", aria-modal, focus trap, Esc to close.
 * Respects prefers-reduced-motion.
 */
export default function LevelUpOverlay() {
  const { subscribe } = useRewardEvents();
  const [level, setLevel] = useState<number | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  const dismiss = useCallback(() => {
    setLevel(null);
    setShowConfetti(false);
  }, []);

  // Subscribe to level_up events
  useEffect(() => {
    return subscribe((event: RewardEvent) => {
      if (event.type === "level_up" && event.level) {
        setLevel(event.level);
        setShowConfetti(true);
        // Fire-and-forget: không block UI update bằng await
        playSfx("tada");

        // Focus the button for keyboard accessibility
        setTimeout(() => buttonRef.current?.focus(), 100);
      }
    });
  }, [subscribe]);

  // Auto-dismiss timer
  useEffect(() => {
    if (level === null) return;
    const timer = setTimeout(dismiss, LEVELUP_AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [level, dismiss]);

  // Trap focus + Esc key
  useEffect(() => {
    if (level === null) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        dismiss();
        return;
      }
      // Simple focus trap: keep focus on the button
      if (e.key === "Tab") {
        e.preventDefault();
        buttonRef.current?.focus();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [level, dismiss]);

  if (level === null) return null;

  return (
    <>
      {showConfetti && <ConfettiSystem onComplete={() => setShowConfetti(false)} />}

      <div
        ref={overlayRef}
        className="fixed inset-0 z-[9995] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-label={`Bạn đã lên cấp ${level}`}
        onClick={dismiss}
      >
        <div
          className="relative flex flex-col items-center gap-6 rounded-3xl bg-white px-10 py-12 shadow-2xl animate-[scale-in_0.4s_ease-out] motion-reduce:animate-none"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Decorative glow */}
          <div
            className="absolute -inset-4 -z-10 rounded-3xl opacity-40 blur-2xl motion-reduce:hidden"
            style={{ background: "radial-gradient(circle, #F59E0B 0%, transparent 70%)" }}
            aria-hidden="true"
          />

          <span className="text-6xl" aria-hidden="true">🎉</span>

          <h2 className="text-center text-2xl font-extrabold tracking-wide text-amber-500">
            LÊN CẤP!
          </h2>

          <div className="flex flex-col items-center gap-1">
            <span className="text-7xl font-black text-neutral-900 tabular-nums">
              {level}
            </span>
            <span className="text-sm font-medium text-neutral-500">Cấp độ mới</span>
          </div>

          <button
            ref={buttonRef}
            onClick={dismiss}
            className="mt-2 min-h-11 rounded-xl bg-amber-500 px-8 py-3 text-sm font-bold text-white shadow-md transition-colors hover:bg-amber-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
            aria-label="Tiếp tục"
          >
            Tiếp tục
          </button>
        </div>
      </div>
    </>
  );
}
