# SP4 Mode A — UI 4 dạng CĐ4 (listen-style) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Git policy:** Engineer KHÔNG tự commit. Mỗi task kết thúc checkpoint review với user; user tự commit khi convenient. Không chạy `git add`/`git commit`/`git push`.

**Goal:** Xây 4 component UI Mode A CĐ4 (listen-style) + 4 branch engine dispatch + 4 branch scoring, flip 4 exercise mode_a từ "render blank + score 0" → playable. User playtest được 4 dạng nghe/chọn (không speech).

**Architecture:** Hướng spec `2026-06-19-sp4-modea-cd4-ui-design.md`. 4 component tách file riêng (pattern `SpeakMinimalPairsQuestion` — tự parse content, KHÔNG dùng `parseWordPrompt` chung). Engine `ExerciseEngineClient.tsx:572-575` +4 branch `qtype-4..7`. Scoring `scoring.ts:127` +4 branch + 3 helper + `buildResult` DRY (7-field `QuestionScoreResult`). TDD: mở rộng `scoring.test.ts` test qtype-4..7 trước (fail) → implement scoring → 4 component → engine dispatch → playtest + quality gate.

**Tech Stack:** Next.js 16, React 18, TypeScript 6, Prisma 6, Tailwind 4, test runner `tsx --test` (Node `node:test` + `node:assert/strict`).

**Spec reference:** `docs/superpowers/specs/2026-06-19-sp4-modea-cd4-ui-design.md`

**Codebase root note:** Source dưới `english_pronunciation_app/frontend/`. Mọi path tương đối từ `english_pronunciation_app/frontend/`. Chạy `npm`/`npx`/`tsx` từ `english_pronunciation_app/frontend/`.

**Key type reminder (verify spec):**
- `ExerciseQuestion` (`ExerciseEngineClient.tsx:16-36`): `{ id, name, content, type, answer, score, options:{id,content}[] }`.
- `SubmitAnswerInput` (`scoring.ts:1-8`): `{ questionId, selectedOptionId?, selectedText?, transcript?, audioUrl?, timeSpent? }` — có `selectedText` sẵn cho multi-select.
- `QuestionScoreResult` (`scoring.ts:24-35`): **7 field bắt buộc** `{ questionId, isCorrect, score, maxScore, accuracyScore, feedback, selectedOptionId, transcript, audioUrl, timeSpent }` → helper `buildResult` DRY.
- `ScoringQuestion` (`scoring.ts:10-22`): `{ id, answer, score, type:{id,name}, options:{id,content}[] }`.
- Listen component props (pattern `ListenChooseQuestion` `:171-293`): `{ question, onAnswer:(isCorrect, selectedOpt, selectedOptionId?) => void, isAnswered, selectedAnswer }`.

**⚠️ Refinement so với spec (cần user-aware):** `handleAnswerListen` (`ExerciseEngineClient.tsx:405`) ghi `selectedText: answerOpt` (single option content). Multi-select (choose-weak/linking) cần `selectedText = join(",")` nội dung đã chọn để scoring `scoreMultiSelect` compare set → **mở rộng `handleAnswerListen` +1 param optional `selectedTextOverride?: string`** (default `answerOpt`). 4 component listen-style (kể cả single-select tap-stress/assimilation) dùng cùng handler này. Flag ở Task 5 checkpoint.

---

## File Structure

| Hành động | File | Trách nhiệm |
|---|---|---|
| sửa | `src/lib/scoring.ts` | +4 branch `scoreQuestion` (qtype-4..7) + `buildResult` + `scoreTapStress`/`scoreMultiSelect`/`scoreSingleSelect` |
| sửa | `src/lib/__tests__/scoring.test.ts` | +4 test qtype-4..7 (TDD fail trước) |
| tạo | `src/app/exercises/[id]/TapStressQuestion.tsx` | component tap-stress (single-select syllable blocks + mp3) |
| tạo | `src/app/exercises/[id]/ChooseWeakQuestion.tsx` | component choose-weak (multi-select word chips + speechSynthesis) |
| tạo | `src/app/exercises/[id]/ChooseLinkingQuestion.tsx` | component choose-linking (multi-select pair chips + speechSynthesis) |
| tạo | `src/app/exercises/[id]/ChooseAssimilationQuestion.tsx` | component choose-assimilation (single-select variant buttons + speechSynthesis) |
| tạo | `src/app/exercises/[id]/useSynthesisAudio.ts` | helper speechSynthesis (DRY cho 3 dạng câu) |
| sửa | `src/app/exercises/[id]/ExerciseEngineClient.tsx` | +4 branch render `qtype-4..7` (`:572-575`) + mở rộng `handleAnswerListen` +param `selectedTextOverride?` |

**Decomposition rationale:** Task 1 scoring TDD (foundation, fail trước) → Task 2 implement scoring (pass) → Task 3 helper `useSynthesisAudio` (DRY base cho 3 component câu) → Task 4-7 4 component (mỗi cái 1 task, self-contained) → Task 8 engine dispatch + `handleAnswerListen` mở rộng → Task 9 playtest + quality gate. Scoring trước component để TDD đỏ-xanh rõ; component trước engine dispatch để dispatch có component import sẵn.

**KHÔNG sửa:** `page.tsx` (AnswerOption flow đã có), `submit/route.ts` (scoring qua `scoreQuestion`), schema (`SubmitAnswer` có `selectedText`), seed/content (SP3d xong), `parseWordPrompt` (component tự parse), `ListenFeedbackSheet` (dùng lại), `SpeakFeedbackSheet` (Mode A listen, không dùng), Mode B (spec riêng).

---

## Task 1: Test TDD scoring — 4 nhánh qtype-4..7 (fail trước)

