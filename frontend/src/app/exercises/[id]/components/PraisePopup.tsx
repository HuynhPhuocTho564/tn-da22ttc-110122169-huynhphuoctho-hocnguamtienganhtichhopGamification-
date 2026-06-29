"use client";

import { useEffect } from "react";

/**
 * Short praise popup (0.6s) shown when combo streak reaches a new milestone.
 *
 * Auto-dismisses after 600ms via setTimeout.
 * Part of SP1 in-exercise feedback system.
 *
 * Extracted from ExerciseEngineClient (was inline, ~15 lines).
 */
export default function PraisePopup({ text, onDismiss }: { text: string; onDismiss: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 600);
    return () => window.clearTimeout(timer);
  }, [text, onDismiss]);
  return (
    <div
      className="pointer-events-none fixed left-1/2 top-24 z-20 -translate-x-1/2 animate-[pulse-glow_1.5s_ease-in-out_2] rounded-full bg-primary-600 px-6 py-3 text-lg font-bold text-white shadow-lg"
      role="status"
      aria-live="polite"
    >
      {text}
    </div>
  );
}
