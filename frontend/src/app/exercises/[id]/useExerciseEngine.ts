"use client";

import { useMemo, useRef, useState } from "react";
import { playSfx, useSfxMuted } from "@/lib/sfx";
import { useComboStreak } from "@/hooks/useComboStreak";
import { useRewardEvents } from "@/components/gamification/effects/RewardEventContext";
import { parseWordPrompt } from "./parse-word-prompt";
import type {
  ExerciseData,
  EngineUnlocks,
  SubmitAnswer,
  SubmitResult,
  IncorrectQuestion,
} from "./types";

/**
 * Core exercise engine hook — encapsulates all state and handlers.
 *
 * Manages: question navigation, answer recording, exercise submission,
 * reward emission, combo streak tracking, and SFX feedback.
 *
 * Extracted from ExerciseEngineClient (was ~190 lines of inline state/handlers).
 *
 * Design decision: single hook (not split into submit + navigation hooks)
 * because recordAnswer is shared state between both concerns.
 * Splitting would require explicit state coordination — violating KISS.
 */
export function useExerciseEngine(exercise: ExerciseData, unlocks: EngineUnlocks) {
  const { emit } = useRewardEvents();
  const previousLevelRef = useRef(unlocks.userLevel ?? 0);
  const [startedAt] = useState(() => new Date().toISOString());

  // === Navigation & scoring state ===
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [incorrectQuestions, setIncorrectQuestions] = useState<IncorrectQuestion[]>([]);
  const answersRef = useRef<SubmitAnswer[]>([]);

  // === Submit state ===
  const [submitStatus, setSubmitStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [submitResult, setSubmitResult] = useState<SubmitResult | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // === Answer feedback state ===
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  // === SP1 feedback: SFX (ting/buzz) + combo streak (🔥 + praise) ===
  const combo = useComboStreak();
  const maxComboRef = useRef(0);
  const [muted, setMuted] = useSfxMuted();

  // === Derived values ===
  const questions = exercise.questions;
  const currentQuestion = questions[currentIndex];
  const progressPercent = questions.length > 0 ? (currentIndex / questions.length) * 100 : 0;

  const currentHint = useMemo(() => {
    if (!currentQuestion) return "";
    return parseWordPrompt(currentQuestion.content).hint ?? "";
  }, [currentQuestion]);

  // === Answer recording (shared between listen and voice handlers) ===
  const recordAnswer = (answer: SubmitAnswer) => {
    const existingIndex = answersRef.current.findIndex((item) => item.questionId === answer.questionId);
    const nextAnswers = [...answersRef.current];

    if (existingIndex >= 0) {
      nextAnswers[existingIndex] = answer;
    } else {
      nextAnswers.push(answer);
    }

    answersRef.current = nextAnswers;
    return nextAnswers;
  };

  // === Submit exercise to API + emit reward events ===
  const submitExercise = async (finalAnswers: SubmitAnswer[]) => {
    setSubmitStatus("submitting");
    setSubmitError(null);

    try {
      const response = await fetch("/api/exercises/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          exerciseId: exercise.id,
          startedAt,
          completedAt: new Date().toISOString(),
          answers: finalAnswers,
          maxCombo: maxComboRef.current,
        }),
      });

      const payload = await response.json();

      if (!response.ok || !payload.success) {
        setSubmitStatus("error");
        setSubmitError(payload.error?.message || "Không lưu được kết quả bài làm.");
        return;
      }

      setSubmitResult(payload.data);
      setSubmitStatus("success");

      // === Emit reward celebration events ===
      const rewards = payload.data?.rewards;
      const progress = payload.data?.progress;
      const badges = payload.data?.badgesAwarded;

      if (rewards) {
        if (rewards.totalXpEarned > 0) {
          emit({ type: "xp", amount: rewards.totalXpEarned, label: `+${rewards.totalXpEarned} EXP`, icon: "⭐" });
        }
        if (rewards.gemsEarned > 0) {
          emit({ type: "diamonds", amount: rewards.gemsEarned, label: `+${rewards.gemsEarned} 💎`, icon: "💎" });
        }
        if (rewards.questXpEarned > 0) {
          emit({
            type: "quest_complete",
            amount: rewards.questXpEarned,
            questGems: rewards.questGemsEarned,
            label: "Nhiệm vụ hoàn thành!",
            questDesc: "Nhiệm vụ hàng ngày",
          });
        }
      }
      if (progress && progress.level > previousLevelRef.current) {
        emit({ type: "level_up", level: progress.level, label: `Lên cấp ${progress.level}!`, icon: "🎯" });
        previousLevelRef.current = progress.level;
      }
      if (badges && Array.isArray(badges)) {
        for (const badge of badges) {
          emit({ type: "badge_earned", badgeName: badge.name, label: `Huy hiệu: ${badge.name}`, icon: "🏆" });
        }
      }

      // UX-1: Near-miss notification — check if any badges are now at ≥80% (Goal-Gradient)
      try {
        const badgeResp = await fetch("/api/badges");
        const badgeData = await badgeResp.json();
        if (badgeData.success && badgeData.data?.available) {
          for (const avail of badgeData.data.available) {
            if (avail.progress && avail.progress.target > 0) {
              const pct = avail.progress.current / avail.progress.target;
              if (pct >= 0.8 && pct < 1) {
                const remaining = avail.progress.target - avail.progress.current;
                emit({
                  type: "streak_milestone",
                  label: `🔥 Gần đạt: ${avail.name} — còn ${remaining}!`,
                  icon: "🔥",
                });
                break; // Only show 1 near-miss to avoid spam
              }
            }
          }
        }
      } catch {
        // Non-critical: near-miss check failure doesn't affect exercise flow
      }
    } catch {
      setSubmitStatus("error");
      setSubmitError("Không kết nối được API lưu bài làm.");
    }
  };

  // === Finish exercise: mark finished, reset combo, submit ===
  const finishExercise = (finalAnswers = answersRef.current) => {
    setIsFinished(true);
    combo.reset();
    void submitExercise(finalAnswers);
  };

  const addIncorrectQuestion = (selected: string) => {
    setIncorrectQuestions((current) => [
      ...current,
      {
        question: currentQuestion,
        selected,
        correct: currentQuestion.answer,
      },
    ]);
  };

  // === Listen-choose answer handler (tap stress, choose weak/linking/assimilation also use this) ===
  const handleAnswerListen = (
    correct: boolean,
    answerOpt: string,
    selectedOptionId?: string | null,
    selectedTextOverride?: string,
  ) => {
    setIsAnswered(true);
    setIsCorrect(correct);
    setSelectedAnswer(answerOpt);
    recordAnswer({
      questionId: currentQuestion.id,
      selectedOptionId: selectedOptionId ?? null,
      selectedText: selectedTextOverride ?? answerOpt,
      transcript: null,
      timeSpent: null,
    });

    if (correct) {
      setScore((current) => current + currentQuestion.score);
      playSfx("correct");
      combo.onCorrect();
      maxComboRef.current = Math.max(maxComboRef.current, combo.combo + 1);
    } else {
      addIncorrectQuestion(answerOpt);
      playSfx("wrong");
      combo.onWrong();
    }
  };

  // === Voice question handler (speak word, sentence, minimal pairs) ===
  const handleNextVoice = (correct: boolean, transcript: string) => {
    const finalAnswers = recordAnswer({
      questionId: currentQuestion.id,
      selectedText: null,
      transcript,
      timeSpent: null,
    });

    if (correct) {
      setScore((current) => current + currentQuestion.score);
      playSfx("correct");
      combo.onCorrect();
      maxComboRef.current = Math.max(maxComboRef.current, combo.combo + 1);
    } else {
      addIncorrectQuestion(transcript);
      playSfx("wrong");
      combo.onWrong();
    }

    if (currentIndex < questions.length - 1) {
      setCurrentIndex((current) => current + 1);
    } else {
      finishExercise(finalAnswers);
    }
  };

  // === Listen-choose "next" button handler ===
  const handleNextListen = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((current) => current + 1);
      setIsAnswered(false);
      setSelectedAnswer(null);
    } else {
      finishExercise();
    }
  };

  return {
    // State
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
    setMuted,
    // Derived
    currentQuestion,
    progressPercent,
    currentHint,
    questions,
    // Handlers
    handleAnswerListen,
    handleNextVoice,
    handleNextListen,
    // Combo (for 🔥 rendering + praise popup)
    combo,
  };
}