**Files:**
- Modify: `src/lib/__tests__/scoring.test.ts`

- [ ] **Step 1: Đọc file test hiện tại để hiểu pattern**

Mở `src/lib/__tests__/scoring.test.ts`. File có `makeQuestion(overrides: Partial<ScoringQuestion>)` helper (line 12-27) + import `scoreQuestion`, `ScoringQuestion`. Pattern: `scoreQuestion(q, { questionId, selectedOptionId, timeSpent })` → check `.isCorrect`. `makeQuestion` default `type:{id:"qtype-1-mc"}` — override `type.id` cho CĐ4.

- [ ] **Step 2: Thêm 4 test qtype-4..7 vào cuối file**

Thêm vào cuối `src/lib/__tests__/scoring.test.ts` (sau test cuối):
```ts
// ===== SP4 Mode A: CĐ4 scoring (qtype-4..7) =====

test("scoreTapStress (qtype-4): chọn đúng âm tiết nhấn → isCorrect", () => {
  const q = makeQuestion({
    answer: "0", score: 10,
    type: { id: "qtype-4-tap-stress", name: "Tap stress" },
    options: [{ id: "o0", content: "pho" }, { id: "o1", content: "to" }, { id: "o2", content: "graph" }],
  });
  assert.equal(scoreQuestion(q, { questionId: "question-1", selectedOptionId: "o0" }).isCorrect, true);
  assert.equal(scoreQuestion(q, { questionId: "question-1", selectedOptionId: "o1" }).isCorrect, false);
  assert.equal(scoreQuestion(q, { questionId: "question-1", selectedOptionId: "o2" }).isCorrect, false);
});

test("scoreMultiSelect (qtype-5 choose-weak): đúng set → isCorrect, thiếu/thừa → false", () => {
  const q = makeQuestion({
    answer: "to,the", score: 10,
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
    answer: "Turn→off", score: 10,
    type: { id: "qtype-6-choose-linking", name: "Choose linking" },
    options: [],
  });
  assert.equal(scoreQuestion(q, { questionId: "question-1", selectedText: "Turn→off" }).isCorrect, true);
  assert.equal(scoreQuestion(q, { questionId: "question-1", selectedText: "Turn→off,off→the" }).isCorrect, false);
});

test("scoreSingleSelect (qtype-7 choose-assimilation): chọn đúng result (IPA exact) → isCorrect", () => {
  const q = makeQuestion({
    answer: "didʒu", score: 10,
    type: { id: "qtype-7-choose-assimilation", name: "Choose assimilation" },
    options: [{ id: "o0", content: "didʒu" }, { id: "o1", content: "did you" }],
  });
  assert.equal(scoreQuestion(q, { questionId: "question-1", selectedOptionId: "o0" }).isCorrect, true);
  assert.equal(scoreQuestion(q, { questionId: "question-1", selectedOptionId: "o1" }).isCorrect, false);
});
```

- [ ] **Step 3: Chạy test verify fail**
```bash
npx tsx --test "src/lib/__tests__/scoring.test.ts"
```
Expected: 4 test mới FAIL — `scoreQuestion` route qtype-4..7 → `scoreVoice` (transcript null) → isCorrect false cho mọi case (kể cả đúng). Test cũ pass. (Tap-stress đúng `o0` sẽ fail vì scoreVoice trả false.)

- [ ] **Step 4: Verify tsc**
```bash
npx tsc --noEmit
```
Expected: 0 error (test dùng `makeQuestion` + `scoreQuestion` đã import).

- [ ] **Step 5: Checkpoint review với user**

Báo user: 4 test scoring CĐ4 thêm, fail đúng (scoreVoice route sai). Review rồi tiếp Task 2.

---

## Task 2: Implement scoring — 4 branch + buildResult + 3 helper

**Files:**
- Modify: `src/lib/scoring.ts`

- [ ] **Step 1: Thêm `buildResult` helper + 3 scoring helper trước `scoreQuestion`**

Trong `src/lib/scoring.ts`, trước hàm `scoreQuestion` (line 127), thêm:
```ts
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
  return buildResult(question, answer, isCorrect, isCorrect ? "Chọn đúng âm tiết nhấn" : `Đáp án: ${correctSyllable} (âm tiết ${Number(question.answer) + 1})`);
}

// qtype-5/6 (choose-weak/choose-linking): answer = "to,the" comma-join; selectedText = join
function scoreMultiSelect(question: ScoringQuestion, answer: SubmitAnswerInput): QuestionScoreResult {
  const expected = new Set(question.answer.split(",").map(normalizeAnswerText).filter(Boolean));
  const selected = new Set((answer.selectedText ?? "").split(",").map(normalizeAnswerText).filter(Boolean));
  const isCorrect = expected.size === selected.size && [...expected].every((x) => selected.has(x));
  return buildResult(question, answer, isCorrect, isCorrect ? "Chọn đúng" : `Đáp án: ${question.answer}`);
}

// qtype-7 (choose-assimilation): answer = "didʒu" IPA; chọn 1 option — exact (không normalize, giữ ʒ)
function scoreSingleSelect(question: ScoringQuestion, answer: SubmitAnswerInput): QuestionScoreResult {
  const selectedText = question.options.find((o) => o.id === answer.selectedOptionId)?.content ?? answer.selectedText ?? "";
  const isCorrect = selectedText === question.answer;
  return buildResult(question, answer, isCorrect, isCorrect ? "Chọn đúng phát âm biến âm" : `Đáp án: ${question.answer}`);
}
```

- [ ] **Step 2: Thêm 4 branch trong `scoreQuestion`**

Sửa `scoreQuestion` (line 127-133):
```ts
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
```

