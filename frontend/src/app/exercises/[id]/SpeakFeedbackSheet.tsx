"use client";

import { useEffect, useState } from "react";

export type SpeakFeedbackSheetProps = {
  isCorrect: boolean;
  transcript: string;
  answerText: string;
  retryLabel?: string;
  audioReplay?: React.ReactNode;
  onRetry: () => void;
  onNext: () => void;
};

// Bottom-sheet feedback overlay (Persistent Contextual Bottom Sheet — Duolingo pattern).
// Cố định đáy, slide-up entrance, overlay (không đẩy content card).
// Dùng chung cho 3 dạng speak (word / sentence / minimal_pairs).
export default function SpeakFeedbackSheet({
  isCorrect,
  transcript,
  answerText,
  retryLabel,
  audioReplay,
  onRetry,
  onNext,
}: SpeakFeedbackSheetProps) {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(r);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-0 left-0 right-0 z-50 max-h-[40vh] overflow-y-auto border-t-4 p-4 shadow-2xl transition-transform duration-300 sm:p-6 ${
        entered ? "translate-y-0" : "translate-y-full"
      } ${isCorrect ? "border-success-400 bg-success-50" : "border-error-400 bg-error-50"}`}
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-1 items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-xl font-black ${
              isCorrect ? "text-success-600" : "text-error-600"
            }`}
            aria-hidden="true"
          >
            {isCorrect ? "✓" : "✗"}
          </div>
          <div className="space-y-3">
            <h2 className={`text-2xl font-bold ${isCorrect ? "text-success-700" : "text-error-700"}`}>
              {isCorrect ? "Xuất sắc!" : "Chưa chính xác"}
            </h2>
            <p className="font-medium text-neutral-800">
              Bạn nói:{" "}
              <span className={`font-bold ${isCorrect ? "text-success-700" : "text-error-700"}`}>
                "{transcript || "Không rõ"}"
              </span>
              {!isCorrect && (
                <>
                  {" "}— đáp án:{" "}
                  <span className="font-bold text-success-700">"{answerText}"</span>
                </>
              )}
            </p>
            {!isCorrect && audioReplay}
          </div>
        </div>
        <div className="flex gap-2 sm:mt-2">
          {!isCorrect && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-xl border-2 border-error-300 bg-white px-6 py-4 font-bold text-error-700 transition-colors hover:bg-error-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-error-300"
            >
              🔄 {retryLabel ?? "Thử lại"}
            </button>
          )}
          <button
            type="button"
            onClick={onNext}
            className={`rounded-xl px-8 py-4 text-lg font-bold text-white transition-colors focus:outline-none focus-visible:ring-4 ${
              isCorrect
                ? "bg-success-600 hover:bg-success-700 focus-visible:ring-success-300"
                : "bg-error-600 hover:bg-error-700 focus-visible:ring-error-300"
            }`}
          >
            Tiếp theo →
          </button>
        </div>
      </div>
    </div>
  );
}
