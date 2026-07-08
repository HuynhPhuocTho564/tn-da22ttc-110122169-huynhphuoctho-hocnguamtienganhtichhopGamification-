"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Volume2 } from "lucide-react";
import { parseWordPrompt, normalizeAnswer } from "../parse-word-prompt";
import type { ExerciseQuestion } from "../types";

const LISTENING_ONBOARDING_KEY = "linguaecho_listening_onboarded";

/**
 * Listen-choose question renderer (qtype-1-mc).
 * Supports hint token: eliminates 1 wrong option.
 *
 * Flow: tap to select (pending) → Enter (or re-tap) to submit.
 * Sound effects for correct/wrong are emitted from the engine via playSfx,
 * which auto-respects the global SFX mute toggle.
 */
export default function ListenChooseQuestion({
  question,
  onAnswer,
  isAnswered,
  selectedAnswer,
  hintTokens = 0,
  onUseHint,
}: {
  question: ExerciseQuestion;
  onAnswer: (isCorrect: boolean, selectedOpt: string, selectedOptionId?: string | null) => void;
  isAnswered: boolean;
  selectedAnswer: string | null;
  hintTokens?: number;
  onUseHint?: () => void;
}) {
  const [eliminatedIds, setEliminatedIds] = useState<Set<string>>(new Set());
  // Onboarding tooltip — shown once for first-time Listening users (Fix 10).
  const [showOnboarding, setShowOnboarding] = useState(false);

  // Reset transient state when question changes.
  useEffect(() => {
    setEliminatedIds(new Set());
  }, [question.id]);

  // Onboarding check on first mount only.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      if (window.localStorage.getItem(LISTENING_ONBOARDING_KEY) !== "1") {
        setShowOnboarding(true);
      }
    } catch {
      // ignore (private mode, SSR, etc.)
    }
  }, []);

  const dismissOnboarding = useCallback(() => {
    setShowOnboarding(false);
    try {
      window.localStorage.setItem(LISTENING_ONBOARDING_KEY, "1");
    } catch {
      // ignore
    }
  }, []);

  const contentData = useMemo(() => parseWordPrompt(question.content), [question.content]);
  // v2 listen_choose 3-stage: stage 1 (hiện word), 2 (skeleton), 3 (chỉ audio). Fallback 1 cho câu cũ (word-mode).
  const stage = contentData.stage ?? 1;
  const isPhonemeMode = contentData.answerType === "phoneme";

  // Exact-match cho phoneme (IPA không normalize được), normalize cho word.
  const checkCorrect = useCallback(
    (optContent: string) =>
      isPhonemeMode ? optContent === question.answer : normalizeAnswer(optContent) === normalizeAnswer(question.answer),
    [isPhonemeMode, question.answer],
  );

  // Phoneme mode: option = contrastPhonemes (N nút IPA). Word mode (cũ): option = contentData.options.
  const options = useMemo(() => {
    return isPhonemeMode
      ? (contentData.contrastPhonemes ?? []).map((ph, i) => ({
          id: `${question.id}-ph-${i}`,
          content: ph,
        }))
      : (question.options.length > 0
          ? question.options
          : contentData.options
              ?.map((option, index) => ({
                id: String(option.id ?? `${question.id}-json-option-${index}`),
                content: String(option.text ?? option.content ?? ""),
              }))
              .filter((option) => option.content.length > 0) ?? []);
  }, [isPhonemeMode, contentData.contrastPhonemes, contentData.options, question.id, question.options]);

  // Inline audio playback — fresh Audio per play() to avoid ended-state issues.
  const [isPlaying, setIsPlaying] = useState(false);

  const playAudio = useCallback(() => {
    if (!contentData.audioUrl) return;
    const audio = new Audio(contentData.audioUrl);
    audio.onended = () => setIsPlaying(false);
    setIsPlaying(true);
    audio.play().catch((error) => {
      console.warn("Audio playback failed:", error);
      setIsPlaying(false);
    });
  }, [contentData.audioUrl]);

  // Auto-play audio khi chuyển câu mới (sau lần click đầu tiên user gesture được browser ghi nhận).
  const autoPlayRef = useRef<HTMLAudioElement | null>(null);
  useEffect(() => {
    autoPlayRef.current?.pause();
    autoPlayRef.current = null;
    if (!contentData.audioUrl) return;
    const audio = new Audio(contentData.audioUrl);
    audio.onended = () => setIsPlaying(false);
    autoPlayRef.current = audio;
    let cancelled = false;
    audio.play().then(() => {
      if (!cancelled) setIsPlaying(true);
    }).catch(() => {
      if (!cancelled) setIsPlaying(false);
    });
    return () => {
      cancelled = true;
      audio.pause();
      audio.onended = null;
      autoPlayRef.current = null;
    };
  }, [question.id, contentData.audioUrl]);

  // Stage 2 skeleton: split theo "_" và highlight ô trống màu warning.
  const skeletonParts = contentData.skeleton ? contentData.skeleton.split("_") : [];

  // Keyboard shortcuts (Fix 5): Space = replay audio, 1-9 = pick & auto-submit option.
  // Enter no longer needed because click/key pick auto-submits immediately.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;

      if (event.key === " " || event.code === "Space") {
        // Space: replay audio (always allowed).
        event.preventDefault();
        playAudio();
        return;
      }
      // 1-9: pick option by index and auto-submit (only before answered).
      const num = Number.parseInt(event.key, 10);
      if (!Number.isNaN(num) && num >= 1 && num <= 9 && !isAnswered) {
        const idx = num - 1;
        if (idx < options.length) {
          const opt = options[idx];
          if (opt) {
            event.preventDefault();
            onAnswer(
              checkCorrect(opt.content),
              opt.content,
              question.options.length > 0 ? opt.id : null,
            );
          }
        }
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [playAudio, isAnswered, options, checkCorrect, onAnswer, question.options.length]);

  // Hint: eliminate 1 wrong option.
  const handleHint = useCallback(() => {
    if (isAnswered || hintTokens <= 0 || eliminatedIds.size > 0) return;
    const wrongOption = options.find((o) => !checkCorrect(o.content) && !eliminatedIds.has(o.id));
    if (!wrongOption) return;
    setEliminatedIds((prev) => new Set([...prev, wrongOption.id]));
    onUseHint?.();
  }, [isAnswered, hintTokens, options, eliminatedIds, checkCorrect, onUseHint]);

  const canUseHint = !isAnswered && hintTokens > 0 && eliminatedIds.size === 0 && options.length > 2;

  return (
    <div className="w-full space-y-10 text-center">
      {/* Onboarding tooltip (Fix 10) — first-time Listening users only. */}
      {showOnboarding && (
        <div
          role="region"
          aria-label="Hướng dẫn nhanh cho chế độ nghe"
          className="animate-fade-in rounded-2xl border-2 border-cyan-200 bg-white p-5 text-left text-base text-slate-800 shadow-lg shadow-cyan-500/10 backdrop-blur-sm"
        >
          <p className="mb-3 leading-relaxed">
            <span aria-hidden="true">💡</span> <strong className="text-cyan-900">Nghe & chọn âm:</strong> bấm nút loa để nghe,
            chọn IPA bạn nghe được, nhấn{" "}
            <kbd className="rounded border border-cyan-300 bg-cyan-50 px-1.5 py-0.5 text-xs font-bold text-cyan-900">Enter</kbd>{" "}
            để xác nhận (hoặc dùng phím <kbd className="rounded border border-cyan-300 bg-cyan-50 px-1.5 py-0.5 text-xs font-bold text-cyan-900">1–9</kbd>).
          </p>
          <button
            type="button"
            onClick={dismissOnboarding}
            className="inline-flex items-center gap-1 rounded-full bg-gradient-to-r from-cyan-700 to-blue-800 px-5 py-1.5 text-sm font-bold text-white shadow-md shadow-cyan-500/20 transition hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
          >
            Đã hiểu
          </button>
        </div>
      )}

      <div className="flex flex-col items-center gap-4">
        {/* Stage 1 (I do): hiện từ, không hiện IPA */}
        {stage === 1 && contentData.word && (
          <h2 className="text-3xl font-bold text-cyan-900 sm:text-4xl" aria-label={contentData.word}>
            {contentData.word}
          </h2>
        )}

        {/* Stage 2 (We do): hiện skeleton IPA khuyết */}
        {stage === 2 && contentData.skeleton && (
          <h2 className="font-ipa text-3xl font-bold text-cyan-900 sm:text-4xl" aria-label={`IPA khuyết: ${contentData.skeleton}`}>
            {skeletonParts.map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && (
                  <span className="mx-1 inline-block min-w-[1ch] rounded-md border border-amber-500 bg-amber-100 px-2 text-amber-900 underline">
                    _
                  </span>
                )}
              </span>
            ))}
          </h2>
        )}

        {/* Nút Loa to + nút Hint gọn cạnh nhau (Fix 8). */}
        <div className="flex flex-col items-center gap-2">
          <button
            type="button"
            onClick={playAudio}
            disabled={!contentData.audioUrl}
            aria-label="Phát lại audio (phím Space)"
            title="Phát lại audio (Space)"
            className={`group relative flex h-20 w-20 items-center justify-center rounded-full border-2 border-cyan-600 bg-cyan-100 text-cyan-900 transition-all hover:border-cyan-700 hover:bg-cyan-200 hover:text-cyan-950 hover:shadow-[0_0_40px_rgba(14,116,144,0.5)] active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-700 disabled:cursor-not-allowed disabled:opacity-50 ${isPlaying ? "animate-pulse shadow-[0_0_50px_rgba(14,116,144,0.6)]" : ""}`}
          >
            <Volume2 className="h-10 w-10 transition-transform group-hover:scale-110" aria-hidden="true" />
            {/* Glow ring on playing */}
            {isPlaying && (
              <span className="absolute inset-0 -z-10 animate-ping rounded-full bg-cyan-300/40" />
            )}
          </button>
          {canUseHint && (
            <button
              type="button"
              onClick={handleHint}
              aria-label={`Dùng gợi ý để loại 1 đáp án sai — còn ${hintTokens} lượt`}
              title={`Dùng gợi ý để loại 1 đáp án sai (${hintTokens} còn)`}
              className="inline-flex h-11 w-11 items-center justify-center rounded-full border-2 border-amber-500 bg-amber-100 text-amber-900 transition hover:bg-amber-200 hover:shadow-[0_0_15px_rgba(180,83,9,0.4)] active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-amber-700"
            >
              <span aria-hidden="true" className="text-lg">💡</span>
            </button>
          )}
        <p className="text-xs italic text-neutral-600">Bấm vào loa để nghe lại</p>
        </div>
      </div>

      <div className="w-full">
        <p className="mb-6 text-base sm:text-lg font-semibold text-neutral-600">Chọn âm bạn vừa nghe</p>
        <div className="flex w-full flex-row justify-center gap-3">
          {options.map((option, optionIndex) => {
            // Eliminated options (hint used) — show dashed placeholder + "Đã loại" label (Fix 7).
            if (eliminatedIds.has(option.id)) {
              return (
                <div
                  key={option.id}
                  title="Đáp án này đã bị loại do dùng gợi ý"
                  aria-label={`Đáp án đã loại: ${option.content}`}
                  className="flex-1 max-w-[14rem] h-20 sm:h-24 rounded-xl border-2 border-dashed border-stone-300 bg-stone-100 px-4 sm:px-6 flex flex-col items-center justify-center opacity-50"
                >
                  <span className="font-ipa text-2xl sm:text-3xl text-stone-400 line-through">{option.content}</span>
                  <span className="mt-1 inline-flex items-center gap-1 text-xs font-medium text-stone-500" aria-hidden="true">
                    <span>🚫</span> Đã loại
                  </span>
                </div>
              );
            }

            let buttonClass = "border-stone-300 bg-white text-slate-900 hover:border-cyan-700 hover:bg-cyan-50 hover:text-cyan-950 hover:shadow-[0_0_20px_rgba(14,116,144,0.3)]";
            if (isAnswered) {
              if (checkCorrect(option.content)) {
                buttonClass = "border-success-500 bg-success-50 text-success-700 ring-4 ring-success-100";
              } else if (option.content === selectedAnswer) {
                buttonClass = "border-error-500 bg-error-50 text-error-700 shadow-[0_0_25px_rgba(244,63,94,0.4)] animate-shake";
              } else {
                buttonClass = "border-neutral-200 bg-neutral-50 text-neutral-400";
              }
            } else if (selectedAnswer === option.content) {
              // Chưa submit nhưng đã chọn — highlight pending
              buttonClass = "border-cyan-500 bg-cyan-50 text-cyan-900 ring-2 ring-cyan-300";
            }

            const keyboardHint = optionIndex < 9 ? ` (phím ${optionIndex + 1})` : "";
            const a11yLabel = isAnswered
              ? `${option.content} — ${checkCorrect(option.content) ? "Đúng" : option.content === selectedAnswer ? "Sai" : ""}`
              : `${option.content}${keyboardHint}`;

            return (
              <button
                key={option.id}
                type="button"
                onClick={() => {
                  if (isAnswered) return;
                  onAnswer(
                    checkCorrect(option.content),
                    option.content,
                    question.options.length > 0 ? option.id : null,
                  );
                }}
                aria-pressed={selectedAnswer === option.content}
                aria-label={a11yLabel}
                className={`flex-1 max-w-[14rem] h-20 sm:h-24 rounded-xl border-2 px-4 sm:px-6 font-ipa text-2xl sm:text-3xl font-bold transition-all active:scale-95 focus:outline-none focus-visible:ring-4 focus-visible:ring-cyan-700 ${buttonClass}`}
              >
                {option.content}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