- [ ] **Step 3: Chạy test verify pass**
```bash
npx tsx --test "src/lib/__tests__/scoring.test.ts"
```
Expected: TẤT CẢ test pass (cũ + 4 mới). 4 test CĐ4 pass (scoreTapStress/MultiSelect/SingleSelect route đúng).

- [ ] **Step 4: Verify tsc**
```bash
npx tsc --noEmit
```
Expected: 0 error.

- [ ] **Step 5: Checkpoint review với user**

Báo user: scoring 4 branch CĐ4 implement, 4 test pass. Review rồi tiếp Task 3 (helper useSynthesisAudio).

---

## Task 3: Helper `useSynthesisAudio` (DRY cho 3 component câu)

**Files:**
- Create: `src/app/exercises/[id]/useSynthesisAudio.ts`

**Context:** 3 dạng câu (choose-weak/linking/assimilation) dùng `audioUrl: null` → speechSynthesis runtime. Pattern precedent `SpeakSentenceQuestion.tsx:29 playSentence`. Helper gói logic để DRY.

- [ ] **Step 1: Tạo helper `useSynthesisAudio.ts`**

Tạo `src/app/exercises/[id]/useSynthesisAudio.ts`:
```ts
"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * Helper speechSynthesis cho component CĐ4 Mode A (choose-weak/linking/assimilation).
 * audioUrl null trong contentJson → dùng window.speechSynthesis runtime (precedent SpeakSentenceQuestion).
 * Trả play(text) + isPlaying state. Cleanup on unmount.
 */
export function useSynthesisAudio() {
  const [isPlaying, setIsPlaying] = useState(false);

  const play = useCallback((text: string) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    window.speechSynthesis.cancel(); // dừng utterance cũ
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    utter.rate = 0.9; // chậm hơn tự nhiên cho learner
    utter.onstart = () => setIsPlaying(true);
    utter.onend = () => setIsPlaying(false);
    utter.onerror = () => setIsPlaying(false);
    window.speechSynthesis.speak(utter);
  }, []);

  // Cleanup: dừng speech khi unmount (tránh utterance leak)
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  return { play, isPlaying };
}
```

- [ ] **Step 2: Verify tsc**
```bash
npx tsc --noEmit
```
Expected: 0 error.

- [ ] **Step 3: Checkpoint review với user**

Báo user: helper `useSynthesisAudio` tạo, tsc clean. Review rồi tiếp Task 4 (TapStressQuestion).

---

## Task 4: Component `TapStressQuestion` (qtype-4, single-select syllable blocks)

**Files:**
- Create: `src/app/exercises/[id]/TapStressQuestion.tsx`

**Context:** g01 Word Stress. contentJson `{ word, ipa, syllables[], stressIndex, audioUrl }` (audioUrl = word mp3 local). `question.options` = AnswerOption rows = syllables. `question.answer` = `String(stressIndex)`. Single-select — bấm 1 block → `onAnswer`. Pattern `ListenChooseQuestion` (`:171-293`): options button + isAnswered/selectedAnswer + success/error color.

- [ ] **Step 1: Tạo `TapStressQuestion.tsx`**

