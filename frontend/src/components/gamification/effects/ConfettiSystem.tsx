"use client";

import { useEffect, useState, useMemo } from "react";
import { CONFETTI_COUNT_DESKTOP, CONFETTI_COUNT_MOBILE, CONFETTI_COLORS, CONFETTI_DURATION_MS } from "@/lib/gamification/constants";

type ConfettiPiece = {
  id: number;
  color: string;
  left: number;
  delay: number;
  duration: number;
  rotation: number;
  size: number;
};

function generatePieces(count: number): ConfettiPiece[] {
  return Array.from({ length: count }, (_, i) => ({
    id: i,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    left: Math.random() * 100,
    delay: Math.random() * 0.8,
    duration: 1.5 + Math.random() * 1.5,
    rotation: Math.random() * 360,
    size: 6 + Math.random() * 6,
  }));
}

/**
 * ConfettiSystem — CSS-only confetti animation for celebrations.
 *
 * Renders falling confetti pieces using CSS transforms (GPU-accelerated).
 * Auto-dismisses after CONFETTI_DURATION_MS.
 * Respects prefers-reduced-motion: shows 🎉 text instead.
 */
export default function ConfettiSystem({ onComplete }: { onComplete?: () => void }) {
  const [visible, setVisible] = useState(true);
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile for piece count optimization
  useEffect(() => {
    setIsMobile(window.innerWidth < 768);
  }, []);

  // Auto-hide after duration
  useEffect(() => {
    if (!visible) return;
    const timer = setTimeout(() => {
      setVisible(false);
      onComplete?.();
    }, CONFETTI_DURATION_MS);
    return () => clearTimeout(timer);
  }, [visible, onComplete]);

  const pieces = useMemo(
    () => generatePieces(isMobile ? CONFETTI_COUNT_MOBILE : CONFETTI_COUNT_DESKTOP),
    [isMobile],
  );

  if (!visible) return null;

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden"
      aria-hidden="true"
      role="presentation"
    >
      {/* Reduced-motion fallback */}
      <div className="flex items-center justify-center text-6xl md:hidden lg:hidden motion-reduce:flex motion-reduce:items-center motion-reduce:justify-center">
        <span className="motion-reduce:block hidden">🎉</span>
      </div>

      {/* Confetti pieces — hidden on reduced-motion */}
      <div className="motion-reduce:hidden">
        {pieces.map((piece) => (
          <div
            key={piece.id}
            className="absolute"
            style={{
              left: `${piece.left}%`,
              top: "-10px",
              width: `${piece.size}px`,
              height: `${piece.size * 0.6}px`,
              backgroundColor: piece.color,
              borderRadius: "2px",
              transform: `rotate(${piece.rotation}deg)`,
              animation: `confetti-fall ${piece.duration}s ease-in ${piece.delay}s forwards, confetti-sway ${piece.duration * 0.6}s ease-in-out ${piece.delay}s infinite alternate`,
              willChange: "transform",
            }}
          />
        ))}
      </div>
    </div>
  );
}
