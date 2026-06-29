"use client";

import { useEffect, useMemo, useState } from "react";
import { type ExerciseQuestion } from "./ExerciseEngineClient";
import { useSynthesisAudio } from "./useSynthesisAudio";

type ChooseLinkingQuestionProps = {
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

type ChooseLinkingContent = {
  sentence: string;
  ipa: string;
  linkingPairs: string[][];
  audioUrl: string | null;
};

function parseChooseLinking(content: string): ChooseLinkingContent {
  try {
    const p = JSON.parse(content) as Partial<ChooseLinkingContent>;
    return {
      sentence: String(p.sentence ?? ""),
      ipa: String(p.ipa ?? ""),
      linkingPairs: Array.isArray(p.linkingPairs) ? p.linkingPairs.map((pair) => pair.map(String)) : [],
      audioUrl: p.audioUrl ?? null,
    };
  } catch {
    return { sentence: "", ipa: "", linkingPairs: [], audioUrl: null };
  }
}

// Giữ char "→" (linking pair delimiter) — không strip như normalize thường
function normalizeAnswer(value: string) {
  return value
    .toLowerCase()
    .replace(/[^\w\s→]|_/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export default function ChooseLinkingQuestion({
  question,
  onAnswer,
  isAnswered,
  selectedAnswer: _selectedAnswer,
}: ChooseLinkingQuestionProps) {
  const data = useMemo(() => parseChooseLinking(question.content), [question.content]);
  const { play, isPlaying } = useSynthesisAudio();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [autoPlayed, setAutoPlayed] = useState(false);

  useEffect(() => {
    if (!data.sentence || autoPlayed) return;
    const t = window.setTimeout(() => {
      play(data.sentence);
      setAutoPlayed(true);
    }, 500);
    return () => window.clearTimeout(t);
  }, [data.sentence, play, autoPlayed]);

  useEffect(() => {
    setSelected(new Set());
  }, [question.id]);

  const options =
    question.options.length > 0
      ? question.options
      : (() => {
          const words = data.sentence.replace(/[.,!?]/g, "").split(/\s+/).filter(Boolean);
          const pairs: { id: string; content: string }[] = [];
          for (let i = 0; i < words.length - 1; i++) {
            pairs.push({ id: `${question.id}-p-${i}`, content: `${words[i]}→${words[i + 1]}` });
          }
          return pairs;
        })();

  const expectedSet = new Set(
    data.linkingPairs.map((p) => p.join("→")).map(normalizeAnswer).filter(Boolean),
  );

  const toggle = (optId: string) => {
    if (isAnswered) return;
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(optId)) n.delete(optId);
      else n.add(optId);
      return n;
    });
  };

  const submit = () => {
    if (isAnswered || selected.size === 0) return;
    const selectedContents = options.filter((o) => selected.has(o.id)).map((o) => o.content);
    const selectedSet = new Set(selectedContents.map(normalizeAnswer).filter(Boolean));
    const isCorrect =
      expectedSet.size === selectedSet.size && [...expectedSet].every((x) => selectedSet.has(x));
    const join = selectedContents.join(",");
    onAnswer(isCorrect, join, null, join);
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
        {data.ipa && <p className="font-ipa text-xl text-neutral-600">{data.ipa}</p>}
      </div>
      <div>
        <p className="mb-6 text-lg font-medium text-neutral-600">Chọn cặp từ nối âm (linking)</p>
        <div className="flex flex-wrap justify-center gap-3">
          {options.map((option) => {
            const isSelected = selected.has(option.id);
            const isCorrectOpt = expectedSet.has(normalizeAnswer(option.content));
            let cls = "border-neutral-200 bg-white text-neutral-800 hover:border-primary-300";
            let statusIcon = "";
            if (isAnswered) {
              if (isCorrectOpt) {
                cls = "border-success-500 bg-success-50 text-success-700 ring-4 ring-success-100";
                statusIcon = "✓";
              } else if (isSelected) {
                cls = "border-error-500 bg-error-50 text-error-700";
                statusIcon = "✗";
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
                aria-label={isAnswered ? `${option.content} — ${statusIcon === "✓" ? "Đúng" : statusIcon === "✗" ? "Sai" : ""}` : option.content}
                className={`min-h-11 rounded-lg border-4 px-4 py-2 text-base font-bold transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 ${cls}`}
              >
                {option.content}
                {statusIcon && <span className="ml-1" aria-hidden="true">{statusIcon}</span>}
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
