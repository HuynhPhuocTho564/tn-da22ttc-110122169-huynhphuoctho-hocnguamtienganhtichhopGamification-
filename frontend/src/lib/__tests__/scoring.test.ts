import assert from "node:assert/strict";
import test from "node:test";
import {
  calculateExerciseScore,
  getExerciseRating,
  isExerciseCompleted,
  normalizeAnswerText,
  scoreQuestion,
  type ScoringQuestion,
} from "../scoring";

function makeQuestion(overrides: Partial<ScoringQuestion> = {}): ScoringQuestion {
  return {
    id: "question-1",
    answer: "ship",
    score: 10,
    type: {
      id: "qtype-1-mc",
      name: "Multiple choice",
    },
    options: [
      { id: "option-correct", content: "ship" },
      { id: "option-wrong", content: "sheep" },
    ],
    ...overrides,
  };
}

test("normalizeAnswerText removes punctuation, case, and extra spaces", () => {
  assert.equal(normalizeAnswerText("  Ship, please!  "), "ship please");
});

test("scoreQuestion gives full score for a correct multiple-choice option", () => {
  const result = scoreQuestion(makeQuestion(), {
    questionId: "question-1",
    selectedOptionId: "option-correct",
    timeSpent: 12,
  });

  assert.equal(result.isCorrect, true);
  assert.equal(result.score, 10);
  assert.equal(result.maxScore, 10);
  assert.equal(result.accuracyScore, null);
  assert.equal(result.selectedOptionId, "option-correct");
  assert.equal(result.timeSpent, 12);
});

test("scoreQuestion gives zero score for an incorrect multiple-choice option", () => {
  const result = scoreQuestion(makeQuestion(), {
    questionId: "question-1",
    selectedOptionId: "option-wrong",
  });

  assert.equal(result.isCorrect, false);
  assert.equal(result.score, 0);
});

test("scoreQuestion scores voice answers by word-overlap accuracy", () => {
  const question = makeQuestion({
    answer: "ship sheep",
    score: 20,
    type: {
      id: "qtype-voice",
      name: "Voice pronunciation",
    },
  });

  const partial = scoreQuestion(question, {
    questionId: "question-1",
    transcript: "ship",
  });
  const full = scoreQuestion(question, {
    questionId: "question-1",
    transcript: "ship sheep",
  });

  assert.equal(partial.accuracyScore, 50);
  assert.equal(partial.score, 10);
  assert.equal(partial.isCorrect, false);
  assert.equal(full.accuracyScore, 100);
  assert.equal(full.score, 20);
  assert.equal(full.isCorrect, true);
});

test("calculateExerciseScore summarizes raw score, percentage, and correct answers", () => {
  const question = makeQuestion();
  const correct = scoreQuestion(question, {
    questionId: "question-1",
    selectedOptionId: "option-correct",
  });
  const wrong = scoreQuestion(
    makeQuestion({
      id: "question-2",
      score: 30,
    }),
    {
      questionId: "question-2",
      selectedOptionId: "option-wrong",
    },
  );

  const summary = calculateExerciseScore([correct, wrong]);

  assert.deepEqual(summary, {
    rawScore: 10,
    maxScore: 40,
    exerciseScore: 25,
    correctAnswers: 1,
  });
});

test("exercise rating and completion thresholds stay stable", () => {
  assert.equal(getExerciseRating(69), "NEEDS_PRACTICE");
  assert.equal(getExerciseRating(70), "PASS");
  assert.equal(getExerciseRating(80), "GOOD");
  assert.equal(getExerciseRating(90), "EXCELLENT");
  assert.equal(isExerciseCompleted(69), false);
  assert.equal(isExerciseCompleted(70), true);
});

test("scoreMultipleChoice: IPA exact-match — /iː/ correct, /ɪ/ wrong", () => {
  const question: ScoringQuestion = {
    id: "q-ipa-1",
    answer: "/iː/",
    score: 10,
    type: { id: "qtype-1-mc", name: "Trắc nghiệm nghe" },
    options: [
      { id: "o1", content: "/iː/" },
      { id: "o2", content: "/ɪ/" },
    ],
  };
  const correctResult = scoreQuestion(question, {
    questionId: "q-ipa-1",
    selectedOptionId: "o1",
    selectedText: "/iː/",
  });
  assert.equal(correctResult.isCorrect, true);

  const wrongResult = scoreQuestion(question, {
    questionId: "q-ipa-1",
    selectedOptionId: "o2",
    selectedText: "/ɪ/",
  });
  assert.equal(wrongResult.isCorrect, false);
});

test("scoreMultipleChoice: word mode vẫn normalized match (không vỡ exact-match branch)", () => {
  const question: ScoringQuestion = {
    id: "q-word-1",
    answer: "sheep",
    score: 10,
    type: { id: "qtype-1-mc", name: "Trắc nghiệm nghe" },
    options: [
      { id: "o1", content: "sheep" },
      { id: "o2", content: "ship" },
    ],
  };
  const result = scoreQuestion(question, {
    questionId: "q-word-1",
    selectedOptionId: "o1",
    selectedText: "sheep",
  });
  assert.equal(result.isCorrect, true);
});

