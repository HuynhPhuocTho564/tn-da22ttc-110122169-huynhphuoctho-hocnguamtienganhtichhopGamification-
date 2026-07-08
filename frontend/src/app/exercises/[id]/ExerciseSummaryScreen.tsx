"use client";

import { useEffect, useMemo } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import AchievementShare from "@/components/gamification/AchievementShare";
import { playSfx } from "@/lib/sfx";
import { celebrate } from "@/lib/confetti";
import { useCountUp } from "@/lib/animations/useCountUp";
import { getStarsFromScore, getStarsDisplay } from "@/lib/gamification/scoring-helpers";
import {
  parseWordPrompt,
  type ExerciseData,
  type ExerciseQuestion,
  type IncorrectQuestion,
  type SubmitResult,
} from "./ExerciseEngineClient";

type ExerciseSummaryScreenProps = {
  exercise: ExerciseData;
  submitResult: SubmitResult;
  incorrectQuestions: IncorrectQuestion[];
  submitStatus: "idle" | "submitting" | "success" | "error";
  submitError: string | null;
  onRetry: () => void; // "Làm lại bài này" (router.reload)
  onExit: () => void; // "Về lộ trình" (router.push /learning_map)
};

// Lời khen theo rating (tầng 1).
function praiseByRating(rating: string): string {
  switch (rating) {
    case "EXCELLENT":
      return "Tuyệt đỉnh!";
    case "GOOD":
      return "Hoàn thành xuất sắc!";
    case "PASS":
      return "Bạn đang tiến bộ!";
    case "NEEDS_PRACTICE":
    default:
      return "Cần luyện thêm!";
  }
}

// Màu vòng tròn % theo rating (conic-gradient).
function ringColorByRating(rating: string): string {
  switch (rating) {
    case "EXCELLENT":
    case "GOOD":
      return "#10b981"; // success
    case "PASS":
      return "#3b82f6"; // primary
    case "NEEDS_PRACTICE":
    default:
      return "#f59e0b"; // warning
  }
}

// Hiện word từ content JSON (word đơn hoặc array pair) — tương đương formatQuestionWord engine.
function formatQuestionWord(question: ExerciseQuestion): string {
  try {
    const parsed = JSON.parse(question.content);
    if (Array.isArray(parsed)) {
      return parsed.map((item: { word?: string }) => item.word).filter(Boolean).join(" & ");
    }
    if (parsed?.word) return String(parsed.word);
  } catch {
    // Plain text fallback below.
  }
  return question.content;
}

// Nút 🔊 nghe lại audio (tái dụng MiniSpeaker pattern từ ListenFeedbackSheet).
function ReplayButton({ audioUrl }: { audioUrl?: string }) {
  if (!audioUrl) return null;
  const play = () => {
    const audio = new Audio(audioUrl);
    audio.play().catch((e) => console.warn("replay audio failed:", e));
  };
  return (
    <button
      type="button"
      onClick={play}
      aria-label="Nghe lại âm này"
      className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-bold text-neutral-700 transition-all active:scale-[0.97] hover:border-primary-300 hover:text-primary-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500/30"
    >
      <span aria-hidden="true">🔊</span> Nghe lại
    </button>
  );
}

