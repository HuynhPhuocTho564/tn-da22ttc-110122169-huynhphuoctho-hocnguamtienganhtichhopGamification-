"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import ConfirmModal from "@/components/ui/ConfirmModal";
import ListenFeedbackSheet from "./ListenFeedbackSheet";
import ExerciseSummaryScreen from "./ExerciseSummaryScreen";
import PraisePopup from "./components/PraisePopup";
import QuestionRenderer from "./components/QuestionRenderer";
import { useExerciseEngine } from "./useExerciseEngine";

// Re-exported for backward compatibility (10 consumer files import from here)
export type {
  ExerciseQuestion,
  ExerciseData,
  SubmitResult,
  IncorrectQuestion,
  WordPrompt,
} from "./types";
export { parseWordPrompt, normalizeAnswer } from "./parse-word-prompt";
import type { ExerciseData, EngineUnlocks } from "./types";

/**
 * Exercise engine orchestrator component.
 *
 * All state and handlers are managed by useExerciseEngine hook.
 * This component is purely responsible for layout and rendering.
 *
 * @see useExerciseEngine — core logic hook (~190 lines)
 * @see components/ — extracted sub-components (AudioButton, ListenChooseQuestion, PraisePopup)
 * @see types.ts — shared type definitions
 * @see parse-word-prompt.ts — question content parsing utilities
 */
