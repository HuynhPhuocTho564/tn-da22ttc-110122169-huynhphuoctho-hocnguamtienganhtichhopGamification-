"use client";

import { useEffect, useRef, useState } from "react";
import { getIpaHint } from "@/lib/phonetics/ipa-hints";

/**
 * IpaPopup — IPA symbol clickable, mở popup hint (Task 5.3).
 *
 * Click IPA → popup hiện mouth position + common mistake + tip.
 * Đóng: click nút ✕, click ngoài, hoặc Esc (Nielsen H3 — user control).
 *
 * Dùng lại IPA_HINTS từ Task 5.1 (DRY — 1 nguồn dữ liệu phonetics).
 * Contextual help tại moment of need (H10 — Help & Documentation).
 *
 * @module ui/IpaPopup
 */

type IpaPopupProps = {
  /** Full IPA string hiển thị, vd "/ʃɪp/" */
  ipa: string;
  /** Target phoneme để tra hint, vd "ʃ". Nếu không có, tra ký tự đầu. */
  targetPhoneme?: string;
  /** Class bổ sung cho nút IPA (vd text-5xl). */
  className?: string;
};

export default function IpaPopup({ ipa, targetPhoneme, className = "" }: IpaPopupProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLSpanElement>(null);

  const hint = targetPhoneme
    ? getIpaHint(targetPhoneme)
    : getIpaHint(ipa.replace(/\//g, "").charAt(0));

  // Click ngoài → đóng. Esc → đóng.
  useEffect(() => {
    if (!isOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setIsOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  // Không có hint → render IPA thường (không clickable, graceful degradation)
  if (!hint) {
    return <span className={`font-ipa ${className}`}>{ipa}</span>;
  }

  return (
    <span ref={containerRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setIsOpen((v) => !v)}
        className={`font-ipa underline decoration-dotted decoration-2 underline-offset-4 cursor-help transition-colors hover:text-primary-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-300 rounded ${className}`}
        aria-label={`Xem cách phát âm ${ipa}`}
        aria-expanded={isOpen}
      >
        {ipa}
      </button>

      {isOpen && (
        <div
          role="dialog"
          aria-label={`Hướng dẫn phát âm ${hint.symbol}`}
          className="absolute bottom-full left-1/2 z-50 mb-2 w-72 -translate-x-1/2 rounded-xl border border-primary-200 bg-white p-4 shadow-xl"
        >
          <div className="flex items-start justify-between">
            <h4 className="font-ipa text-2xl font-bold text-primary-700">{hint.symbol}</h4>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Đóng"
              className="rounded p-1 text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
            >
              <span aria-hidden="true">✕</span>
            </button>
          </div>
          <p className="mt-2 text-xs italic text-neutral-500">{hint.vietnamese}</p>
          <p className="mt-2 text-sm text-neutral-700">📍 {hint.mouthPosition}</p>
          <p className="mt-1 text-sm text-neutral-700">⚠️ {hint.commonMistake}</p>
          <p className="mt-2 text-sm font-semibold text-success-700">💡 {hint.tip}</p>
        </div>
      )}
    </span>
  );
}
