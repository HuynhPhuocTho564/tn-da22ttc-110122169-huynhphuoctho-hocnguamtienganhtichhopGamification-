export type SubmitAnswerInput = {
  questionId: string;
  selectedOptionId?: string | null;
  selectedText?: string | null;
  transcript?: string | null;
  audioUrl?: string | null;
  timeSpent?: number | null;
};

export type ScoringQuestion = {
  id: string;
  answer: string;
  score: number;
  type: {
    id: string;
    name: string;
  };
  acceptedAnswers?: string[] | null; // v2 Mode B: multi-answer (g02 weak-forms contraction)
  options: Array<{
    id: string;
    content: string;
  }>;
};

export type QuestionScoreResult = {
  questionId: string;
  isCorrect: boolean;
  score: number;
  maxScore: number;
  accuracyScore: number | null;
  feedback: string;
  selectedOptionId: string | null;
  transcript: string | null;
  audioUrl: string | null;
  timeSpent: number | null;
};

export type ExerciseRating = "NEEDS_PRACTICE" | "PASS" | "GOOD" | "EXCELLENT";

/** Minimum score to pass an exercise */
export const PASS_THRESHOLD = 70;
/** Minimum score for GOOD rating */
export const GOOD_THRESHOLD = 80;
/** Minimum score for EXCELLENT rating */
export const EXCELLENT_THRESHOLD = 90;


// ============================================================
// WORD ERROR RATE (WER) — Levenshtein-based scoring
// Based on Jurafsky & Martin (2009), Speech and Language Processing, Ch.9
// Replaces the previous bag-of-words overlap approach with standard NLP metrics.
// ============================================================

/**
 * Result of word-level Levenshtein edit distance computation.
 * Counts each operation type separately (S, D, I) for WER calculation.
 */
export interface EditDistanceResult {
  distance: number;
  substitutions: number;
  deletions: number;
  insertions: number;
}

/**
 * Result of Word Error Rate computation.
 * WER = (S + D + I) / N, Accuracy = 1 - WER.
 */
export interface WERResult {
  wer: number;
  accuracy: number; // 0-100 (percentage, clamped to ≥ 0)
  substitutions: number;
  deletions: number;
  insertions: number;
  hits: number;
  referenceLength: number;
}

/**
 * Compute word-level Levenshtein edit distance using dynamic programming.
 * Backtracks through the DP matrix to count S, D, I operations separately.
 *
 * Time: O(m×n), Space: O(m×n) for backtracking.
 *
 * @see Levenshtein, V. I. (1966). Soviet Physics Doklady, 10(8), 707–710.
 * @see Wagner & Fischer (1974). JACM, 21(1), 168–173.
 */
export function wordEditDistance(
  reference: readonly string[],
  hypothesis: readonly string[],
): EditDistanceResult {
  const m = reference.length;
  const n = hypothesis.length;

  // DP matrix: d[i][j] = edit distance for ref[0..i-1] vs hyp[0..j-1]
  const d: number[][] = Array.from({ length: m + 1 }, () =>
    new Array<number>(n + 1).fill(0),
  );

  // Base cases: distance from empty string
  for (let i = 0; i <= m; i++) d[i][0] = i; // all deletions
  for (let j = 0; j <= n; j++) d[0][j] = j; // all insertions

  // Fill matrix bottom-up
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      const matchCost = reference[i - 1] === hypothesis[j - 1] ? 0 : 1;
      d[i][j] = Math.min(
        d[i - 1][j] + 1,       // deletion
        d[i][j - 1] + 1,       // insertion
        d[i - 1][j - 1] + matchCost, // substitution or match
      );
    }
  }

  // Backtrack to count S, D, I operations
  let substitutions = 0;
  let deletions = 0;
  let insertions = 0;
  let i = m;
  let j = n;

  while (i > 0 || j > 0) {
    if (
      i > 0 &&
      j > 0 &&
      d[i][j] === d[i - 1][j - 1] + (reference[i - 1] === hypothesis[j - 1] ? 0 : 1)
    ) {
      if (reference[i - 1] !== hypothesis[j - 1]) substitutions++;
      i--;
      j--;
    } else if (i > 0 && d[i][j] === d[i - 1][j] + 1) {
      deletions++;
      i--;
    } else {
      insertions++;
      j--;
    }
  }

  return {
    distance: d[m][n],
    substitutions,
    deletions,
    insertions,
  };
}

/**
 * Compute Word Error Rate (WER) between reference and hypothesis strings.
 *
 * Formula (Jurafsky & Martin, 2009, Ch.9):
 *   WER = (S + D + I) / N
 *   Accuracy = max(0, (1 - WER) × 100)
 *
 * Where S = substitutions, D = deletions, I = insertions, N = reference word count.
 * This is the standard evaluation metric in speech recognition research.
 *
 * @see Jurafsky, D. & Martin, J. H. (2009). Speech and Language Processing, 2nd Ed. Pearson.
 */
