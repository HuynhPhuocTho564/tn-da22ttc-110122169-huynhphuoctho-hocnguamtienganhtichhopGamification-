/**
 * Shared types for the exercise engine system.
 *
 * These types are used by ExerciseEngineClient and all question sub-components.
 * Re-exported from ExerciseEngineClient.tsx for backward compatibility.
 *
 * @module exercises/types
 */

// ============================================================
// Question & Exercise types
// ============================================================

export type ExerciseQuestionOption = {
  id: string;
  content: string;
};

export type ExerciseQuestion = {
  id: string;
  name: string | null;
  content: string;
  type: string;
  answer: string;
  score: number;
  acceptedAnswers?: string[] | null; // v2 Mode B: multi-answer (g02 weak-forms contraction)
  options: ExerciseQuestionOption[];
};

export type ExerciseData = {
  id: string;
  name: string;
  description: string | null;
  questions: ExerciseQuestion[];
};

// ============================================================
// Engine configuration
// ============================================================

export type EngineUnlocks = {
  unlockedSlowAudio: boolean;
  unlockedIpaReveal: boolean;
  userLevel?: number;
  hintTokens?: number;
  secondChances?: number;
};

// ============================================================
// Word prompt (parsed from question.content JSON)
// ============================================================

export type WordPrompt = {
  word: string;
  ipa?: string;
  audioUrl?: string;
  hint?: string;
  options?: Array<{
    id?: string;
    text?: string;
    content?: string;
    audioUrl?: string;
  }>;
  // v2 listen_choose 3-stage (phoneme identification):
  answerType?: "phoneme";
  stage?: 1 | 2 | 3;
  targetPhoneme?: string;
  contrastPhonemes?: string[];
  skeleton?: string | null;
};

// ============================================================
// Answer submission types
// ============================================================

export type SubmitAnswer = {
  questionId: string;
  selectedOptionId?: string | null;
  selectedText?: string | null;
  transcript?: string | null;
  audioUrl?: string | null;
  timeSpent?: number | null;
};

export type SubmitResult = {
  exerciseAttemptId: string;
  exerciseScore: number;
  isCompleted: boolean;
  rating: string;
  rewards: {
    totalXpEarned: number;
    totalRankingDelta: number;
    dailyBonusXp: number;
    dailyBonusRanking: number;
    retakeXp: number;
    retakeRanking: number;
    gemsEarned: number;
    questXpEarned: number;
    questGemsEarned: number;
  };
  progress: {
    currentXp: number;
    level: number;
    nextLevelXp: number;
  };
  badgesAwarded: Array<{ id: string; name: string; type: string }>;
  previousBestScore: number | null;
  streak: {
    count: number;
    longest: number;
    totalCheckIns?: number;
    autoCheckedIn?: boolean;
  };
};

export type IncorrectQuestion = {
  question: ExerciseQuestion;
  selected: string;
  correct: string;
};
