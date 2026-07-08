"use client";

import { useEffect, useState, useCallback } from "react";
import { useRewardEvents } from "./RewardEventContext";
import type { RewardEvent, ToastEntry } from "@/lib/gamification/types";
import { TOAST_DISPLAY_MS, MAX_TOASTS_VISIBLE } from "@/lib/gamification/constants";
import { playSfx } from "@/lib/sfx";
import { celebrate } from "@/lib/confetti";

/** Map reward event type to icon + color */
function getToastStyle(event: RewardEvent): { icon: string; bgColor: string } {
  switch (event.type) {
    case "xp":
      return { icon: "⭐", bgColor: "bg-emerald-600" };
    case "diamonds":
      return { icon: "💎", bgColor: "bg-amber-500" };
    case "badge_earned":
      return { icon: "🏆", bgColor: "bg-purple-600" };
    case "quest_complete":
      return { icon: "✅", bgColor: "bg-blue-600" };
    case "streak_milestone":
      return { icon: "🔥", bgColor: "bg-orange-500" };
    case "level_up":
      return { icon: "🎯", bgColor: "bg-yellow-500" };
    case "purchase":
      return { icon: "🛍️", bgColor: "bg-emerald-500" };
    default:
      return { icon: "🎉", bgColor: "bg-neutral-700" };
  }
}

let toastIdCounter = 0;

/**
 * RewardToast — Displays toast notifications for reward events.
 *
 * Subscribes to the reward event system and shows toasts in the
 * top-right corner. Supports stacking (max 3 visible at once).
 * Each toast auto-dismisses after TOAST_DISPLAY_MS.
 *
 * WCAG: role="status", aria-live="polite"
 */
export default function RewardToast() {
  const { subscribe } = useRewardEvents();
  const [toasts, setToasts] = useState<ToastEntry[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Subscribe to reward events
  useEffect(() => {
    return subscribe((event: RewardEvent) => {
      // Fire-and-forget SFX + confetti cho badge earned — juicy feedback.
      // Dùng confetti particle count vừa (60) để không giật trên mobile.
      if (event.type === "badge_earned") {
        playSfx("tada");
        celebrate({ particleCount: 60, spread: 70 });
      }

      const { icon, bgColor } = getToastStyle(event);
      const newToast: ToastEntry = {
        id: `toast-${++toastIdCounter}`,
        type: event.type,
        label: event.label,
        icon,
        bgColor,
      };

      setToasts((prev) => {
        const next = [...prev, newToast];
        // Enforce max visible — remove oldest if exceeded
        return next.slice(-MAX_TOASTS_VISIBLE);
      });

      // Auto-remove after display duration
      setTimeout(() => removeToast(newToast.id), TOAST_DISPLAY_MS);
    });
  }, [subscribe, removeToast]);

  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed right-4 top-20 z-[9990] flex flex-col gap-2"
      role="status"
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-3 rounded-xl px-4 py-3 text-white shadow-lg ${toast.bgColor} animate-[slide-in-right_0.3s_ease-out] motion-reduce:animate-none`}
        >
          <span className="text-xl" aria-hidden="true">
            {toast.icon}
          </span>
          <span className="text-sm font-bold">{toast.label}</span>
        </div>
      ))}
    </div>
  );
}
