"use client";

import { useEffect, useMemo, useState } from "react";
import { type ExerciseQuestion } from "./ExerciseEngineClient";
import { useSynthesisAudio } from "./useSynthesisAudio";

type ChooseAssimilationQuestionProps = {
  question: ExerciseQuestion;
  onAnswer: (isCorrect: boolean, selectedOpt: string, selectedOptionId?: string | null) => void;
  isAnswered: boolean;
  selectedAnswer: string | null;
};

type ChooseAssimilationContent = {
  sentence: string;
  ipa: string;
  assimilationType: string;
  original: string;
  result: string;
  audioUrl: string | null;
};

function parseChooseAssimilation(content: string): ChooseAssimilationContent {
  try {
    const p = JSON.parse(content) as Partial<ChooseAssimilationContent>;
    return {
      sentence: String(p.sentence ?? ""),
      ipa: String(p.ipa ?? ""),
      assimilationType: String(p.assimilationType ?? ""),
      original: String(p.original ?? ""),
      result: String(p.result ?? ""),
      audioUrl: p.audioUrl ?? null,
    };
  } catch {
    return { sentence: "", ipa: "", assimilationType: "", original: "", result: "", audioUrl: null };
  }
}

export default function ChooseAssimilationQuestion({
  question,
  onAnswer,
  isAnswered,
  selectedAnswer,
}: ChooseAssimilationQuestionProps) {
  const data = useMemo(() => parseChooseAssimilation(question.content), [question.content]);
  const { play, isPlaying } = useSynthesisAudio();
  const [autoPlayed, setAutoPlayed] = useState(false);

  useEffect(() => {
    if (!data.sentence || autoPlayed) return;
    const t = window.setTimeout(() => {
      play(data.sentence);
      setAutoPlayed(true);
    }, 500);
    return () => window.clearTimeout(t);
  }, [data.sentence, play, autoPlayed]);

  // options = [result, original] (AnswerOption rows); fallback parse từ content
  const options =
    question.options.length > 0
      ? question.options
      : [
          { id: `${question.id}-result`, content: data.result },
          { id: `${question.id}-original`, content: data.original },
        ].filter((o) => o.content.length > 0);

  // exact match (IPA chars — KHÔNG normalize, giữ ʒ)
  const checkCorrect = (optContent: string) => optContent === question.answer;

  return (
    <div className="space-y-10 text-center">
      <div className="flex flex-col items-center gap-4">
        <button
          type="button"
          onClick={() => play(data.sentence)}
          disabled={isPlaying}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-warning-200 bg-warning-50 px-4 py-2 text-sm font-bold text-warning-800 transition-colors hover:bg-warning-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-warning-500 disabled:opacity-50"
        >
          🎧 {isPlaying ? "Đang phát..." : "Nghe câu tự nhiên"}
        </button>
        {data.assimilationType && (
          <p className="text-base font-medium text-neutral-600">
            Loại biến âm: <span className="font-ipa font-bold">{data.assimilationType}</span>
          </p>
        )}
      </div>
      <div>
        <p className="mb-6 text-lg font-medium text-neutral-600">
          Chọn phát âm đúng (nghe câu tự nhiên)
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {options.map((option) => {
            const isCorrectOpt = checkCorrect(option.content);
            const isSelected = option.content === selectedAnswer;
            let cls = "border-neutral-200 bg-white text-neutral-800 hover:border-primary-300";
            let statusIcon = "";
            if (isAnswered) {
              if (isCorrectOpt) {
                cls = "border-success-500 bg-success-50 text-success-700 ring-4 ring-success-100";
                statusIcon = "✓";
              } else if (isSelected) {
                cls = "border-error-500 bg-error-50 text-error-700 animate-shake";
                statusIcon = "✗";
              } else {
                cls = "border-neutral-200 bg-neutral-50 text-neutral-400";
              }
            }
            return (
              <button
                key={option.id}
                type="button"
                onClick={() =>
                  onAnswer(
                    isCorrectOpt,
                    option.content,
                    question.options.length > 0 ? option.id : null,
                  )
                }
                disabled={isAnswered}
                aria-pressed={isSelected}
                aria-label={isAnswered ? `${option.content} — ${statusIcon === "✓" ? "Đúng" : statusIcon === "✗" ? "Sai" : ""}` : option.content}
                className={`h-24 min-w-48 rounded-xl border-4 px-6 font-ipa text-2xl font-bold transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 ${cls}`}
              >
                {option.content}
                {statusIcon && <span className="ml-1 text-lg" aria-hidden="true">{statusIcon}</span>}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
