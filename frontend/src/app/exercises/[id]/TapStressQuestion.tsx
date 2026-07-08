"use client";

import { useEffect, useMemo, useState } from "react";
import { type ExerciseQuestion } from "./ExerciseEngineClient";

type TapStressQuestionProps = {
  question: ExerciseQuestion;
  onAnswer: (isCorrect: boolean, selectedOpt: string, selectedOptionId?: string | null) => void;
  isAnswered: boolean;
  selectedAnswer: string | null;
};

type TapStressContent = {
  word: string;
  ipa: string;
  syllables: string[];
  stressIndex: number;
  audioUrl: string;
};

function parseTapStress(content: string): TapStressContent {
  try {
    const p = JSON.parse(content) as Partial<TapStressContent>;
    return {
      word: String(p.word ?? ""),
      ipa: String(p.ipa ?? ""),
      syllables: Array.isArray(p.syllables) ? p.syllables.map(String) : [],
      stressIndex: typeof p.stressIndex === "number" ? p.stressIndex : 0,
      audioUrl: String(p.audioUrl ?? ""),
    };
  } catch {
    return { word: "", ipa: "", syllables: [], stressIndex: 0, audioUrl: "" };
  }
}

/**
 * TapStressQuestion — Multiple Choice cho Trọng âm (CĐ4).
 *
 * Thiết kế 2026-06-26: chuyển từ "tap vào âm tiết" → "trắc nghiệm chọn Âm tiết 1/2/3".
 * - Hiển thị word + IPA + audio replay
 * - Nút trắc nghiệm hiển thị "Âm tiết 1", "Âm tiết 2"... (syllable breakdown đã bị xóa theo yêu cầu)
 * - Nút trắc nghiệm hiển thị "Âm tiết 1", "Âm tiết 2"...
 * - Scoring: option.id được so với question.answer (stressIndex 0-based) — KHÔNG đổi
 *
 * Skill nielsen-ux-heuristics:
 *  - H6 Recognition over recall: user chọn số, không phải nhớ/gõ
 *  - H8 Minimalist: bỏ tap-direct (ít lỗi touch trên mobile)
 *  - Hick: ≤7 options = ≤7 âm tiết (đa số từ tiếng Anh 2-4 âm tiết)
 */
export default function TapStressQuestion({
  question,
  onAnswer,
  isAnswered,
  selectedAnswer,
}: TapStressQuestionProps) {
  const data = useMemo(() => parseTapStress(question.content), [question.content]);
  const correctIdx = data.stressIndex;
  const [autoPlayed, setAutoPlayed] = useState(false);

  // Autoplay audio 500ms sau mount
  useEffect(() => {
    if (!data.audioUrl || autoPlayed) return;
    const t = window.setTimeout(() => {
      const a = new Audio(data.audioUrl);
      a.play().catch((e) => console.warn("Autoplay prevented:", e));
      setAutoPlayed(true);
    }, 500);
    return () => window.clearTimeout(t);
  }, [data.audioUrl, autoPlayed]);

  const replay = () => {
    if (!data.audioUrl) return;
    new Audio(data.audioUrl).play().catch((e) => console.warn("audio failed:", e));
  };

  // options từ seed (AnswerOption rows) — mỗi option là 1 âm tiết
  const options =
    question.options.length > 0
      ? question.options
      : data.syllables.map((s, i) => ({ id: `${question.id}-syl-${i}`, content: s }));

  // Hàm check xem option.id này có phải đáp án user đã chọn không
  // (so với selectedAnswer dạng "Âm tiết N" từ UI cũ — giữ tương thích)
  const isSelectedById = (optionId: string): boolean => {
    if (selectedAnswer === null) return false;
    // selectedAnswer có thể là "Âm tiết N" (từ UI mới) hoặc option.content (từ UI cũ)
    const idx = options.findIndex((o) => o.id === optionId);
    if (selectedAnswer.startsWith("Âm tiết ")) {
      const n = Number(selectedAnswer.replace("Âm tiết ", "").trim());
      return idx === n - 1;
    }
    return options[idx]?.content === selectedAnswer;
  };

  return (
    <div className="space-y-8 text-center">
      {/* ═══ 1. Word + IPA + audio replay ═══ */}
      <div className="flex flex-col items-center gap-4">
        <h2 className="text-4xl font-bold text-neutral-900 sm:text-5xl">{data.word}</h2>
        {/* IPA chỉ hiện sau khi chọn đáp án */}
        {isAnswered && data.ipa && <p className="font-ipa text-2xl text-neutral-600">{data.ipa}</p>}
        <button
          type="button"
          onClick={replay}
          disabled={!data.audioUrl}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-warning-200 bg-warning-50 px-4 py-2 text-sm font-bold text-warning-800 transition-colors hover:bg-warning-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-warning-500 disabled:opacity-50"
        >
          🔊 Phát lại
        </button>
      </div>

      {/* ═══ 2. Multiple choice — "Chọn âm tiết được nhấn" ═══ */}
      <div>
        <p className="mb-4 text-base font-semibold text-neutral-700">
          Âm tiết nào được nhấn?
        </p>
        <div className="mx-auto flex flex-wrap justify-center gap-3 max-w-md">
          {options.map((option, idx) => {
            const isCorrectOpt = idx === correctIdx;
            const isSelected = isSelectedById(option.id);
            const isDisabled = isAnswered;

            let cls =
              "border-neutral-200 bg-white text-neutral-800 hover:border-primary-400 hover:bg-primary-50";

            if (isAnswered) {
              if (isCorrectOpt) {
                cls =
                  "border-success-500 bg-success-50 text-success-700 ring-4 ring-success-100";
              } else if (isSelected) {
                cls = "border-error-500 bg-error-50 text-error-700 animate-shake";
              } else {
                cls = "border-neutral-200 bg-neutral-50 text-neutral-400";
              }
            }

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  if (isDisabled) return;
                  // Truyền option.id cho scoring, answerOpt là "Âm tiết N" cho UI feedback
                  onAnswer(isCorrectOpt, `Âm tiết ${idx + 1}`, option.id);
                }}
                disabled={isDisabled}
                aria-pressed={isSelected}
                aria-label={
                  isAnswered
                    ? `Âm tiết ${idx + 1} — ${isCorrectOpt ? "Đúng" : isSelected ? "Sai" : ""}`
                    : `Chọn âm tiết ${idx + 1}`
                }
                className={`relative inline-flex min-h-14 min-w-[140px] items-center justify-center rounded-xl border-2 px-4 py-3 text-base font-bold transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-300 disabled:cursor-not-allowed ${cls}`}
              >
                <span>Âm tiết {idx + 1}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