export function computeWordErrorRate(reference: string, hypothesis: string): WERResult {
  const refTokens = tokenize(reference);
  const hypTokens = tokenize(hypothesis);
  const n = refTokens.length;

  if (n === 0) {
    return {
      wer: hypTokens.length > 0 ? Infinity : 0,
      accuracy: n === 0 && hypTokens.length === 0 ? 100 : 0,
      substitutions: 0,
      deletions: 0,
      insertions: hypTokens.length,
      hits: 0,
      referenceLength: 0,
    };
  }

  const result = wordEditDistance(refTokens, hypTokens);
  const wer = (result.substitutions + result.deletions + result.insertions) / n;
  const hits = n - result.substitutions - result.deletions;

  return {
    wer,
    accuracy: Math.max(0, Math.round((1 - wer) * 100)),
    substitutions: result.substitutions,
    deletions: result.deletions,
    insertions: result.insertions,
    hits: Math.max(0, hits),
    referenceLength: n,
  };
}

export function normalizeAnswerText(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^\w\s]|_/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(value: string) {
  return normalizeAnswerText(value).split(" ").filter(Boolean);
}

/**
 * Calculate pronunciation accuracy using Word Error Rate (WER).
 *
 * Replaces the previous bag-of-words overlap approach with the standard
 * NLP metric based on Levenshtein distance at the word level.
 *
 * WER = (S + D + I) / N, where:
 *   S = substitutions (wrong word), D = deletions (missing word),
 *   I = insertions (extra word), N = total reference words.
 *
 * @see Jurafsky, D. & Martin, J. H. (2009). Speech and Language Processing, 2nd Ed., Ch.9.
 * @see Levenshtein, V. I. (1966). Soviet Physics Doklady, 10(8), 707–710.
 */
export function calculateWordErrorRate(expected: string, actual: string): number {
  return computeWordErrorRate(expected, actual).accuracy;
}

/**
 * Alias for calculateWordErrorRate — returns word-level accuracy (0-100).
 * Used by SpeakSentenceQuestion for sentence-level pronunciation scoring.
 */
export const calculateWordOverlapAccuracy = calculateWordErrorRate;

function scoreMultipleChoice(question: ScoringQuestion, answer: SubmitAnswerInput): QuestionScoreResult {
  const selectedOption = answer.selectedOptionId
    ? question.options.find((option) => option.id === answer.selectedOptionId)
    : null;
  const selectedText = selectedOption?.content ?? answer.selectedText ?? "";

  // So sánh đáp án. Hai nhánh:
  // 1. Exact string match — cho IPA phoneme answer (vd /iː/ vs /ɪ/ khác nhau nguyên văn).
  // 2. Normalized match — cho word answer (ship/Sheep/Ship! → "ship" bằng nhau).
  //
  // BUG được sửa: normalizeAnswerText strip ký tự non-ASCII → nhiều IPA thành "" (vd /ɑː/&/ʌ/&/ə/
  // cả 3 → ""). Nếu chỉ dùng normalized match → bấm nút nào cũng đúng (cả 3 = "").
  // Giải pháp: nếu CẢ HAI normalize thành rỗng → bắt buộc exact-match (normalized vô nghĩa).
  // Nếu ít nhất 1 còn nội dung ASCII → normalized match hợp lệ (word mode).
  const normalizedSelected = normalizeAnswerText(selectedText);
  const normalizedAnswer = normalizeAnswerText(question.answer);
  const isCorrect =
    selectedText === question.answer ||
    (normalizedSelected.length > 0 && normalizedAnswer.length > 0 && normalizedSelected === normalizedAnswer);

  return {
    questionId: question.id,
    isCorrect,
    score: isCorrect ? question.score : 0,
    maxScore: question.score,
    accuracyScore: null,
    feedback: isCorrect ? "Đúng" : "Chưa đúng",
    selectedOptionId: answer.selectedOptionId ?? null,
    transcript: answer.transcript ?? null,
    audioUrl: answer.audioUrl ?? null,
    timeSpent: answer.timeSpent ?? null,
  };
}

function scoreVoice(question: ScoringQuestion, answer: SubmitAnswerInput): QuestionScoreResult {
  const transcript = answer.transcript ?? "";
  // v2 Mode B multi-answer: max WER accuracy across [answer, ...acceptedAnswers]
  const candidates =
    question.acceptedAnswers && question.acceptedAnswers.length > 0
      ? [question.answer, ...question.acceptedAnswers]
      : [question.answer];
  const accuracyScore = Math.max(...candidates.map((c) => calculateWordErrorRate(c, transcript)));
  const isCorrect = accuracyScore >= GOOD_THRESHOLD;
  const score = Math.round((question.score * accuracyScore) / 100);

  return {
    questionId: question.id,
    isCorrect,
    score,
    maxScore: question.score,
    accuracyScore,
    feedback: isCorrect ? "Phát âm gần đúng mục tiêu" : "Cần luyện lại từ/câu mục tiêu",
    selectedOptionId: answer.selectedOptionId ?? null,
    transcript: answer.transcript ?? null,
    audioUrl: answer.audioUrl ?? null,
    timeSpent: answer.timeSpent ?? null,
  };
}