export default function ExerciseSummaryScreen({
  exercise,
  submitResult,
  incorrectQuestions,
  submitStatus,
  submitError,
  onRetry,
  onExit,
}: ExerciseSummaryScreenProps) {
  const score = submitResult.exerciseScore;
  // Stars (Micro level — rule 60-80-90): dùng cho prominent display + share bonus.
  // isHighScore = 3 sao (≥90%) thay vì score >= 80 (chunk 3 master plan).
  const stars = getStarsFromScore(score);
  const starsDisplay = getStarsDisplay(stars);
  const isHighScore = stars === 3;
  const ringColor = ringColorByRating(submitResult.rating);
  const praise = praiseByRating(submitResult.rating);

  // Confetti + tada khi >= 80% (chỉ khi lưu thành công, không khi đang submit/error).
  useEffect(() => {
    if (submitStatus !== "success") return;
    if (!isHighScore) return;
    celebrate();
    playSfx("tada");
  }, [submitStatus, isHighScore]);

  // Progress bias client-side (tầng 2): exerciseScore - previousBestScore.
  const progressBias = useMemo(() => {
    if (submitResult.previousBestScore === null) return null;
    return score - submitResult.previousBestScore;
  }, [score, submitResult.previousBestScore]);

  // Count-up animation cho reward grid (Chunk C5) — dopamine-friendly khi nhận thưởng.
  const animatedXp = useCountUp(submitResult.rewards.totalXpEarned, { durationMs: 1000 });
  const animatedRanking = useCountUp(submitResult.rewards.totalRankingDelta, { durationMs: 1200 });
  const animatedGems = useCountUp(submitResult.rewards.gemsEarned, { durationMs: 900 });

  // Exercise type display name (extract from ID like "ex-map-t1-g01-i-ih-listen_choose" → "listen_choose").
  const exerciseType = exercise.id.split("-").pop() ?? "";
  const exerciseTypeDisplay: Record<string, string> = {
    listen_choose: "Luyện nghe chọn đáp án",
    speak_word: "Luyện nói từ",
    speak_sentence: "Luyện nói câu",
    speak_minimal_pairs: "Phân biệt cặp tối thiểu",
    choose_linking: "Liên kết âm",
    choose_assimilation: "Hòa assimilation",
    choose_weak: "Dạng yếu",
    tap_stress: "Nhấn âm tiết",
  };
  const typeName = exerciseTypeDisplay[exerciseType] ?? exerciseType;

  // Correct count for quantitative summary.
  const correctCount = submitResult.exerciseScore === 0
    ? 0
    : Math.round((submitResult.exerciseScore / 100) * exercise.questions.length);
  const totalQuestions = exercise.questions.length;

  return (
    <div className="flex min-h-screen flex-col items-center bg-neutral-50 p-6 sm:p-8">
      <Card className="w-full max-w-2xl space-y-8 rounded-3xl border-0 bg-gradient-to-b from-white via-white to-primary-50/60 p-8 text-center shadow-2xl shadow-primary-900/10 sm:p-12">
        {/* ===== HEADER: tên bài + dạng bài ===== */}
        <div className="space-y-2">
          <h1 className="text-3xl font-black text-neutral-900">{exercise.name}</h1>
          <p className="text-base font-bold text-primary-600">{typeName}</p>
          <div className="mx-auto mt-2 h-px w-24 bg-primary-300" aria-hidden="true" />
        </div>

        {/* ===== TẦNG 1 (top): vòng tròn % + quant summary ===== */}
        <div className="space-y-3">
          {/* Vòng tròn % CSS conic-gradient (không lib). */}
          <div
            className="mx-auto flex h-44 w-44 items-center justify-center rounded-full text-4xl font-black text-neutral-900 shadow-lg"
            style={{
              background: `conic-gradient(${ringColor} ${score}%, #e5e7eb 0)`,
            }}
            role="img"
            aria-label={`Điểm ${score} trên 100 — ${starsDisplay.label}`}
          >
            <div className="flex h-36 w-36 flex-col items-center justify-center rounded-full bg-white shadow-inner">
              <span className="text-5xl font-black" style={{ color: ringColor }}>
                {score}%
              </span>
              {/* 🌟 Stars display (Micro level — rule 60-80-90) */}
              <span
                className={`mt-1 text-2xl leading-none ${starsDisplay.colorClass}`}
                aria-label={starsDisplay.label}
              >
                {starsDisplay.emoji}
              </span>
              <span className="mt-0.5 text-xs font-bold text-slate-700">
                {starsDisplay.label}
              </span>
            </div>
          </div>
          {/* Quantitative summary: "Đúng X/Y câu" */}
          <p className="text-xl font-black text-neutral-800">
            Đúng <span className="text-success-600">{correctCount}</span>/{totalQuestions} câu
          </p>
          {/* Progress bias — ngay hàng Đúng X/Y câu */}
          {progressBias !== null && (
            <div className="rounded-lg bg-neutral-100 px-4 py-2 text-sm font-bold">
              {progressBias > 0 && (
                <p className="text-success-700">Tốt hơn {progressBias}% so với lần trước!</p>
              )}
              {progressBias === 0 && <p className="text-neutral-600">Cùng điểm lần trước.</p>}
              {progressBias < 0 && (
                <p className="text-warning-700">
                  Thấp hơn {-progressBias}% so với lần trước — cố gắng nhé!
                </p>
              )}
            </div>
          )}
        </div>

        {/* ===== TẦNG 2 (middle): EXP + streak + badges + progress bias ===== */}
        {submitStatus === "submitting" && (
          <p
            className="inline-flex items-center justify-center gap-2 text-sm font-medium text-neutral-600"
            role="status"
            aria-live="polite"
          >
            <span
              className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-neutral-300 border-t-primary-600"
              aria-hidden="true"
            />
            Đang lưu kết quả và tính EXP...
          </p>
        )}

        {submitStatus === "success" && (
          <div className="space-y-4">
            {/* Reward grid: EXP / Điểm hạng / Diamonds */}
            <div className="grid grid-cols-3 gap-3">
              {/* EXP */}
              <div className="rounded-xl border border-primary-200 bg-primary-100 p-4 text-primary-700 shadow-sm">
                <p className="text-sm font-semibold">⭐ EXP</p>
                <p className="text-2xl font-black tabular-nums">+{animatedXp.toLocaleString()}</p>
                {submitResult.rewards.xpBoostActive && (
                  <p className="mt-1 text-xs font-bold text-amber-600">🔥 x1.5 Sách Thần</p>
                )}
              </div>

              {/* Điểm hạng 🏆 */}
              <div className="rounded-xl border border-amber-200 bg-amber-100 p-4 text-amber-700 shadow-sm">
                <p className="text-sm font-semibold">🏆 Điểm hạng</p>
                <p className="text-2xl font-black tabular-nums">+{animatedRanking.toLocaleString()}</p>
                {submitResult.rewards.dailyBonusRanking > 0 && (
                  <p className="mt-1 text-xs font-bold">
                    +{submitResult.rewards.dailyBonusRanking} bonus
                  </p>
                )}
              </div>

              {/* Diamonds 💎 */}
              <div className="rounded-xl border border-purple-200 bg-purple-100 p-4 text-purple-700 shadow-sm">
                <p className="text-sm font-semibold">💎 Diamonds</p>
                <p className="text-2xl font-black tabular-nums">+{animatedGems.toLocaleString()}</p>
              </div>
            </div>

            {/* Task 6.1: share thành tích khi high score (Nielsen H7 — flexibility) */}
            {isHighScore && (
              <div className="flex justify-center">
                <AchievementShare
                  variant="compact"
                  icon="⭐"
                  title={`Tôi vừa đạt ${score}% bài "${exercise.name}" trên LinguaEcho!`}
                  description={`⭐ +${submitResult.rewards.totalXpEarned} EXP | 🏆 ${submitResult.rating}`}
                />
              </div>
            )}

            {/* Level + EXP hiện tại */}
            <p className="text-sm font-semibold text-neutral-700">
              Level hiện tại:{" "}
              <span className="font-black text-neutral-900">{submitResult.progress.level}</span> — EXP:{" "}
              <span className="font-black text-neutral-900">{submitResult.progress.currentXp}</span>
            </p>
            {submitResult.rewards.xpBoostActive && submitResult.rewards.xpBoostRemaining !== undefined && (
              <p className="text-xs font-bold text-amber-600">
                🔥 Còn {submitResult.rewards.xpBoostRemaining} lần x1.5 EXP
              </p>
            )}
          </div>
        )}

        {submitStatus === "error" && (
          <div className="rounded-lg bg-warning-50 p-4 text-sm text-warning-800" role="alert">
            {submitError || "Kết quả local đã có, nhưng chưa lưu được vào database."}
          </div>
        )}

        {/* ===== TẦNG 3 (bottom): lỗi + nghe lại + 2 nút ===== */}
        {incorrectQuestions.length > 0 && (
          <div className="rounded-2xl border-2 border-error-200 bg-error-100/60 p-6 text-left shadow-sm">
            <h2 className="mb-4 text-lg font-bold text-error-800">Cần chú ý</h2>
            <ul className="space-y-3">
              {incorrectQuestions.map((item, index) => {
                const audioUrl = parseWordPrompt(item.question.content).audioUrl;
                return (
                  <li
                    key={`${item.question.id}-${index}`}
                    className="rounded-xl border border-error-200 bg-white p-4 shadow-sm"
                  >
                    <p className="font-bold text-neutral-900">"{formatQuestionWord(item.question)}"</p>
                    <p className="mt-1 text-sm text-neutral-600">
                      Bạn trả lời{" "}
                      <span className="font-bold text-error-700">{item.selected || "Không rõ"}</span>,
                      đáp án đúng là{" "}
                      <span className="font-bold text-success-700">{item.correct}</span>.
                    </p>
                    <div className="mt-2">
                      <ReplayButton audioUrl={audioUrl} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* 2 nút */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button variant="primary" size="lg" className="min-h-14 text-lg" onClick={onRetry}>
            Làm lại bài này
          </Button>
          <Button variant="ghost" size="lg" className="min-h-14 text-lg" onClick={onExit}>
            Về lộ trình
          </Button>
        </div>
      </Card>
    </div>
  );
}
