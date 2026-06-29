"use client";

import { useMemo } from "react";
import Button from "@/components/ui/Button";
import { getIpaHint } from "@/lib/phonetics/ipa-hints";
import { parseWordPrompt, type ExerciseQuestion } from "./ExerciseEngineClient";

type ListenFeedbackSheetProps = {
  isCorrect: boolean;
  selectedAnswer: string | null;
  question: ExerciseQuestion;
  hint: string;
  onAdvance: () => void;
  secondChances?: number;
  onUseSecondChance?: () => void;
};

// Âm thanh loa nhỏ để nghe lại 1 audioUrl (contrast comparison).
function MiniSpeaker({ audioUrl, label }: { audioUrl?: string; label: string }) {
  if (!audioUrl) return null;
  const play = () => {
    const audio = new Audio(audioUrl);
    audio.play().catch((e) => console.warn("contrast audio failed:", e));
  };
  return (
    <button
      type="button"
      onClick={play}
      aria-label={`Nghe lại ${label}`}
      className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-bold text-neutral-700 transition-colors hover:border-primary-300 hover:text-primary-700 disabled:opacity-40"
    >
      <span aria-hidden="true">🔊</span> {label}
    </button>
  );
}

export default function ListenFeedbackSheet({
  isCorrect,
  selectedAnswer,
  question,
  hint,
  onAdvance,
  secondChances = 0,
  onUseSecondChance,
}: ListenFeedbackSheetProps) {
  const contentData = useMemo(() => parseWordPrompt(question.content), [question.content]);
  const isPhonemeMode = contentData.answerType === "phoneme";
  const displayWord = contentData.word
    ? contentData.word.charAt(0).toUpperCase() + contentData.word.slice(1)
    : "";
  const ipa = contentData.ipa ?? "";
  const meaning = ""; // best-effort: meaningVi chưa có trong content → để trống, ẩn nếu rỗng

  // Contrast audio: option có audioUrl (bake từ seed). Tìm option của selectedAnswer + correct answer.
  const options = contentData.options ?? [];
  const selectedOption = options.find((o) => (o.text ?? o.content) === selectedAnswer);
  const correctOption = options.find((o) => (o.text ?? o.content) === question.answer);

  // Highlight IPA target trong IPA đầy đủ (stage 1 đúng, phoneme-mode).
  const highlightedIpa = useMemo(() => {
    if (!isPhonemeMode || !ipa || !contentData.targetPhoneme) return null;
    const bare = contentData.targetPhoneme.replace(/\//g, "");
    if (!bare || !ipa.includes(bare)) return null;
    const parts = ipa.split(bare);
    return parts.map((p, i, arr) => (
      <span key={i}>
        {p}
        {i < arr.length - 1 && <span className="font-bold text-success-600">{bare}</span>}
      </span>
    ));
  }, [isPhonemeMode, ipa, contentData.targetPhoneme]);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 border-t-2 p-4 transition-transform duration-300 sm:p-6 translate-y-0 ${
        isCorrect ? "border-success-200 bg-success-50" : "border-warning-200 bg-warning-50"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-1 items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl font-black ${
              isCorrect ? "bg-white text-success-600" : "bg-white text-warning-600"
            }`}
            aria-hidden="true"
          >
            {isCorrect ? "✓" : "✗"}
          </div>
          <div className="space-y-3">
            <h2
              className={`text-2xl font-bold ${isCorrect ? "text-success-700" : "text-warning-700"}`}
            >
              {isCorrect ? "Tuyệt vời!" : "Chưa chính xác"}
            </h2>

            {/* ĐÚNG: hiện word + IPA (highlight target) + nghĩa + replay */}
            {isCorrect && (
              <div className="space-y-2">
                <p className="font-bold text-neutral-900">
                  {displayWord}{" "}
                  <span className="font-ipa text-success-700">{highlightedIpa ?? ipa}</span>
                  {meaning && <span className="font-normal text-neutral-600"> — {meaning}</span>}
                </p>
                <MiniSpeaker audioUrl={contentData.audioUrl} label="Phát lại" />
              </div>
            )}

            {/* SAI: contrast comparison + 2 loa nghe so sánh + IPA hint (Task 5.1) */}
            {!isCorrect && (
              <div className="space-y-3">
                <p className="font-medium text-neutral-800">
                  Bạn chọn{" "}
                  <span className="font-bold text-warning-700">{selectedAnswer}</span>, đáp án{" "}
                  <span className="font-bold text-success-700">{question.answer}</span>
                </p>
                {(selectedOption?.audioUrl || correctOption?.audioUrl) && (
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-sm font-semibold text-neutral-600">So sánh 2 âm:</span>
                    {selectedOption?.audioUrl && (
                      <MiniSpeaker audioUrl={selectedOption.audioUrl} label={selectedAnswer ?? "âm chọn"} />
                    )}
                    {correctOption?.audioUrl && (
                      <MiniSpeaker audioUrl={correctOption.audioUrl} label={question.answer} />
                    )}
                  </div>
                )}

                {/* Task 5.1: IPA hint — giải thích "sai vì sao + cách sửa" (Nielsen H9).
                    Blue (info/learning) thay vì red (discouraging) — ui-color-harmony. */}
                {contentData.targetPhoneme &&
                  (() => {
                    const ipaHint = getIpaHint(contentData.targetPhoneme);
                    if (!ipaHint) return null;
                    return (
                      <div className="mt-2 rounded-lg border border-primary-200 bg-primary-50 p-4">
                        <p className="text-sm font-bold text-primary-800">
                          💡 Mẹo phát âm {ipaHint.symbol}
                        </p>
                        <p className="mt-1 text-sm text-primary-700">{ipaHint.tip}</p>
                        <p className="mt-1 text-xs italic text-primary-600">
                          {ipaHint.mouthPosition}
                        </p>
                        <p className="mt-0.5 text-xs text-primary-500">
                          Lỗi thường gặp: {ipaHint.commonMistake}
                        </p>
                      </div>
                    );
                  })()}
              </div>
            )}

            {hint && (
              <div
                className={`mt-2 rounded-lg p-4 text-sm ${
                  isCorrect ? "bg-success-100 text-success-800" : "bg-warning-100 text-warning-800"
                }`}
              >
                {hint}
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-2 sm:mt-2 sm:w-48">
          {/* Second Chance button — only on wrong answer when user has chances */}
          {!isCorrect && secondChances > 0 && onUseSecondChance && (
            <button
              type="button"
              onClick={onUseSecondChance}
              className="inline-flex items-center justify-center gap-2 rounded-xl border-2 border-amber-400 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-800 transition hover:bg-amber-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-300"
            >
              🔄 Làm lại ({secondChances})
            </button>
          )}
          <Button
            variant={isCorrect ? "success" : "error"}
            size="lg"
            className="min-h-14 w-full text-lg"
            onClick={onAdvance}
          >
            {isCorrect ? "Tiếp theo" : "Đã hiểu"}
          </Button>
        </div>
      </div>
    </div>
  );
}
