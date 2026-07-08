"use client";

/**
 * OnboardingBanner — Giải thích metaphor quần đảo cho user lần đầu.
 * Hiển thị 1 lần, dismissed qua localStorage.
 * UX (nielsen H2): Match between system and the real world — giúp user hiểu "đảo" = gì, "sương mù" = gì.
 * Maintainable-code: ≤ 100 dòng, presentational.
 */

import { useEffect, useState } from "react";

const STORAGE_KEY = "learning_map_onboarding_seen";

export default function OnboardingBanner() {
  // Bắt đầu true để tránh hydration mismatch (server không biết localStorage).
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(localStorage.getItem(STORAGE_KEY) === "1");
  }, []);

  const handleDismiss = () => {
    try {
      localStorage.setItem(STORAGE_KEY, "1");
    } catch {
      // ignore (private mode, etc.)
    }
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div
      className="mb-6 animate-fade-in rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-yellow-50 p-5 shadow-sm"
      role="region"
      aria-label="Giới thiệu hành trình học"
    >
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
        <span className="text-5xl" aria-hidden="true">🗺️</span>

        <div className="flex-1">
          <h2 className="text-2xl font-bold text-amber-900">
            Chào mừng đến với Hành trình phát âm!
          </h2>
          <p className="mt-1 text-base font-normal text-amber-900">
            Bạn sẽ khám phá 4 hòn đảo — mỗi đảo là một nhóm âm IPA:
          </p>

          {/* 4-island progression */}
          <div className="mt-3 flex flex-wrap items-center gap-2 text-base">
            <span className="rounded-full bg-amber-200 px-3 py-1 font-bold text-amber-900">
              🌴 Nguyên âm
            </span>
            <span aria-hidden="true" className="font-bold text-amber-900">→</span>
            <span className="rounded-full bg-amber-200 px-3 py-1 font-bold text-amber-900">
              🌊 Phụ âm
            </span>
            <span aria-hidden="true" className="font-bold text-amber-900">→</span>
            <span className="rounded-full bg-amber-200 px-3 py-1 font-bold text-amber-900">
              ⚡ Minimal Pairs
            </span>
            <span aria-hidden="true" className="font-bold text-amber-900">→</span>
            <span className="rounded-full bg-amber-200 px-3 py-1 font-bold text-amber-900">
              🌋 Trọng âm & Nối âm
            </span>
          </div>

          <p className="mt-3 text-base font-normal text-amber-900">
            Hoàn thành <strong>≥80%</strong> đảo hiện tại để mở đảo tiếp theo.
            Đảo <strong>Nguyên âm</strong> đã mở sẵn — bắt đầu thôi! 🚀
          </p>
        </div>

        <button
          type="button"
          onClick={handleDismiss}
          className="shrink-0 rounded-lg bg-amber-600 px-5 py-2.5 text-base font-bold text-white transition hover:bg-amber-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-500"
        >
          Đã hiểu
        </button>
      </div>
    </div>
  );
}
