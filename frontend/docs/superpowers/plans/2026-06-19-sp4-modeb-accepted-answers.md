# SP4 Mode B — acceptedAnswers multi-answer Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Git policy:** Engineer KHÔNG tự commit. Mỗi task kết thúc checkpoint review với user; user tự commit khi convenient.

**Goal:** Enable multi-answer cho g02 weak-forms Mode B (4 câu): SpeechRecognition so khớp transcript với nhiều dạng accepted (max overlap) thay vì chỉ `question.answer` đơn.

**Architecture:** Hướng spec `2026-06-19-sp4-modeb-accepted-answers-design.md`. 5 điểm sửa (scope nhỏ, không tạo file mới): `page.tsx` map `acceptedAnswers` + `ExerciseQuestion` type +field + `ScoringQuestion` type +field + `scoreVoice` max-match + `SpeakSentenceQuestion.checkAnswer` multi-match. TDD: mở rộng `scoring.test.ts` 2 test (fail) → implement → pass. **KHÔNG sửa submit/route.ts** (raw Prisma object include default `acceptedAnswers`, TypeScript structural typing accept).

**Tech Stack:** Next.js 16, React 18, TypeScript 6, Prisma 6, Tailwind 4, test runner `tsx --test` (Node `node:test` + `node:assert/strict`).

**Spec reference:** `docs/superpowers/specs/2026-06-19-sp4-modeb-accepted-answers-design.md`

**Codebase root note:** Source dưới `english_pronunciation_app/frontend/`. Path tương đối từ đây. Chạy `npm`/`npx`/`tsx` từ đây.

**Key type reminder:**
- `ScoringQuestion` (`scoring.ts:10-22`): `{ id, answer, score, type:{id,name}, options[] }` → +field `acceptedAnswers?: string[] | null`.
- `ExerciseQuestion` (`ExerciseEngineClient.tsx:16-36`): `{ id, name, content, type, answer, score, options[] }` → +field `acceptedAnswers?: string[] | null`.
- `scoreVoice` (`scoring.ts:107-125`): `calculateWordOverlapAccuracy(question.answer, transcript) ≥ 80`. Score = `round(question.score * accuracy / 100)`.
- `SpeakSentenceQuestion.checkAnswer` (`:69-76`): local `calculateWordOverlapAccuracy(question.answer, recordedText) ≥ 80`.

---

## File Structure

| Hành động | File | Trách nhiệm |
|---|---|---|
| sửa | `src/lib/__tests__/scoring.test.ts` | +2 test scoreVoice acceptedAnswers (TDD fail trước) |
| sửa | `src/lib/scoring.ts` | `ScoringQuestion` +field + `scoreVoice` max-match |
| sửa | `src/app/exercises/[id]/ExerciseEngineClient.tsx` | `ExerciseQuestion` type +field `acceptedAnswers?` |
| sửa | `src/app/exercises/[id]/page.tsx` | map `acceptedAnswers` vào exerciseData.questions |
| sửa | `src/app/exercises/[id]/SpeakSentenceQuestion.tsx` | `checkAnswer` multi-match (max overlap) |

**Decomposition rationale:** Task 1 test TDD (fail) → Task 2 scoring types + scoreVoice (pass) → Task 3 engine + page plumbing → Task 4 SpeakSentenceQuestion local match → Task 5 quality gate. Scoring trước (foundation), plumbing giữa, component UI cuối.

**KHÔNG sửa:** submit/route.ts (raw Prisma object OK), SpeakWordQuestion (g01 single), Mode A (xong), seed/content (SP3d), schema.

---

## Task 1: Test TDD scoring — scoreVoice acceptedAnswers (fail trước)

**Files:**
- Modify: `src/lib/__tests__/scoring.test.ts`

- [ ] **Step 1: Thêm 2 test scoreVoice acceptedAnswers vào cuối file**

Thêm vào cuối `src/lib/__tests__/scoring.test.ts` (sau test qtype-7 Mode A):
```ts
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
```

- [ ] **Step 2: Chạy test verify fail**
```bash
npx tsx --test "src/lib/__tests__/scoring.test.ts"
```
Expected: 2 test mới FAIL — test 1 (match dạng 2): `scoreVoice` chỉ match `question.answer` ("I'm...") vs transcript "I am..." → overlap thấp (chỉ "going to the shop" match, "I'm" vs "I am" khác) → accuracy < 80 → isCorrect false (sai, phải true). Test 2 pass (single logic cũ OK). (Lưu ý: `makeQuestion` type hiện không có `acceptedAnswers` → tsc error nếu check. Nhưng `Partial<ScoringQuestion>` override — nếu `ScoringQuestion` chưa +field, TS reject `acceptedAnswers` key. → Step 2 có thể tsc fail trước khi test chạy. Engineer: nếu tsc error "Object literal may only specify known properties" → skip sang Task 2 trước (add field), rồi quay Task 1 Step 2. Hoặc dùng `as any` cast tạm. Plan recommend: Task 1 Step 1 add test, Task 2 add field, rồi chạy Task 1 Step 2.)

