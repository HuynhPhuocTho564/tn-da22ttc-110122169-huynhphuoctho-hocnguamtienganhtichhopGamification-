"use client";

import { useState, useCallback } from "react";

interface AchievementShareProps {
  /** Achievement title to share */
  title: string;
  /** Description or stats */
  description: string;
  /** Optional emoji icon */
  icon?: string;
  /** "full" = box đầy đủ (mặc định). "compact" = chỉ 1 nút mở popover (Task 6.1). */
  variant?: "full" | "compact";
}

/**
 * AchievementShare — Let users share achievements via clipboard or social links.
 *
 * Zalo share (zalo.me/s?text=) only works on mobile (opens Zalo app).
 * On desktop, the Zalo button is hidden and a toast is shown instead.
 *
 * variant="full" (mặc định): render box đầy đủ với icon + title + description + 2 nút.
 * variant="compact" (Task 6.1): 1 nút "🔗 Chia sẻ" mở popover — dùng inline trong
 * BadgeCard / ExerciseSummary mà không chiếm chỗ (Nielsen H7 — flexibility).
 */
export default function AchievementShare({
  title,
  description,
  icon = "🏆",
  variant = "full",
}: AchievementShareProps) {
  const [copied, setCopied] = useState(false);
  const [popoverOpen, setPopoverOpen] = useState(false);

  const shareText = `${icon} ${title}\n${description}\n\nTôi đang học phát âm tiếng Anh trên PronunciationHelper! 🎓`;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: create textarea
      const textarea = document.createElement("textarea");
      textarea.value = shareText;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [shareText]);

  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`;
  // Zalo share chỉ hoạt động trên mobile (mở app Zalo). Desktop → ẩn nút Zalo.
  const zaloUrl = `https://zalo.me/s?text=${encodeURIComponent(shareText)}`;

  // Compact variant — 1 nút mở popover (Task 6.1)
  if (variant === "compact") {
    return (
      <div className="relative inline-block">
        <button
          type="button"
          onClick={() => setPopoverOpen((v) => !v)}
          className="inline-flex min-h-9 items-center gap-1 rounded-lg border border-neutral-300 px-3 py-1.5 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-neutral-300"
          aria-label="Chia sẻ thành tích"
          aria-expanded={popoverOpen}
        >
          <span aria-hidden="true">🔗</span> Chia sẻ
        </button>

        {popoverOpen && (
          <div
            className="absolute right-0 top-full z-50 mt-2 w-64 rounded-xl border border-neutral-200 bg-white p-3 shadow-xl"
            role="dialog"
            aria-label="Tùy chọn chia sẻ"
          >
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleCopy}
                className="min-h-9 flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-neutral-300"
                aria-label={copied ? "Đã sao chép" : "Sao chép thành tích"}
              >
                {copied ? "✅ Đã chép!" : "📋 Sao chép"}
              </button>
              <a
                href={twitterUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setPopoverOpen(false)}
                className="min-h-9 flex-1 rounded-lg bg-neutral-900 px-3 py-2 text-center text-xs font-semibold text-white transition-colors hover:bg-neutral-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-neutral-300"
                aria-label="Chia sẻ lên X (Twitter)"
              >
                𝕏
              </a>
            </div>
            <a
              href={zaloUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setPopoverOpen(false)}
              className="mt-2 flex min-h-9 w-full items-center justify-center gap-1 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400"
              aria-label="Chia sẻ lên Zalo"
            >
              💬 Zalo
            </a>
          </div>
        )}
      </div>
    );
  }

  // Full variant (mặc định) — box đầy đủ
  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-lg" aria-hidden="true">{icon}</span>
        <h3 className="text-sm font-bold text-neutral-900">{title}</h3>
      </div>
      <p className="mb-3 text-xs text-neutral-600">{description}</p>
      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className="min-h-9 flex-1 rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-700 transition-colors hover:bg-neutral-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-neutral-300"
          aria-label={copied ? "Đã sao chép" : "Sao chép thành tích"}
        >
          {copied ? "✅ Đã sao chép!" : "📋 Sao chép"}
        </button>
        <a
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-9 flex-1 rounded-lg bg-neutral-900 px-3 py-2 text-center text-xs font-semibold text-white transition-colors hover:bg-neutral-800 focus:outline-none focus-visible:ring-4 focus-visible:ring-neutral-300"
          aria-label="Chia sẻ lên X (Twitter)"
        >
          𝕏 Chia sẻ
        </a>
        <a
          href={zaloUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="min-h-9 flex-1 rounded-lg bg-blue-600 px-3 py-2 text-center text-xs font-semibold text-white transition-colors hover:bg-blue-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-blue-400"
          aria-label="Chia sẻ lên Zalo"
        >
          💬 Zalo
        </a>
      </div>
    </div>
  );
}

