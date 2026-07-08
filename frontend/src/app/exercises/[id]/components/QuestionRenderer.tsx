"use client";

import { parseWordPrompt } from "../parse-word-prompt";
import type { ExerciseQuestion, EngineUnlocks } from "../types";
import SpeakWordQuestion from "../SpeakWordQuestion";
import SpeakSentenceQuestion from "../SpeakSentenceQuestion";
import SpeakMinimalPairsQuestion from "../SpeakMinimalPairsQuestion";
import TapStressQuestion from "../TapStressQuestion";
import ChooseWeakQuestion from "../ChooseWeakQuestion";
import ChooseLinkingQuestion from "../ChooseLinkingQuestion";
import ChooseAssimilationQuestion from "../ChooseAssimilationQuestion";
import ListenChooseQuestion from "./ListenChooseQuestion";

/**
 * Question type switch renderer.
 *
 * Maps question.type to the correct question sub-component.
 * Extracted from ExerciseEngineClient (was 7 conditional blocks inline).
 *
 * Supported question types:
 *   qtype-1-mc:              Listen & choose (multiple choice)
 *   qtype-2-voice:           Speak word or sentence
 *   qtype-3-minimal-pairs:   Speak minimal pairs
 *   qtype-4-tap-stress:      Tap stress pattern
 *   qtype-5-choose-weak:     Choose weak form
 *   qtype-6-choose-linking:  Choose linking pattern
 *   qtype-7-choose-assimilation: Choose assimilation pattern
 */
export default function QuestionRenderer({
  question,
  unlocks,
  isAnswered,
  selectedAnswer,
  muted,
  onAnswerListen,
  onNextVoice,
  onUseHint,
}: {
  question: ExerciseQuestion;
  unlocks: EngineUnlocks;
  isAnswered: boolean;
  selectedAnswer: string | null;
  muted?: boolean;
  onAnswerListen: (
    correct: boolean,
    answerOpt: string,
    selectedOptionId?: string | null,
    selectedTextOverride?: string,
  ) => void;
  onNextVoice: (correct: boolean, transcript: string) => void;
  onUseHint?: () => void;
}) {
  switch (question.type) {
    case "qtype-1-mc":
      return (
        <ListenChooseQuestion
          question={question}
          onAnswer={onAnswerListen}
          isAnswered={isAnswered}
          selectedAnswer={selectedAnswer}
          hintTokens={unlocks.hintTokens}
          onUseHint={onUseHint}
        />
      );

    case "qtype-2-voice": {
      // Check mode field to determine word vs sentence component
      let mode = "";
      try {
        const parsed = JSON.parse(question.content) as { mode?: string };
        mode = parsed.mode ?? "";
      } catch { /* ignore */ }
      if (mode === "speak_sentence") {
        return (
          <SpeakSentenceQuestion
            key={question.id}
            question={question}
            onNext={onNextVoice}
            unlockedSlowAudio={unlocks.unlockedSlowAudio}
            unlockedIpaReveal={unlocks.unlockedIpaReveal}
          />
        );
      }
      return <SpeakWordQuestion key={question.id} question={question} onNext={onNextVoice} unlockedSlowAudio={unlocks.unlockedSlowAudio} />;
    }

    case "qtype-3-minimal-pairs":
      return <SpeakMinimalPairsQuestion key={question.id} question={question} onNext={onNextVoice} />;

    case "qtype-4-tap-stress":
      return (
        <TapStressQuestion
          key={question.id}
          question={question}
          onAnswer={onAnswerListen}
          isAnswered={isAnswered}
          selectedAnswer={selectedAnswer}
        />
      );

    case "qtype-5-choose-weak":
      return (
        <ChooseWeakQuestion
          key={question.id}
          question={question}
          onAnswer={onAnswerListen}
          isAnswered={isAnswered}
          selectedAnswer={selectedAnswer}
        />
      );

    case "qtype-6-choose-linking":
      return (
        <ChooseLinkingQuestion
          key={question.id}
          question={question}
          onAnswer={onAnswerListen}
          isAnswered={isAnswered}
          selectedAnswer={selectedAnswer}
        />
      );

    case "qtype-7-choose-assimilation":
      return (
        <ChooseAssimilationQuestion
          key={question.id}
          question={question}
          onAnswer={onAnswerListen}
          isAnswered={isAnswered}
          selectedAnswer={selectedAnswer}
        />
      );

    default:
      return null;
  }
}