- [ ] **Step 3: Checkpoint review với user**

Báo user: 2 test Mode B thêm (tsc có thể error do ScoringQuestion thiếu field — sẽ fix Task 2). Review rồi tiếp Task 2.

---

## Task 2: Scoring — ScoringQuestion +field + scoreVoice max-match

**Files:**
- Modify: `src/lib/scoring.ts`

- [ ] **Step 1: `ScoringQuestion` +field `acceptedAnswers`**

Sửa `ScoringQuestion` (`scoring.ts:10-22`). Thêm field trước `options`:
```ts
export type ScoringQuestion = {
  id: string;
  answer: string;
  score: number;
  type: {
    id: string;
    name: string;
  };
  acceptedAnswers?: string[] | null;  // MỚI: Mode B multi-answer
  options: Array<{
    id: string;
    content: string;
  }>;
};
```

- [ ] **Step 2: `scoreVoice` max-match**

Sửa `scoreVoice` (`scoring.ts:107-125`):
```ts
function scoreVoice(question: ScoringQuestion, answer: SubmitAnswerInput): QuestionScoreResult {
  const transcript = answer.transcript ?? "";
  // Mode B multi-answer: max overlap across [answer, ...acceptedAnswers]
  const candidates =
    question.acceptedAnswers && question.acceptedAnswers.length > 0
      ? [question.answer, ...question.acceptedAnswers]
      : [question.answer];
  const accuracyScore = Math.max(...candidates.map((c) => calculateWordOverlapAccuracy(c, transcript)));
  const isCorrect = accuracyScore >= 80;
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
```

- [ ] **Step 3: Chạy test verify pass**
```bash
npx tsx --test "src/lib/__tests__/scoring.test.ts"
```
Expected: TẤT CẢ test pass (cũ + 2 mới Mode B). Test 1 (match dạng 2): max overlap "I am going to the shop" = 100% → isCorrect true. Test 2 (single): candidates = [answer] → logic cũ.

- [ ] **Step 4: Verify tsc**
```bash
npx tsc --noEmit
```
Expected: 0 error (ScoringQuestion +field optional, submit route raw object assign OK structural typing).

- [ ] **Step 5: Checkpoint review với user**

Báo user: scoring Mode B xong (ScoringQuestion +field, scoreVoice max-match), 2 test pass, tsc clean. Review rồi tiếp Task 3.

---

## Task 3: Engine + page plumbing — ExerciseQuestion +field + page.tsx map

**Files:**
- Modify: `src/app/exercises/[id]/ExerciseEngineClient.tsx`, `src/app/exercises/[id]/page.tsx`

- [ ] **Step 1: `ExerciseQuestion` type +field**

Trong `ExerciseEngineClient.tsx`, tìm `ExerciseQuestion` type (`:16-36`). Thêm field trước `options`:
```ts
export type ExerciseQuestion = {
  id: string;
  name: string | null;
  content: string;
  type: string;
  answer: string;
  score: number;
  acceptedAnswers?: string[] | null;  // MỚI: Mode B multi-answer
  options: ExerciseQuestionOption[];
};
```

- [ ] **Step 2: `page.tsx` map `acceptedAnswers`**

Trong `page.tsx:76-84`, sửa map thêm field:
```ts
questions: exercise.questions.map((question) => ({
  id: question.id,
  name: question.name,
  content: question.content,
  type: question.type.id,
  answer: question.answer,
  acceptedAnswers: question.acceptedAnswers as string[] | null,  // MỚI
  score: question.score,
  options: getQuestionOptions(question),
})),
```

- [ ] **Step 3: Verify tsc**
```bash
npx tsc --noEmit
```
Expected: 0 error. (Lưu ý: `page.tsx` Prisma `question.acceptedAnswers` là `JsonValue | null` → cast `as string[] | null`. Nếu tsc complain về JsonValue → cast `as unknown as string[] | null`.)

- [ ] **Step 4: Verify test không regression**
```bash
npm test
```
Expected: ALL pass (72+ test, không regression).

- [ ] **Step 5: Checkpoint review với user**

Báo user: engine + page plumbing xong (ExerciseQuestion +field, page map), tsc clean, test pass. Review rồi tiếp Task 4.

---

## Task 4: SpeakSentenceQuestion — checkAnswer multi-match

**Files:**
- Modify: `src/app/exercises/[id]/SpeakSentenceQuestion.tsx`

- [ ] **Step 1: `checkAnswer` multi-match**

Trong `SpeakSentenceQuestion.tsx:69-76`, sửa `checkAnswer`:
```ts
const checkAnswer = (recordedText: string) => {
  setStatus("processing");
  recorder.stop();
  window.setTimeout(() => {
    // Mode B multi-answer: max overlap across [answer, ...acceptedAnswers]
    const candidates =
      question.acceptedAnswers && question.acceptedAnswers.length > 0
        ? [question.answer, ...question.acceptedAnswers]
        : [question.answer];
    const acc = Math.max(...candidates.map((c) => calculateWordOverlapAccuracy(c, recordedText)));
    setStatus(acc >= 80 ? "correct" : "incorrect");
  }, 400);
};
```