test("scoreMultipleChoice: nhóm 3-âm g03 /ɑː/&/ʌ/&/ə/ — normalize rỗng, phải exact-match (bug thật)", () => {
  // Đây là case spec nêu: cả 3 IPA non-ASCII → normalize thành "" → bấm nút nào cũng đúng nếu không exact-match.
  const question: ScoringQuestion = {
    id: "q-g03",
    answer: "/ɑː/",
    score: 10,
    type: { id: "qtype-1-mc", name: "Trắc nghiệm nghe" },
    options: [
      { id: "o1", content: "/ɑː/" },
      { id: "o2", content: "/ʌ/" },
      { id: "o3", content: "/ə/" },
    ],
  };
  // Chọn /ɑː/ (đúng) → correct
  const correctResult = scoreQuestion(question, {
    questionId: "q-g03",
    selectedOptionId: "o1",
    selectedText: "/ɑː/",
  });
  assert.equal(correctResult.isCorrect, true);
  // Chọn /ʌ/ (sai) → phải wrong, KHÔNG phải correct do normalize rỗng
  const wrongResult = scoreQuestion(question, {
    questionId: "q-g03",
    selectedOptionId: "o2",
    selectedText: "/ʌ/",
  });
  assert.equal(wrongResult.isCorrect, false);
  // Chọn /ə/ (sai) → phải wrong
  const wrongResult2 = scoreQuestion(question, {
    questionId: "q-g03",
    selectedOptionId: "o3",
    selectedText: "/ə/",
  });
  assert.equal(wrongResult2.isCorrect, false);
});

// ===== SP4 Mode A: CĐ4 scoring (qtype-4..7) =====

test("scoreTapStress (qtype-4): chọn đúng âm tiết nhấn → isCorrect", () => {
  const q = makeQuestion({
    answer: "0",
    score: 10,
    type: { id: "qtype-4-tap-stress", name: "Tap stress" },
    options: [
      { id: "o0", content: "pho" },
      { id: "o1", content: "to" },
      { id: "o2", content: "graph" },
    ],
  });
  assert.equal(scoreQuestion(q, { questionId: "question-1", selectedOptionId: "o0" }).isCorrect, true);
  assert.equal(scoreQuestion(q, { questionId: "question-1", selectedOptionId: "o1" }).isCorrect, false);
  assert.equal(scoreQuestion(q, { questionId: "question-1", selectedOptionId: "o2" }).isCorrect, false);
});

test("scoreMultiSelect (qtype-5 choose-weak): đúng set → isCorrect, thiếu/thừa → false", () => {
  const q = makeQuestion({
    answer: "to,the",
    score: 10,
    type: { id: "qtype-5-choose-weak", name: "Choose weak" },
    options: [],
  });
  assert.equal(scoreQuestion(q, { questionId: "question-1", selectedText: "to,the" }).isCorrect, true);
  assert.equal(scoreQuestion(q, { questionId: "question-1", selectedText: "to" }).isCorrect, false);
  assert.equal(scoreQuestion(q, { questionId: "question-1", selectedText: "to,the,a" }).isCorrect, false);
  assert.equal(scoreQuestion(q, { questionId: "question-1", selectedText: "" }).isCorrect, false);
});

test("scoreMultiSelect (qtype-6 choose-linking): đúng set pair → isCorrect", () => {
  const q = makeQuestion({
    answer: "Turn→off",
    score: 10,
    type: { id: "qtype-6-choose-linking", name: "Choose linking" },
    options: [],
  });
  assert.equal(scoreQuestion(q, { questionId: "question-1", selectedText: "Turn→off" }).isCorrect, true);
  assert.equal(
    scoreQuestion(q, { questionId: "question-1", selectedText: "Turn→off,off→the" }).isCorrect,
    false,
  );
});

test("scoreSingleSelect (qtype-7 choose-assimilation): chọn đúng result (IPA exact) → isCorrect", () => {
  const q = makeQuestion({
    answer: "didʒu",
    score: 10,
    type: { id: "qtype-7-choose-assimilation", name: "Choose assimilation" },
    options: [
      { id: "o0", content: "didʒu" },
      { id: "o1", content: "did you" },
    ],
  });
  assert.equal(scoreQuestion(q, { questionId: "question-1", selectedOptionId: "o0" }).isCorrect, true);
  assert.equal(scoreQuestion(q, { questionId: "question-1", selectedOptionId: "o1" }).isCorrect, false);
});

// ===== SP4 Mode B: acceptedAnswers multi-answer (scoreVoice) =====

test("scoreVoice với acceptedAnswers: match dạng 2 (I am) → isCorrect", () => {
  const q = makeQuestion({
    answer: "I'm going to the shop",
    score: 25,
    type: { id: "qtype-2-voice", name: "Voice" },
    options: [],
    acceptedAnswers: ["I'm going to the shop", "I am going to the shop"],
  });
  // user nói "I am going to the shop" (dạng 2) → accuracy cao vs dạng 2 → isCorrect
  const r = scoreQuestion(q, { questionId: "question-1", transcript: "I am going to the shop" });
  assert.equal(r.isCorrect, true);
});

test("scoreVoice không acceptedAnswers: giữ logic cũ (single answer)", () => {
  const q = makeQuestion({
    answer: "Turn off the light",
    score: 25,
    type: { id: "qtype-2-voice", name: "Voice" },
    options: [],
  });
  assert.equal(
    scoreQuestion(q, { questionId: "question-1", transcript: "Turn off the light" }).isCorrect,
    true,
  );
  assert.equal(
    scoreQuestion(q, { questionId: "question-1", transcript: "completely different" }).isCorrect,
    false,
  );
});
