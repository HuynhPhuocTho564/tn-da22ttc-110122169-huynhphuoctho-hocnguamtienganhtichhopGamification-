"use client";

import { useEffect, useMemo, useState } from "react";
import { type ExerciseQuestion } from "./ExerciseEngineClient";
import { useSynthesisAudio } from "./useSynthesisAudio";

type ChooseWeakQuestionProps = {
  question: ExerciseQuestion;
  onAnswer: (
    isCorrect: boolean,
    selectedOpt: string,
    selectedOptionId?: string | null,
    selectedTextOverride?: string,
  ) => void;
  isAnswered: boolean;
  selectedAnswer: string | null;
};

type ChooseWeakContent = {
  sentence: string;
  ipa: string;
  weakWords: string[];
  audioUrl: string | null;
};

function parseChooseWeak(content: string): ChooseWeakContent {
  try {
    const p = JSON.parse(content) as Partial<ChooseWeakContent>;
    return {
      sentence: String(p.sentence ?? ""),
      ipa: String(p.ipa ?? ""),
      weakWords: Array.isArray(p.weakWords) ? p.weakWords.map(String) : [],
      audioUrl: p.audioUrl ?? null,
    };
  } catch {
    return { sentence: "", ipa: "", weakWords: [], audioUrl: null };
  }
}

function normalizeAnswer(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\w\s]|_/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export default function ChooseWeakQuestion({
  question,
  onAnswer,
  isAnswered,
  selectedAnswer: _selectedAnswer,
}: ChooseWeakQuestionProps) {
  const data = useMemo(() => parseChooseWeak(question.content), [question.content]);
  const { play, isPlaying } = useSynthesisAudio();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [autoPlayed, setAutoPlayed] = useState(false);

  // Autoplay speech 500ms sau mount
  useEffect(() => {
    if (!data.sentence || autoPlayed) return;
    const t = window.setTimeout(() => {
      play(data.sentence);
      setAutoPlayed(true);
    }, 500);
    return () => window.clearTimeout(t);
  }, [data.sentence, play, autoPlayed]);

  // Reset selection khi đổi question
  useEffect(() => {
    setSelected(new Set());
  }, [question.id]);

  // options = sentence words (AnswerOption rows); fallback split sentence
  const options =
    question.options.length > 0
      ? question.options
      : data.sentence
          .replace(/[.,!?]/g, "")
          .split(/\s+/)
          .filter(Boolean)
          .map((w, i) => ({ id: `${question.id}-w-${i}`, content: w }));

  const expectedSet = new Set(data.weakWords.map(normalizeAnswer).filter(Boolean));

  const toggle = (optId: string) => {
    if (isAnswered) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(optId)) next.delete(optId);
      else next.add(optId);
      return next;
    });
  };

  const submit = () => {
    if (isAnswered || selected.size === 0) return;
    const selectedContents = options.filter((o) => selected.has(o.id)).map((o) => o.content);
    const selectedSet = new Set(selectedContents.map(normalizeAnswer).filter(Boolean));
    const isCorrect =
      expectedSet.size === selectedSet.size && [...expectedSet].every((x) => selectedSet.has(x));
    const selectedTextJoin = selectedContents.join(",");
    onAnswer(isCorrect, selectedTextJoin, null, selectedTextJoin);
  };

  return (
    <div className="space-y-10 text-center">
      <div className="flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={() => play(data.sentence)}
          disabled={isPlaying}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-warning-200 bg-warning-50 px-4 py-2 text-sm font-bold text-warning-800 transition-colors hover:bg-warning-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-warning-500 disabled:opacity-50"
        >
          🎧 {isPlaying ? "Đang phát..." : "Nghe câu"}
        </button>
        {isAnswered && data.ipa && <p className="font-ipa text-xl text-neutral-600">{data.ipa}</p>}
      </div>

      <div>
        <p className="mb-6 text-lg font-medium text-neutral-600">
          Chọn từ đọc lướt (weak /ə/)
          {data.weakWords.length > 1 && (
            <span className="ml-2 text-sm font-normal text-neutral-400">— có thể nhiều đáp án</span>
          )}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          {options.map((option) => {
            const isSelected = selected.has(option.id);
            const isCorrectOpt = expectedSet.has(normalizeAnswer(option.content));
            let cls = "border-neutral-200 bg-white text-neutral-800 hover:border-primary-300";
            if (isAnswered) {
              if (isCorrectOpt) {
                cls = "border-success-500 bg-success-50 text-success-700 ring-4 ring-success-100";
              } else if (isSelected) {
                cls = "border-error-500 bg-error-50 text-error-700";
              } else {
                cls = "border-neutral-200 bg-neutral-50 text-neutral-400";
              }
            } else if (isSelected) {
              cls = "border-primary-500 bg-primary-50 text-primary-700 ring-4 ring-primary-100";
            }
            return (
              <button
                key={option.id}
                type="button"
                onClick={() => toggle(option.id)}
                disabled={isAnswered}
                aria-pressed={isSelected}
                aria-label={isAnswered ? `${option.content} — ${isCorrectOpt ? "Đúng" : isSelected ? "Sai" : ""}` : option.content}
                className={`min-h-11 rounded-lg border-4 px-4 py-2 text-base font-bold transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 ${cls}`}
              >
                {option.content}
              </button>
            );
          })}
        </div>
        {!isAnswered && (
          <button
            type="button"
            onClick={submit}
            disabled={selected.size === 0}
            className="mt-8 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary-600 px-8 py-3 text-base font-bold text-white transition-colors hover:bg-primary-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 disabled:opacity-50"
          >
            Xong ({selected.size})
          </button>
        )}
      </div>
    </div>
  );
}