- [ ] **Step 2: Verify tsc**
```bash
npx tsc --noEmit
```
Expected: 0 error.

- [ ] **Step 3: Verify test không regression**
```bash
npm test
```
Expected: ALL pass.

- [ ] **Step 4: Checkpoint review với user**

Báo user: SpeakSentenceQuestion multi-match xong, tsc clean, test pass. Review rồi tiếp Task 5 (quality gate).

---

## Task 5: Quality gate (final)

**Files:**
- Không sửa — verify

- [ ] **Step 1: Build app**
```bash
npm run build
```
Expected: Next.js build success.

- [ ] **Step 2: Final quality gate — test full + tsc + build**
```bash
npm test
npx tsc --noEmit
npm run build
```
Expected:
- `npm test`: ALL pass (74 test = 72 cũ + 2 Mode B).
- `tsc`: 0 error.
- `build`: success.

- [ ] **Step 3: Playtest manual (optional, user)**

`npm run dev` → /learning_map → CĐ4 → g02 Weak Forms mode_b (Đọc & So khớp) → đọc "I'm going to the shop" HOẶC "I am going to the shop" → cả 2 accept (correct). Verify g01/g03/g04 mode_b vẫn hoạt động (single answer).

- [ ] **Step 4: Checkpoint final review với user**

Báo user: **SP4 Mode B hoàn tất**. acceptedAnswers multi-answer enable cho g02 weak-forms (4 câu). Quality gate pass. User review + commit khi convenient. **SP4 (Mode A + Mode B) hoàn tất.**

---

## Self-Review

### 1. Spec coverage
- **Spec "Mục tiêu"** (multi-answer g02 Mode B, acceptedAnswers consume): Task 2 (scoring) + Task 3 (plumbing) + Task 4 (component). ✓
- **Spec section 1 (hiện trạng)**: acceptedAnswers chưa consume, scoreVoice single, submit route raw OK. Plan đúng. ✓
- **Spec section 2 (scope)**: 5 điểm sửa + test, defer SpeakWord/gating/Mode A. Plan 5 task đúng. ✓
- **Spec section 3 (scoreVoice max-match)**: Task 2 code khớp spec. ✓
- **Spec section 4 (data plumbing)**: Task 3 page.tsx + ExerciseQuestion, Task 2 ScoringQuestion. submit route KHÔNG sửa (spec update). ✓
- **Spec section 5 (test)**: Task 1 2 test. ✓
- **Spec section 6 (file)**: 5 file sửa, không tạo. Plan đúng. ✓
- **Spec section 7 (behavior)**: g02 multi, g01/3/4 không đổi. ✓
- **Spec section 8 (rủi ro)**: Json cast, Math.max guard, submit route verify, SpeakWord không đụng. Plan handle. ✓

### 2. Placeholder scan
- Không có TBD/TODO. Mỗi task code đầy đủ (test verbatim, scoring code, type +field, page map, checkAnswer).

### 3. Type consistency
- `ScoringQuestion` +field `acceptedAnswers?: string[] | null` (Task 2) — `scoreVoice` đọc `question.acceptedAnswers` (Task 2) match. ✓
- `ExerciseQuestion` +field (Task 3) — `SpeakSentenceQuestion` đọc `question.acceptedAnswers` (Task 4) match. ✓
- `page.tsx` cast `as string[] | null` (Task 3) — Prisma `JsonValue | null` → cast OK. ✓
- `makeQuestion` override `acceptedAnswers` (Task 1) — `Partial<ScoringQuestion>` chứa field sau Task 2. ✓
- `Math.max(...candidates.map(...))` — candidates luôn ≥1 (`[question.answer]`), không -Infinity. ✓

No type drift.

### Note cho engineer
- **Task 1 tsc có thể error** trước Task 2 (ScoringQuestion thiếu field) — plan ghi rõ: nếu tsc reject `acceptedAnswers` key trong `makeQuestion`, sang Task 2 add field trước rồi chạy Task 1 Step 2.
- **submit/route.ts KHÔNG sửa** — raw Prisma object include default `acceptedAnswers`, TypeScript structural typing accept `ScoringQuestion` +field optional. Verify dòng 121-126.
- **`page.tsx` cast** — nếu `as string[] | null` tsc complain (JsonValue), dùng `as unknown as string[] | null`.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-19-sp4-modeb-accepted-answers.md`. Two execution options:

**1. Subagent-Driven (recommended)** — 5 task tuần tự, scope nhỏ.
**2. Inline Execution** — batch + checkpoint.

**Git policy:** Engineer không tự commit. 1 commit gộp sau Task 5.

Which approach?