export default function ExerciseEngineClient({
  exercise,
  unlocks = { unlockedSlowAudio: false, unlockedIpaReveal: false },
}: {
  exercise: ExerciseData;
  unlocks?: EngineUnlocks;
}) {
  const router = useRouter();

  const {
    currentIndex,
    score,
    incorrectQuestions,
    submitStatus,
    submitResult,
    submitError,
    isAnswered,
    isCorrect,
    selectedAnswer,
    isFinished,
    muted,
    currentQuestion,
    progressPercent,
    currentHint,
    questions,
    handleAnswerListen,
    handleNextVoice,
    handleNextListen,
    combo,
  } = useExerciseEngine(exercise, unlocks);

  // ── Hint Token & Second Chance state ──
  const [localHintTokens, setLocalHintTokens] = useState(unlocks.hintTokens ?? 0);
  const [localSecondChances, setLocalSecondChances] = useState(unlocks.secondChances ?? 0);
  // Merge local counts into unlocks for child components
  const effectiveUnlocks = { ...unlocks, hintTokens: localHintTokens, secondChances: localSecondChances };

  const handleUseHint = useCallback(() => {
    if (localHintTokens <= 0) return;
    setLocalHintTokens((prev) => prev - 1);
    fetch("/api/use-item", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: "hint_token" }),
    }).then((res) => {
      if (!res.ok) {
        // Rollback on server error
        setLocalHintTokens((prev) => prev + 1);
      }
    }).catch(() => {
      setLocalHintTokens((prev) => prev + 1);
    });
  }, [localHintTokens]);

  const handleUseSecondChance = useCallback(() => {
    if (localSecondChances <= 0) return;
    setLocalSecondChances((prev) => prev - 1);
    fetch("/api/use-item", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: "second_chance" }),
    }).then((res) => {
      if (!res.ok) {
        setLocalSecondChances((prev) => prev + 1);
      }
    }).catch(() => {
      setLocalSecondChances((prev) => prev + 1);
    });
  }, [localSecondChances]);

  // Task 2.5: Confirm trước khi thoát bài đang làm (Nielsen H5 — Error Prevention).
  // Chỉ cảnh báo khi đã trả lời ≥1 câu và chưa kết thúc → tránh cảnh báo phiền
  // khi user mới vào chưa làm gì hoặc đã xong.
  const hasProgress = currentIndex > 0 && !isFinished;
  const [showExitModal, setShowExitModal] = useState(false);

  const handleBack = useCallback(() => {
    if (hasProgress) {
      setShowExitModal(true);
      return;
    }
    router.replace("/learning_map");
  }, [hasProgress, router]);

  const confirmExit = useCallback(() => {
    setShowExitModal(false);
    router.replace("/learning_map");
  }, [router]);

  // Fix 5 (Priority 2): Esc to exit (same flow as [X] button — uses handleBack with confirm guard).
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      const target = event.target as HTMLElement | null;
      const tag = target?.tagName;
      if (tag === "INPUT" || tag === "TEXTAREA" || target?.isContentEditable) return;
      event.preventDefault();
      handleBack();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [handleBack]);

  // Cảnh báo khi user đóng tab / reload / browser back khi đang làm bài.
  useEffect(() => {
    if (!hasProgress) return;
    const handler = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      // Chrome/Firefox hiện thông báo native khi preventDefault được gọi.
      // returnValue cần set cho một số trình duyệt cũ.
      event.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [hasProgress]);

  // === Empty exercise guard ===
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-neutral-50 p-8">
        <Card>
          <h1 className="text-2xl font-bold text-neutral-900">Bài tập chưa có câu hỏi</h1>
          <p className="mt-2 text-neutral-600">Bài tập này chưa có nội dung. Vui lòng chọn bài khác.</p>
          <Button className="mt-6" onClick={() => router.replace("/learning_map")}>
            Quay về lộ trình
          </Button>
        </Card>
      </div>
    );
  }

  // === Finished: loading or summary ===
  if (isFinished) {
    if (!submitResult) {
      return (
        <div className="flex min-h-screen flex-col items-center bg-neutral-50 p-6 sm:p-8">
          <Card className="w-full max-w-2xl space-y-8 p-8 text-center sm:p-12">
            <p className="text-lg font-bold text-neutral-700">
              {submitStatus === "error"
                ? submitError || "Không lưu được kết quả."
                : "Đang lưu kết quả..."}
            </p>
          </Card>
        </div>
      );
    }

    return (
      <ExerciseSummaryScreen
        exercise={exercise}
        submitResult={submitResult}
        incorrectQuestions={incorrectQuestions}
        submitStatus={submitStatus}
        submitError={submitError}
        onRetry={() => window.location.reload()}
        onExit={() => router.replace("/learning_map")}
      />
    );
  }

  const isVoiceTask = currentQuestion?.type === "qtype-2-voice" || currentQuestion?.type === "qtype-3-minimal-pairs";

  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-stone-200">
      <header className="sticky top-0 z-10 flex items-center justify-between gap-3 border-b border-stone-200/80 bg-white/85 px-4 py-3 shadow-sm backdrop-blur-md sm:px-6">
        {/* LEFT: [X] exit button only — Score moved to RIGHT for visual balance. */}
        <div className="flex items-center shrink-0">
          <button
            type="button"
            onClick={handleBack}
            aria-label="Thoát bài tập"
            className="inline-flex h-11 w-11 items-center justify-center rounded-full text-2xl text-slate-600 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95 focus:outline-none focus-visible:ring-2 focus-visible:ring-cyan-700"
          >
            ✕
          </button>
        </div>

        {/* CENTER: Progress Bar + question count */}
        <div className="flex flex-1 items-center gap-3">
          <div
            className="flex-1"
            role="progressbar"
            aria-label={`Tiến độ ${currentIndex + 1} trên ${questions.length}`}
          >
            {/* Themed light progress bar (cyan gradient with soft glow) */}
            <div className="h-2.5 overflow-hidden rounded-full bg-stone-200 shadow-inner">
              <div
                className="h-full rounded-full bg-gradient-to-r from-cyan-600 to-blue-700 shadow-[0_0_12px_rgba(8,145,178,0.4)] transition-all duration-500"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>
          <span className="shrink-0 text-sm font-bold text-slate-500">
            {currentIndex + 1}/{questions.length}
          </span>
        </div>

        {/* RIGHT: Score (mục tiêu chính) + Combo (bonus). Score trước, Combo sau. */}
        <div className="flex items-center gap-3 shrink-0">
          <div
            className="rounded-full border-2 border-cyan-200 bg-cyan-50 px-4 py-1.5 text-right font-bold shadow-[0_0_15px_rgba(8,145,178,0.2)] backdrop-blur-sm"
            aria-label={`Điểm hiện tại ${score}`}
          >
            <span className="text-lg text-cyan-900">{score}</span>{" "}
            <span className="text-xs font-medium text-cyan-800">điểm</span>
          </div>
          {combo.milestone > 0 && (
            <span
              className="text-base font-bold text-amber-600 drop-shadow-[0_0_8px_rgba(180,83,9,0.4)]"
              title={`Combo ${combo.combo} câu đúng liên tiếp`}
            >
              {"🔥".repeat(combo.milestone)}
            </span>
          )}
        </div>
      </header>

      {/* Praise popup (0.6s on combo milestone) */}
      {combo.praise && <PraisePopup text={combo.praise} onDismiss={combo.clearPraise} />}

      <main className="relative mx-auto w-full max-w-2xl flex-1 overflow-hidden px-4 py-8 sm:px-6">
        <div className="relative mt-10 rounded-3xl border border-stone-200/80 bg-white p-8 shadow-xl shadow-stone-900/5 md:p-12 flex flex-col items-center">
          <QuestionRenderer
            question={currentQuestion}
            unlocks={effectiveUnlocks}
            isAnswered={isAnswered}
            selectedAnswer={selectedAnswer}
            muted={muted}
            onAnswerListen={handleAnswerListen}
            onNextVoice={handleNextVoice}
            onUseHint={handleUseHint}
          />
        </div>
      </main>

      {!isVoiceTask && isAnswered && (
        <ListenFeedbackSheet
          isCorrect={isCorrect}
          selectedAnswer={selectedAnswer}
          question={currentQuestion}
          hint={currentHint}
          onAdvance={handleNextListen}
          secondChances={localSecondChances}
          onUseSecondChance={handleUseSecondChance}
        />
      )}

      <ConfirmModal
        isOpen={showExitModal}
        onClose={() => setShowExitModal(false)}
        onConfirm={confirmExit}
        title="Thoát bài tập?"
        message="Bạn có chắc muốn thoát? Tiến độ hiện tại sẽ không được lưu."
        confirmLabel="Thoát"
        cancelLabel="Tiếp tục làm bài"
      />
    </div>
  );
}