// === SP4 Mode A: CĐ4 scoring helpers ===

// DRY: build QuestionScoreResult 7 field (verify type scoring.ts:24-35)
function buildResult(
  question: ScoringQuestion,
  answer: SubmitAnswerInput,
  isCorrect: boolean,
  feedback: string,
): QuestionScoreResult {
  return {
    questionId: question.id,
    isCorrect,
    score: isCorrect ? question.score : 0,
    maxScore: question.score,
    accuracyScore: isCorrect ? 100 : 0,
    feedback,
    selectedOptionId: answer.selectedOptionId ?? null,
    transcript: answer.transcript ?? null,
    audioUrl: answer.audioUrl ?? null,
    timeSpent: answer.timeSpent ?? null,
  };
}

// qtype-4-tap-stress: answer = String(stressIndex); chọn option theo index
function scoreTapStress(question: ScoringQuestion, answer: SubmitAnswerInput): QuestionScoreResult {
  const idx = question.options.findIndex((o) => o.id === answer.selectedOptionId);
  const isCorrect = idx >= 0 && idx === Number(question.answer);
  const correctSyllable = question.options[Number(question.answer)]?.content ?? "?";
  return buildResult(
    question,
    answer,
    isCorrect,
    isCorrect ? "Chọn đúng âm tiết nhấn" : `Đáp án: ${correctSyllable} (âm tiết ${Number(question.answer) + 1})`,
  );
}

// qtype-5/6 (choose-weak/choose-linking): answer = "to,the" comma-join; selectedText = join
function scoreMultiSelect(question: ScoringQuestion, answer: SubmitAnswerInput): QuestionScoreResult {
  const expected = new Set(question.answer.split(",").map(normalizeAnswerText).filter(Boolean));
  const selected = new Set((answer.selectedText ?? "").split(",").map(normalizeAnswerText).filter(Boolean));
  const isCorrect =
    expected.size === selected.size && [...expected].every((x) => selected.has(x));
  return buildResult(question, answer, isCorrect, isCorrect ? "Chọn đúng" : `Đáp án: ${question.answer}`);
}

// qtype-7 (choose-assimilation): answer = "didʒu" IPA; chọn 1 option — exact (không normalize, giữ ʒ)
function scoreSingleSelect(question: ScoringQuestion, answer: SubmitAnswerInput): QuestionScoreResult {
  const selectedText =
    question.options.find((o) => o.id === answer.selectedOptionId)?.content ?? answer.selectedText ?? "";
  const isCorrect = selectedText === question.answer;
  return buildResult(
    question,
    answer,
    isCorrect,
    isCorrect ? "Chọn đúng phát âm biến âm" : `Đáp án: ${question.answer}`,
  );
}

export function scoreQuestion(question: ScoringQuestion, answer: SubmitAnswerInput): QuestionScoreResult {
  if (question.type.id === "qtype-1-mc") {
    return scoreMultipleChoice(question, answer);
  }
  if (question.type.id === "qtype-4-tap-stress") return scoreTapStress(question, answer);
  if (question.type.id === "qtype-5-choose-weak") return scoreMultiSelect(question, answer);
  if (question.type.id === "qtype-6-choose-linking") return scoreMultiSelect(question, answer);
  if (question.type.id === "qtype-7-choose-assimilation") return scoreSingleSelect(question, answer);

  return scoreVoice(question, answer);
}

export function calculateExerciseScore(questionResults: QuestionScoreResult[]) {
  const maxScore = questionResults.reduce((total, result) => total + result.maxScore, 0);
  const rawScore = questionResults.reduce((total, result) => total + result.score, 0);
  const exerciseScore = maxScore > 0 ? Math.round((rawScore / maxScore) * 100) : 0;
  const correctAnswers = questionResults.filter((result) => result.isCorrect).length;

  return {
    rawScore,
    maxScore,
    exerciseScore,
    correctAnswers,
  };
}

export function getExerciseRating(exerciseScore: number): ExerciseRating {
  if (exerciseScore >= EXCELLENT_THRESHOLD) return "EXCELLENT";
  if (exerciseScore >= GOOD_THRESHOLD) return "GOOD";
  if (exerciseScore >= PASS_THRESHOLD) return "PASS";
  return "NEEDS_PRACTICE";
}

export function isExerciseCompleted(exerciseScore: number) {
  return exerciseScore >= PASS_THRESHOLD;
}