Tạo `src/app/exercises/[id]/TapStressQuestion.tsx`:
```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { type ExerciseQuestion } from "./ExerciseEngineClient";

type TapStressQuestionProps = {
  question: ExerciseQuestion;
  onAnswer: (isCorrect: boolean, selectedOpt: string, selectedOptionId?: string | null) => void;
  isAnswered: boolean;
  selectedAnswer: string | null;
};

type TapStressContent = {
  word: string;
  ipa: string;
  syllables: string[];
  stressIndex: number;
  audioUrl: string;
};

function parseTapStress(content: string): TapStressContent {
  try {
    const p = JSON.parse(content) as Partial<TapStressContent>;
    return {
      word: String(p.word ?? ""),
      ipa: String(p.ipa ?? ""),
      syllables: Array.isArray(p.syllables) ? p.syllables.map(String) : [],
      stressIndex: typeof p.stressIndex === "number" ? p.stressIndex : 0,
      audioUrl: String(p.audioUrl ?? ""),
    };
  } catch {
    return { word: "", ipa: "", syllables: [], stressIndex: 0, audioUrl: "" };
  }
}

export default function TapStressQuestion({ question, onAnswer, isAnswered, selectedAnswer }: TapStressQuestionProps) {
  const data = useMemo(() => parseTapStress(question.content), [question.content]);
  const correctIdx = data.stressIndex;
  const [autoPlayed, setAutoPlayed] = useState(false);

  // Autoplay audio 500ms sau mount (pattern ListenChooseQuestion:204-213)
  useEffect(() => {
    if (!data.audioUrl || autoPlayed) return;
    const t = window.setTimeout(() => {
      const a = new Audio(data.audioUrl);
      a.play().catch((e) => console.warn("Autoplay prevented:", e));
      setAutoPlayed(true);
    }, 500);
    return () => window.clearTimeout(t);
  }, [data.audioUrl, autoPlayed]);

  const replay = () => {
    if (!data.audioUrl) return;
    new Audio(data.audioUrl).play().catch((e) => console.warn("audio failed:", e));
  };

  // options = syllables (AnswerOption rows từ seed); fallback parse từ content nếu rỗng
  const options = question.options.length > 0
    ? question.options
    : data.syllables.map((s, i) => ({ id: `${question.id}-syl-${i}`, content: s }));

  return (
    <div className="space-y-10 text-center">
      <div className="flex flex-col items-center gap-4">
        <h2 className="text-4xl font-bold text-neutral-900 sm:text-5xl">{data.word}</h2>
        {data.ipa && <p className="font-ipa text-2xl text-neutral-600">{data.ipa}</p>}
        <button type="button" onClick={replay} disabled={!data.audioUrl}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-warning-200 bg-warning-50 px-4 py-2 text-sm font-bold text-warning-800 transition-colors hover:bg-warning-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-warning-500 disabled:opacity-50">
          🔊 Phát lại
        </button>
      </div>

      <div>
        <p className="mb-6 text-lg font-medium text-neutral-600">Bấm âm tiết được nhấn</p>
        <div className="flex flex-wrap justify-center gap-4">
          {options.map((option, idx) => {
            const isCorrectOpt = idx === correctIdx;
            const isSelected = option.content === selectedAnswer;
            let cls = "border-neutral-200 bg-white text-neutral-800 hover:border-primary-300";
            if (isAnswered) {
              if (isCorrectOpt) cls = "border-success-500 bg-success-50 text-success-700 ring-4 ring-success-100";
              else if (isSelected) cls = "border-error-500 bg-error-50 text-error-700 animate-shake";
              else cls = "border-neutral-200 bg-neutral-50 text-neutral-400";
            }
            return (
              <button key={option.id} type="button"
                onClick={() => onAnswer(isCorrectOpt, option.content, question.options.length > 0 ? option.id : null)}
                disabled={isAnswered}
                aria-pressed={isSelected}
                className={`h-20 min-w-32 rounded-xl border-4 px-6 text-3xl font-bold transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 ${cls}`}>
                {option.content}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify tsc**
```bash
npx tsc --noEmit
```
Expected: 0 error.

- [ ] **Step 3: Checkpoint review với user**

Báo user: TapStressQuestion tạo, tsc clean. Review rồi tiếp Task 5 (ChooseWeakQuestion).

---

## Task 5: Component `ChooseWeakQuestion` (qtype-5, multi-select word chips)

**Files:**
- Create: `src/app/exercises/[id]/ChooseWeakQuestion.tsx`

**Context:** g02 Weak Forms. contentJson `{ sentence, ipa, weakWords[], audioUrl:null }`. `question.options` = AnswerOption rows = sentence words. `question.answer` = `weakWords.join(",")`. **Multi-select** — toggle chip + nút "Xong". `onAnswer` cần truyền `selectedText = join(",")` (refinement: `handleAnswerListen` mở rộng +param `selectedTextOverride?` — Task 8). Component tự tính isCorrect (Set compare) + truyền selectedText.

- [ ] **Step 1: Tạo `ChooseWeakQuestion.tsx`**

Tạo `src/app/exercises/[id]/ChooseWeakQuestion.tsx`:
```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { type ExerciseQuestion } from "./ExerciseEngineClient";
import { useSynthesisAudio } from "./useSynthesisAudio";

type ChooseWeakQuestionProps = {
  question: ExerciseQuestion;
  onAnswer: (isCorrect: boolean, selectedOpt: string, selectedOptionId?: string | null, selectedTextOverride?: string) => void;
  isAnswered: boolean;
  selectedAnswer: string | null;
};

type ChooseWeakContent = {
  sentence: string;
  ipa: string;
  weakWords: string[];
  audioUrl: string | null;
};

function parseChooseWeak(content: string): ChooseWeakContent {
  try {
    const p = JSON.parse(content) as Partial<ChooseWeakContent>;
    return {
      sentence: String(p.sentence ?? ""),
      ipa: String(p.ipa ?? ""),
      weakWords: Array.isArray(p.weakWords) ? p.weakWords.map(String) : [],
      audioUrl: p.audioUrl ?? null,
    };
  } catch {
    return { sentence: "", ipa: "", weakWords: [], audioUrl: null };
  }
}

function normalizeAnswer(value: string) {
  return value.toLowerCase().replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ").trim();
}

