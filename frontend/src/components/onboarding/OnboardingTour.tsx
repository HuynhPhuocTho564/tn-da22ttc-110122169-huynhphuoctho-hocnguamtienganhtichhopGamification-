"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import Button from "@/components/ui/Button";
import { TOUR_STEPS, markOnboardingComplete } from "@/lib/onboarding";

/**
 * OnboardingTour — guided tour 5 bước cho user mới (Nielsen H10).
 *
 * Cơ chế:
 * - Overlay đen mờ phủ toàn màn hình (bg-black/60)
 * - Spotlight: "khoét" vùng quanh target element bằng cách đo bounding rect
 *   và vẽ 4 div đen xung quanh (technique đơn giản, không cần SVG mask)
 * - Tooltip card gần target (trên/dưới tùy vị trí)
 * - Keyboard: Esc = skip, Enter = next, ←/→ = prev/next
 * - Focus trap trong tooltip
 * - Auto-scroll target vào viewport nếu ngoài màn hình
 *
 * Component nhận onComplete callback — dashboard sẽ unmount tour khi xong.
 *
 * @module onboarding/OnboardingTour
 */

type OnboardingTourProps = {
  onComplete: () => void;
};

type Rect = { top: number; left: number; width: number; height: number; bottom: number; right: number };

const SPOTLIGHT_PADDING = 12;
const TOOLTIP_OFFSET = 16;

export default function OnboardingTour({ onComplete }: OnboardingTourProps) {
  const [step, setStep] = useState(0);
  const [targetRect, setTargetRect] = useState<Rect | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentStep = TOUR_STEPS[step];
  const isLastStep = step === TOUR_STEPS.length - 1;

  // Đo vị trí target element + scroll vào viewport
  const measureTarget = useCallback(() => {
    if (!currentStep.target) {
      setTargetRect(null);
      return;
    }
    const element = document.querySelector(currentStep.target);
    if (!element) {
      setTargetRect(null);
      return;
    }
    element.scrollIntoView({ behavior: "smooth", block: "center" });
    const rect = element.getBoundingClientRect();
    setTargetRect({
      top: rect.top,
      left: rect.left,
      width: rect.width,
      height: rect.height,
      bottom: rect.bottom,
      right: rect.right,
    });
  }, [currentStep.target]);

  useEffect(() => {
    measureTarget();
    // Re-measure khi resize/window scroll (target có thể dịch chỗ)
    window.addEventListener("resize", measureTarget);
    window.addEventListener("scroll", measureTarget, true);
    return () => {
      window.removeEventListener("resize", measureTarget);
      window.removeEventListener("scroll", measureTarget, true);
    };
  }, [measureTarget, step]);

  // Focus tooltip khi đổi step (accessibility — screen reader đọc step mới)
  useEffect(() => {
    tooltipRef.current?.focus();
  }, [step]);

  const finish = useCallback(() => {
    markOnboardingComplete();
    onComplete();
  }, [onComplete]);

  const skip = useCallback(() => {
    finish();
  }, [finish]);

  const next = useCallback(() => {
    if (isLastStep) {
      finish();
    } else {
      setStep((s) => s + 1);
    }
  }, [isLastStep, finish]);

  const prev = useCallback(() => {
    setStep((s) => Math.max(0, s - 1));
  }, []);

  // Keyboard: Esc = skip, Enter = next, ArrowLeft = prev, ArrowRight = next
  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        skip();
      } else if (event.key === "Enter") {
        event.preventDefault();
        next();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        next();
      } else if (event.key === "ArrowLeft") {
        event.preventDefault();
        prev();
      }
    },
    [skip, next, prev],
  );

  // Tính vị trí tooltip (trên hoặc dưới target tùy không gian)
  const tooltipPosition = targetRect
    ? targetRect.top > window.innerHeight / 2
      ? { top: targetRect.top - TOOLTIP_OFFSET, placement: "above" as const }
      : { top: targetRect.bottom + TOOLTIP_OFFSET, placement: "below" as const }
    : { top: window.innerHeight / 2, placement: "center" as const };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Hướng dẫn sử dụng — bước ${step + 1}/${TOUR_STEPS.length}`}
      onKeyDown={handleKeyDown}
      className="fixed inset-0 z-[100]"
    >
      {/* Overlay đen + spotlight cutout (4 div quanh target) */}
      {targetRect ? (
        <>
          {/* Top strip */}
          <div
            className="fixed left-0 top-0 bg-black/60"
            style={{
              width: "100vw",
              height: Math.max(0, targetRect.top - SPOTLIGHT_PADDING),
            }}
          />
          {/* Bottom strip */}
          <div
            className="fixed left-0 bg-black/60"
            style={{
              top: targetRect.bottom + SPOTLIGHT_PADDING,
              width: "100vw",
              height: Math.max(0, window.innerHeight - targetRect.bottom - SPOTLIGHT_PADDING),
            }}
          />
          {/* Left strip */}
          <div
            className="fixed top-0 bg-black/60"
            style={{
              left: 0,
              width: Math.max(0, targetRect.left - SPOTLIGHT_PADDING),
              height: "100vh",
            }}
          />
          {/* Right strip */}
          <div
            className="fixed top-0 bg-black/60"
            style={{
              left: targetRect.right + SPOTLIGHT_PADDING,
              width: Math.max(0, window.innerWidth - targetRect.right - SPOTLIGHT_PADDING),
              height: "100vh",
            }}
          />
          {/* Ring outline quanh target (visual spotlight) */}
          <div
            className="fixed rounded-lg border-2 border-primary-400 pointer-events-none"
            style={{
              top: targetRect.top - SPOTLIGHT_PADDING,
              left: targetRect.left - SPOTLIGHT_PADDING,
              width: targetRect.width + SPOTLIGHT_PADDING * 2,
              height: targetRect.height + SPOTLIGHT_PADDING * 2,
            }}
          />
        </>
      ) : (
        /* Full-screen overlay khi welcome (no target) */
        <div className="fixed inset-0 bg-black/60" />
      )}

      {/* Tooltip card */}
      <div
        ref={tooltipRef}
        tabIndex={-1}
        role="document"
        className="fixed left-1/2 w-[min(90vw,420px)] -translate-x-1/2 rounded-xl border border-primary-300 bg-white p-6 shadow-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500"
        style={{ top: Math.max(80, Math.min(tooltipPosition.top, window.innerHeight - 220)) }}
      >
        {/* Step indicator */}
        <div className="mb-3 flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-widest text-primary-600">
            Bước {step + 1}/{TOUR_STEPS.length}
          </span>
          <button
            type="button"
            onClick={skip}
            className="rounded px-2 py-1 text-xs font-semibold text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
          >
            Bỏ qua
          </button>
        </div>

        <h2 className="mb-2 text-xl font-bold text-neutral-900">{currentStep.title}</h2>
        <p className="mb-6 text-sm text-neutral-600">{currentStep.description}</p>

        {/* Progress dots */}
        <div className="mb-6 flex gap-1.5" aria-hidden="true">
          {TOUR_STEPS.map((s, i) => (
            <span
              key={s.id}
              className={`h-1.5 rounded-full transition-all ${
                i === step ? "w-6 bg-primary-600" : i < step ? "w-1.5 bg-primary-400" : "w-1.5 bg-neutral-300"
              }`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={prev}
            disabled={step === 0}
            aria-label="Bước trước"
          >
            ← Quay lại
          </Button>
          <Button variant="primary" size="sm" onClick={next}>
            {isLastStep ? "Bắt đầu học! 🚀" : "Tiếp theo →"}
          </Button>
        </div>
      </div>
    </div>
  );
}