export default function ChooseWeakQuestion({ question, onAnswer, isAnswered, selectedAnswer }: ChooseWeakQuestionProps) {
  const data = useMemo(() => parseChooseWeak(question.content), [question.content]);
  const { play, isPlaying } = useSynthesisAudio();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [autoPlayed, setAutoPlayed] = useState(false);

  // Autoplay speech 500ms sau mount
  useEffect(() => {
    if (!data.sentence || autoPlayed) return;
    const t = window.setTimeout(() => { play(data.sentence); setAutoPlayed(true); }, 500);
    return () => window.clearTimeout(t);
  }, [data.sentence, play, autoPlayed]);

  // Reset selection khi đổi question
  useEffect(() => { setSelected(new Set()); }, [question.id]);

  // options = sentence words (AnswerOption rows); fallback split sentence
  const options = question.options.length > 0
    ? question.options
    : data.sentence.replace(/[.,!?]/g, "").split(/\s+/).filter(Boolean).map((w, i) => ({ id: `${question.id}-w-${i}`, content: w }));

  const expectedSet = new Set(data.weakWords.map(normalizeAnswer).filter(Boolean));

  const toggle = (optId: string) => {
    if (isAnswered) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(optId)) next.delete(optId); else next.add(optId);
      return next;
    });
  };

  const submit = () => {
    if (isAnswered || selected.size === 0) return;
    const selectedContents = options.filter((o) => selected.has(o.id)).map((o) => o.content);
    const selectedSet = new Set(selectedContents.map(normalizeAnswer).filter(Boolean));
    const isCorrect = expectedSet.size === selectedSet.size && [...expectedSet].every((x) => selectedSet.has(x));
    const selectedTextJoin = selectedContents.join(",");
    onAnswer(isCorrect, selectedTextJoin, null, selectedTextJoin);
  };

  return (
    <div className="space-y-10 text-center">
      <div className="flex flex-col items-center gap-4">
        <button type="button" onClick={() => play(data.sentence)} disabled={isPlaying}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-warning-200 bg-warning-50 px-4 py-2 text-sm font-bold text-warning-800 transition-colors hover:bg-warning-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-warning-500 disabled:opacity-50">
          🎧 {isPlaying ? "Đang phát..." : "Nghe câu"}
        </button>
        {data.ipa && <p className="font-ipa text-xl text-neutral-600">{data.ipa}</p>}
      </div>

      <div>
        <p className="mb-6 text-lg font-medium text-neutral-600">Chọn từ đọc lướt (weak /ə/)</p>
        <div className="flex flex-wrap justify-center gap-3">
          {options.map((option) => {
            const isSelected = selected.has(option.id);
            const isCorrectOpt = expectedSet.has(normalizeAnswer(option.content));
            let cls = "border-neutral-200 bg-white text-neutral-800 hover:border-primary-300";
            if (isAnswered) {
              if (isCorrectOpt) cls = "border-success-500 bg-success-50 text-success-700 ring-4 ring-success-100";
              else if (isSelected) cls = "border-error-500 bg-error-50 text-error-700";
              else cls = "border-neutral-200 bg-neutral-50 text-neutral-400";
            } else if (isSelected) {
              cls = "border-primary-500 bg-primary-50 text-primary-700 ring-4 ring-primary-100";
            }
            return (
              <button key={option.id} type="button" onClick={() => toggle(option.id)} disabled={isAnswered}
                aria-pressed={isSelected}
                className={`min-h-11 rounded-lg border-4 px-4 py-2 text-base font-bold transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 ${cls}`}>
                {option.content}
              </button>
            );
          })}
        </div>
        {!isAnswered && (
          <button type="button" onClick={submit} disabled={selected.size === 0}
            className="mt-8 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary-600 px-8 py-3 text-base font-bold text-white transition-colors hover:bg-primary-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 disabled:opacity-50">
            Xong ({selected.size})
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify tsc**
```bash
npx tsc --noEmit
```
Expected: 0 error. (Lưu ý: `onAnswer` 4-param — Task 8 mở rộng `handleAnswerListen` match. Nếu tsc complain về type mismatch ở dispatch (Task 8), adjust ở đó.)

- [ ] **Step 3: Checkpoint review với user**

Báo user: ChooseWeakQuestion tạo (multi-select + "Xong"), tsc clean. **Flag refinement `handleAnswerListen` +param `selectedTextOverride?`** (header) — sẽ mở rộng ở Task 8. Review rồi tiếp Task 6.

---

## Task 6: Component `ChooseLinkingQuestion` (qtype-6, multi-select pair chips)

**Files:**
- Create: `src/app/exercises/[id]/ChooseLinkingQuestion.tsx`

**Context:** g03 Linking. contentJson `{ sentence, ipa, linkingPairs:string[][], audioUrl:null }`. `question.options` = AnswerOption rows = adjacent pairs `["Turn→off","off→the",...]`. `question.answer` = `linkingPairs.map(p=>p.join("→")).join(",")`. Multi-select — cùng pattern choose-weak, chip = pair.

- [ ] **Step 1: Tạo `ChooseLinkingQuestion.tsx`**

Tạo `src/app/exercises/[id]/ChooseLinkingQuestion.tsx` (copy ChooseWeakQuestion + sửa parse + label):
```tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { type ExerciseQuestion } from "./ExerciseEngineClient";
import { useSynthesisAudio } from "./useSynthesisAudio";

type ChooseLinkingQuestionProps = {
  question: ExerciseQuestion;
  onAnswer: (isCorrect: boolean, selectedOpt: string, selectedOptionId?: string | null, selectedTextOverride?: string) => void;
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

function normalizeAnswer(value: string) {
  return value.toLowerCase().replace(/[^\w\s→]|_/g, "").replace(/\s+/g, " ").trim();
}

export default function ChooseLinkingQuestion({ question, onAnswer, isAnswered, selectedAnswer }: ChooseLinkingQuestionProps) {
  const data = useMemo(() => parseChooseLinking(question.content), [question.content]);
  const { play, isPlaying } = useSynthesisAudio();
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [autoPlayed, setAutoPlayed] = useState(false);

  useEffect(() => {
    if (!data.sentence || autoPlayed) return;
    const t = window.setTimeout(() => { play(data.sentence); setAutoPlayed(true); }, 500);
    return () => window.clearTimeout(t);
  }, [data.sentence, play, autoPlayed]);

  useEffect(() => { setSelected(new Set()); }, [question.id]);

  const options = question.options.length > 0
    ? question.options
    : (() => {
        const words = data.sentence.replace(/[.,!?]/g, "").split(/\s+/).filter(Boolean);
        const pairs: { id: string; content: string }[] = [];
        for (let i = 0; i < words.length - 1; i++) pairs.push({ id: `${question.id}-p-${i}`, content: `${words[i]}→${words[i + 1]}` });
        return pairs;
      })();

  const expectedSet = new Set(data.linkingPairs.map((p) => p.join("→")).map(normalizeAnswer).filter(Boolean));

  const toggle = (optId: string) => {
    if (isAnswered) return;
    setSelected((prev) => { const n = new Set(prev); if (n.has(optId)) n.delete(optId); else n.add(optId); return n; });
  };

  const submit = () => {
    if (isAnswered || selected.size === 0) return;
    const selectedContents = options.filter((o) => selected.has(o.id)).map((o) => o.content);
    const selectedSet = new Set(selectedContents.map(normalizeAnswer).filter(Boolean));
    const isCorrect = expectedSet.size === selectedSet.size && [...expectedSet].every((x) => selectedSet.has(x));
    const join = selectedContents.join(",");
    onAnswer(isCorrect, join, null, join);
  };

  return (
    <div className="space-y-10 text-center">
      <div className="flex flex-col items-center gap-4">
        <button type="button" onClick={() => play(data.sentence)} disabled={isPlaying}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-warning-200 bg-warning-50 px-4 py-2 text-sm font-bold text-warning-800 transition-colors hover:bg-warning-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-warning-500 disabled:opacity-50">
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
            if (isAnswered) {
              if (isCorrectOpt) cls = "border-success-500 bg-success-50 text-success-700 ring-4 ring-success-100";
              else if (isSelected) cls = "border-error-500 bg-error-50 text-error-700";
              else cls = "border-neutral-200 bg-neutral-50 text-neutral-400";
            } else if (isSelected) cls = "border-primary-500 bg-primary-50 text-primary-700 ring-4 ring-primary-100";
            return (
              <button key={option.id} type="button" onClick={() => toggle(option.id)} disabled={isAnswered}
                aria-pressed={isSelected}
                className={`min-h-11 rounded-lg border-4 px-4 py-2 text-base font-bold transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 ${cls}`}>
                {option.content}
              </button>
            );
          })}
        </div>
        {!isAnswered && (
          <button type="button" onClick={submit} disabled={selected.size === 0}
            className="mt-8 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary-600 px-8 py-3 text-base font-bold text-white transition-colors hover:bg-primary-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 disabled:opacity-50">
            Xong ({selected.size})
          </button>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify tsc**
```bash
npx tsc --noEmit
```
Expected: 0 error.

- [ ] **Step 3: Checkpoint review với user**

Báo user: ChooseLinkingQuestion tạo (multi-select pair chips), tsc clean. Review rồi tiếp Task 7.

---

## Task 7: Component `ChooseAssimilationQuestion` (qtype-7, single-select variant buttons)

**Files:**
- Create: `src/app/exercises/[id]/ChooseAssimilationQuestion.tsx`

**Context:** g04 Assimilation. contentJson `{ sentence, ipa, assimilationType, original, result, audioUrl:null }`. `question.options` = AnswerOption rows = `[result, original]`. `question.answer` = `assimResult` (vd `"didʒu"` IPA exact, KHÔNG normalize). Single-select — bấm 1 button → `onAnswer`. Pattern tap-stress (single) + speechSynthesis.

- [ ] **Step 1: Tạo `ChooseAssimilationQuestion.tsx`**

Tạo `src/app/exercises/[id]/ChooseAssimilationQuestion.tsx`:
```tsx
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

export default function ChooseAssimilationQuestion({ question, onAnswer, isAnswered, selectedAnswer }: ChooseAssimilationQuestionProps) {
  const data = useMemo(() => parseChooseAssimilation(question.content), [question.content]);
  const { play, isPlaying } = useSynthesisAudio();
  const [autoPlayed, setAutoPlayed] = useState(false);

  useEffect(() => {
    if (!data.sentence || autoPlayed) return;
    const t = window.setTimeout(() => { play(data.sentence); setAutoPlayed(true); }, 500);
    return () => window.clearTimeout(t);
  }, [data.sentence, play, autoPlayed]);

  // options = [result, original] (AnswerOption rows); fallback parse từ content
  const options = question.options.length > 0
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
        <button type="button" onClick={() => play(data.sentence)} disabled={isPlaying}
          className="inline-flex min-h-11 items-center justify-center rounded-lg border border-warning-200 bg-warning-50 px-4 py-2 text-sm font-bold text-warning-800 transition-colors hover:bg-warning-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-warning-500 disabled:opacity-50">
          🎧 {isPlaying ? "Đang phát..." : "Nghe câu tự nhiên"}
        </button>
        {data.assimilationType && (
          <p className="text-base font-medium text-neutral-600">Loại biến âm: <span className="font-ipa font-bold">{data.assimilationType}</span></p>
        )}
      </div>
      <div>
        <p className="mb-6 text-lg font-medium text-neutral-600">Chọn phát âm đúng (nghe câu tự nhiên)</p>
        <div className="flex flex-wrap justify-center gap-4">
          {options.map((option) => {
            const isCorrectOpt = checkCorrect(option.content);
            const isSelected = option.content === selectedAnswer;
            let cls = "border-neutral-200 bg-white text-neutral-800 hover:border-primary-300";
            if (isAnswered) {
              if (isCorrectOpt) cls = "border-success-500 bg-success-50 text-success-700 ring-4 ring-success-100";
              else if (isSelected) cls = "border-error-500 bg-error-50 text-error-700 animate-shake";
              else cls = "border-neutral-200 bg-neutral-50 text-neutral-400";
            }
            return (
              <button key={option.id} type="button"
                onClick={() => onAnswer(isCorrectOpt, option.content, question.options.length > 0 ? option.id : null)}
                disabled={isAnswered} aria-pressed={isSelected}
                className={`h-24 min-w-48 rounded-xl border-4 px-6 font-ipa text-2xl font-bold transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 ${cls}`}>
                {option.content}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify tsc**
```bash
npx tsc --noEmit
```
Expected: 0 error.

- [ ] **Step 3: Checkpoint review với user**

Báo user: ChooseAssimilationQuestion tạo (single-select variant, IPA exact), tsc clean. 4 component xong. Review rồi tiếp Task 8 (engine dispatch + handleAnswerListen mở rộng).

---

## Task 8: Engine dispatch — 4 branch render + mở rộng `handleAnswerListen`

**Files:**
- Modify: `src/app/exercises/[id]/ExerciseEngineClient.tsx`

**Context:** Thêm import 4 component + 4 branch render `qtype-4..7` (`:572-575`). Mở rộng `handleAnswerListen` (`:405`) +param `selectedTextOverride?` để multi-select truyền join string (refinement header).

- [ ] **Step 1: Thêm import 4 component CĐ4**

Tìm phần import component trong `ExerciseEngineClient.tsx` (sau import `SpeakMinimalPairsQuestion` hoặc tương tự). Thêm:
```ts
import TapStressQuestion from "./TapStressQuestion";
import ChooseWeakQuestion from "./ChooseWeakQuestion";
import ChooseLinkingQuestion from "./ChooseLinkingQuestion";
import ChooseAssimilationQuestion from "./ChooseAssimilationQuestion";
```

- [ ] **Step 2: Mở rộng `handleAnswerListen` +param `selectedTextOverride?`**

Sửa `handleAnswerListen` (`:405`):
```ts
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
    selectedText: selectedTextOverride ?? answerOpt,  // multi-select truyền join
    transcript: null,
    timeSpent: null,
  });

  if (correct) {
    setScore((current) => current + currentQuestion.score);
    playSfx("correct");
    combo.onCorrect();
  } else {
    addIncorrectQuestion(answerOpt);
    playSfx("wrong");
    combo.onWrong();
  }
};
```

- [ ] **Step 3: Thêm 4 branch render trong dispatch (`:572-575`)**

Tìm dispatch block (sau branch `qtype-3-minimal-pairs` ~`:572`, trước fallback/close). Thêm 4 branch:
```tsx
{currentQuestion.type === "qtype-4-tap-stress" && (
  <TapStressQuestion
    question={currentQuestion}
    onAnswer={handleAnswerListen}
    isAnswered={isAnswered}
    selectedAnswer={selectedAnswer}
  />
)}

{currentQuestion.type === "qtype-5-choose-weak" && (
  <ChooseWeakQuestion
    question={currentQuestion}
    onAnswer={handleAnswerListen}
    isAnswered={isAnswered}
    selectedAnswer={selectedAnswer}
  />
)}

{currentQuestion.type === "qtype-6-choose-linking" && (
  <ChooseLinkingQuestion
    question={currentQuestion}
    onAnswer={handleAnswerListen}
    isAnswered={isAnswered}
    selectedAnswer={selectedAnswer}
  />
)}

{currentQuestion.type === "qtype-7-choose-assimilation" && (
  <ChooseAssimilationQuestion
    question={currentQuestion}
    onAnswer={handleAnswerListen}
    isAnswered={isAnswered}
    selectedAnswer={selectedAnswer}
  />
)}
```

- [ ] **Step 4: Verify tsc**
```bash
npx tsc --noEmit
```
Expected: 0 error. (Nếu lỗi type mismatch `onAnswer` 4-param vs `handleAnswerListen` — verify Step 2 đã thêm `selectedTextOverride?` optional. TapStress/Assimilation gọi `onAnswer(isCorrect, opt, id)` 3-param — OK vì param 4 optional. ChooseWeak/Linking gọi 4-param.)

- [ ] **Step 5: Verify test không regression**
```bash
npm test
```
Expected: ALL pass (scoring test CĐ4 + cũ + lesson-content + catalog + khác). 68+ test.

- [ ] **Step 6: Checkpoint review với user**

Báo user: engine dispatch 4 branch + handleAnswerListen mở rộng, tsc clean, test pass. Review rồi tiếp Task 9 (playtest + quality gate).

---

## Task 9: Playtest + quality gate (final)

**Files:**
- Không sửa — verify runtime

- [ ] **Step 1: Build app**
```bash
npm run build
```
Expected: Next.js build success (compile 4 component mới + engine edit, không lỗi import).

- [ ] **Step 2: Chạy dev server (background) + playtest manual**

```bash
npm run dev
```
Mở browser → /learning_map → CĐ4 (chưa unlock gating SP6, click trực tiếp group) → làm 4 exercise mode_a:
- g01 Word Stress mode_a (tap-stress): nghe mp3 + bấm syllable → feedback đáy ✓/✗.
- g02 Weak Forms mode_a (choose-weak): nghe speechSynthesis + toggle word chips + "Xong" → feedback.
- g03 Linking mode_a (choose-linking): nghe + toggle pair chips + "Xong" → feedback.
- g04 Assimilation mode_a (choose-assimilation): nghe + bấm 1 variant → feedback.

Verify: audio phát (mp3 g01 / speechSynthesis g02-4), chọn đúng/sai highlight xanh/đỏ, `ListenFeedbackSheet` trồi đáy không đẩy content, nút "Tiếp theo" advance. Submit 1 bài → score đúng (không 0).

- [ ] **Step 3: Final quality gate — test full + tsc + build**
```bash
npm test
npx tsc --noEmit
npm run build
```
Expected:
- `npm test`: ALL pass (68+ test, không regression).
- `tsc`: 0 error.
- `build`: success.

- [ ] **Step 4: Checkpoint final review với user**

Báo user: **SP4 Mode A hoàn tất**. 4 component + scoring + engine dispatch done. 4 exercise mode_a playable (playtest manual verified). Quality gate pass. User review + commit khi convenient. **Mode B (acceptedAnswers multi-answer) = spec riêng sau.**

---

## Self-Review

### 1. Spec coverage
- **Spec "Mục tiêu"** (4 component + 4 branch engine + 4 branch scoring, Mode A playable): Task 4-7 (component) + Task 8 (engine) + Task 2 (scoring) + Task 9 (playtest). ✓
- **Spec section 1 (hiện trạng)**: explore map ghi (dispatch theo type, parseWordPrompt drop field, acceptedAnswers chưa consume, qtype-4..7 render blank). Plan component tự parse (Task 4-7) + scoring branch (Task 2). ✓
- **Spec section 2 (scope)**: 4 component + engine + scoring + test, defer Mode B/gating/multiplier. Plan Task 1-9 đúng scope. ✓
- **Spec section 3 (data flow)**: contentJson shape, AnswerOption flow, parse pattern. Task 4-7 parse đúng shape, dùng `question.options` + fallback. ✓
- **Spec section 4 (UI layout)**: 4 ASCII mockup (tap-stress blocks, choose-weak chips+Xong, choose-linking pair chips+Xong, assimilation variant buttons). Task 4-7 JSX khớp mockup. ✓
- **Spec section 5 (scoring)**: 4 branch + buildResult + 3 helper, 7-field QuestionScoreResult. Task 2 code khớp (sửa 7-field so với brainstorm). ✓
- **Spec section 6 (test)**: 4 test qtype-4..7 TDD. Task 1. ✓
- **Spec section 7 (file)**: 4 component tạo + useSynthesisAudio + scoring + test + engine. Plan đúng. ✓
- **Spec section 8 (behavior)**: 4 exercise playable, scoring đúng, ListenFeedbackSheet, không đụng XP/Mode B. ✓
- **Spec section 9 (rủi ro)**: multi-select pattern mới (Task 5 helper), speechSynthesis (Task 3 useSynthesisAudio), IPA exact (Task 7), parseWordPrompt drop (Task 4-7 tự parse), QuestionScoreResult 7 field (Task 2 buildResult). ✓

**Gap phát hiện & xử lý:**
- `handleAnswerListen` ghi `selectedText: answerOpt` single → multi-select cần join → refinement header: mở rộng +param `selectedTextOverride?` (Task 8 Step 2). Spec không nói rõ — plan bổ sung.
- `useSynthesisAudio` helper (Task 3) — spec ghi "optional, judge plan phase" → plan quyết định tạo (DRY 3 component câu).
- Component fallback `options` nếu `question.options` rỗng (Task 4-7) — spec rủi ro ghi "judge plan" → plan thêm fallback parse từ content.

### 2. Placeholder scan
- Không có "TBD"/"TODO"/"implement later"/"similar to Task N".
- Mỗi task code đầy đủ: Task 1 (4 test verbatim), Task 2 (scoring helpers verbatim), Task 3 (helper), Task 4-7 (component ~80-130 dòng verbatim), Task 8 (import + handleAnswerListen + 4 branch), Task 9 (commands).
- UI JSX đầy đủ (className Tailwind, state, event handler).

### 3. Type consistency
- `ExerciseQuestion` (Task 4-7 import từ `./ExerciseEngineClient`) khớp `:16-36`. ✓
- `onAnswer` signature: tap-stress/assimilation 3-param `(isCorrect, selectedOpt, selectedOptionId?)`, choose-weak/linking 4-param `(isCorrect, selectedOpt, selectedOptionId?, selectedTextOverride?)`. `handleAnswerListen` (Task 8) mở rộng 4-param optional — match cả 2. ✓
- `SubmitAnswerInput` (Task 2) dùng `selectedOptionId`/`selectedText` — khớp `scoring.ts:1-8`. ✓
- `QuestionScoreResult` 7 field (Task 2 `buildResult`) — khớp `scoring.ts:24-35`. ✓
- `ScoringQuestion` (Task 1 `makeQuestion` override `type.id`) — khớp `scoring.ts:10-22`. ✓
- `useSynthesisAudio` (Task 3) return `{ play, isPlaying }` — Task 5/6/7 dùng đúng. ✓
- `parseTapStress`/`parseChooseWeak`/`parseChooseLinking`/`parseChooseAssimilation` (Task 4-7) — field khớp contentJson seed (spec section 3). ✓
- `normalizeAnswer` (Task 5/6) — pattern `SpeakMinimalPairsQuestion:57`. Task 6 linking thêm `→` vào regex giữ char. ✓

No type drift found.

### Note cho engineer
- **Refinement `handleAnswerListen` +param `selectedTextOverride?`** (header) — Task 8 Step 2. Multi-select (Task 5/6) truyền join string qua param 4. Single-select (Task 4/7) gọi 3-param (param 4 undefined).
- **`useSynthesisAudio`** (Task 3) — tạo helper DRY. Nếu engineer thấy 3 component câu không share đủ logic → có thể inline từng cái (nhưng plan recommend helper).
- **Component fallback options** (Task 4-7) — nếu `question.options` rỗng (seed chưa tạo AnswerOption), parse từ content. SP3d verify AnswerOption đã tạo nhưng fallback phòng hờ.
- **IPA exact match** (Task 7 `checkCorrect`) — KHÔNG `normalizeAnswer` (giữ ʒ). Scoring `scoreSingleSelect` cũng exact. Test bắt.
- **Task 9 playtest manual** — cần browser + dev server. Nếu user không playtest được (không có browser) → verify build + test OK là đủ (playtest = nice-to-have, scoring verify qua test).

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-19-sp4-modea-cd4-ui.md`. Two execution options:

**1. Subagent-Driven (recommended)** — Tôi dispatch fresh subagent per task, review giữa task. Phù hợp 9 task tuần tự (Task 1 test → Task 2 scoring → Task 3 helper → Task 4-7 component → Task 8 engine → Task 9 quality gate).

**2. Inline Execution** — Execute task trong session này bằng executing-plans, batch + checkpoint.

**Git policy:** Engineer không tự commit (user handles). 1 commit gộp sau Task 9 (hoặc 2 commit: scoring Task 1-2, component+engine Task 3-9).

Which approach?
