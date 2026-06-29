# SP4 Mode B — acceptedAnswers multi-answer (Mode B CĐ4) Design

Ngày: 2026-06-19
Trạng thái: design đã duyệt (text-only brainstorm, scope nhỏ — data plumbing + scoring). SP4 Mode A đã xong (commit pending). SP3d đã seed `acceptedAnswers` (g02 weak-forms 4 câu multi, g01/3/4 null đơn trị).
Scope: master **SP4** (Exercise Engine v2) — **Mode B** (2/2 nửa CĐ4). Mode A (4 UI listen-style) đã xong spec riêng.

## Mục tiêu

Enable multi-answer cho Mode B CĐ4: user đọc câu/từ, SpeechRecognition so khớp transcript với **nhiều dạng accepted** (vd "I'm going to the shop" accept cả "I am going to the shop") thay vì chỉ `question.answer` đơn trị. Hiện `acceptedAnswers` (Json?) được seed (SP3d) nhưng **chưa consume anywhere** (grep 0 matches src/). Mode B plumbing đầy đủ: page loader select + engine type + scoring type + `scoreVoice` max-match + SpeakSentenceQuestion local match.

## 1. Hiện trạng (verify 19/06)

- **Mode B route hiện có**: typeId `qtype-2-voice` → engine dispatch `SpeakWordQuestion` (g01, `content.word` có) / `SpeakSentenceQuestion` (g02/3/4, `content.sentence` có). **Không tạo component mới** — chỉ sửa `SpeakSentenceQuestion` (g02 multi) + scoring.
- **`acceptedAnswers` chưa consume**: grep 0 matches `src/`. `page.tsx:76-84` không select/map. `ExerciseQuestion` type (`ExerciseEngineClient.tsx:16-36`) không có field. `ScoringQuestion` (`scoring.ts:10-22`) không có field. `scoreVoice` (`:107-125`) chỉ match `question.answer` đơn.
- **Scope thực tế nhỏ** (verify DB `prisma/verify_modeb.ts`): chỉ **g02 weak-forms 4/8 câu có acceptedAnswers multi** (contraction "I'm" vs full "I am"). g01/g03/g04 Mode B = `acceptedAnswers: null` (đơn trị, đã đúng qua `scoreVoice` cũ). Vậy Mode B = plumbing + scoring cho multi, **không đụng g01/3/4**.
- **`scoreVoice` logic** (`scoring.ts:107-125`): `calculateWordOverlapAccuracy(question.answer, transcript) ≥ 80` → isCorrect. Score = `round(question.score * accuracy / 100)`.
- **SpeakSentenceQuestion `checkAnswer`** (`:69-76`): local `calculateWordOverlapAccuracy(question.answer, recordedText) ≥ 80` → status correct/incorrect (immediate UI feedback, server re-score authoritative).
- **submit/route.ts** (`:74-84`): `include: { questions: { include: { type, options } } }` — Prisma default include `acceptedAnswers` (no `select` limit), nhưng `scoreQuestion` nhận `ScoringQuestion` không có field → cần thêm type + map.

## 2. Scope

**Trong scope SP4 Mode B:**
- `page.tsx:76-84` — map `acceptedAnswers` vào `exerciseData.questions` (Prisma include default đã có, chỉ cần map).
- `ExerciseEngineClient.tsx` `ExerciseQuestion` type (`:16-36`) — +field `acceptedAnswers?: string[] | null`.
- `scoring.ts` `ScoringQuestion` (`:10-22`) — +field `acceptedAnswers?: string[] | null`.
- `scoring.ts` `scoreVoice` (`:107-125`) — if `acceptedAnswers` non-empty array → **max `calculateWordOverlapAccuracy`** across `[question.answer, ...acceptedAnswers]`; else giữ logic cũ. Score theo accuracy tốt nhất.
- `SpeakSentenceQuestion.tsx` `checkAnswer` (`:69-76`) — if `question.acceptedAnswers` non-empty → max overlap across `[question.answer, ...acceptedAnswers]`; else cũ.
- `submit/route.ts` — **KHÔNG sửa** (verify dòng 121-126: `question` từ `questionById` là raw Prisma object include default `acceptedAnswers` (no `select` limit), truyền thẳng vào `scoreQuestion`. TypeScript structural typing: raw object có field → assign được `ScoringQuestion` +field optional. Chỉ cần `ScoringQuestion` type +field là `scoreVoice` đọc được.).
- Test `scoring.test.ts` — +2 test scoreVoice với/không acceptedAnswers (TDD).

**Defer (ra khỏi Mode B):**
- SpeakWordQuestion (g01 Mode B single, đã đúng — không đụng).
- Scoring multiplier/retake (gamification) → spec riêng.
- Unlock CĐ4 gating → SP6.
- Mode A (xong spec riêng).
- Scale content → sau pilot.

## 3. Scoring — `scoreVoice` max-match

```ts
// scoring.ts scoreVoice — sửa để consult acceptedAnswers
function scoreVoice(question: ScoringQuestion, answer: SubmitAnswerInput): QuestionScoreResult {
  const transcript = answer.transcript ?? "";
  // Mode B multi-answer: max overlap across [answer, ...acceptedAnswers]
  const candidates = question.acceptedAnswers && question.acceptedAnswers.length > 0
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

**Chiến lược max overlap (không exact):** SpeechRecognition có thể nhận "I am" dù user nói "I'm" (hoặc ngược) — exact match fail sai. Max overlap = tính accuracy mỗi dạng accepted, lấy cao nhất, so ≥80. Flexible + đúng pedagogy (cả 2 dạng accept).

## 4. Data plumbing

**`page.tsx:76-84`** — thêm `acceptedAnswers` vào map:
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

**`ExerciseEngineClient.tsx` `ExerciseQuestion` type** — +field:
```ts
export type ExerciseQuestion = {
  // ...existing...
  acceptedAnswers?: string[] | null;  // MỚI: Mode B multi-answer
};
```

**`scoring.ts` `ScoringQuestion`** — +field:
```ts
export type ScoringQuestion = {
  // ...existing...
  acceptedAnswers?: string[] | null;  // MỚI: Mode B multi-answer
};
```

**`submit/route.ts`** — map `acceptedAnswers` vào `ScoringQuestion` build (dòng ~120 area, build question object cho `scoreQuestion`). Verify code hiện + thêm field.

**`SpeakSentenceQuestion.tsx` `checkAnswer`** — local multi-match:
```ts
const checkAnswer = (recordedText: string) => {
  setStatus("processing");
  recorder.stop();
  window.setTimeout(() => {
    const candidates = question.acceptedAnswers && question.acceptedAnswers.length > 0
      ? [question.answer, ...question.acceptedAnswers]
      : [question.answer];
    const acc = Math.max(...candidates.map((c) => calculateWordOverlapAccuracy(c, recordedText)));
    setStatus(acc >= 80 ? "correct" : "incorrect");
  }, 400);
};
```

## 5. Test design (TDD, mở rộng scoring.test.ts)

```ts
test("scoreVoice với acceptedAnswers: match dạng 2 (I am) → isCorrect", () => {
  const q = makeQuestion({
    answer: "I'm going to the shop", score: 25,
    type: { id: "qtype-2-voice", name: "Voice" }, options: [],
    acceptedAnswers: ["I'm going to the shop", "I am going to the shop"],
  });
  // user nói "I am going to the shop" (dạng 2) → accuracy cao vs dạng 2 → isCorrect
  const r = scoreQuestion(q, { questionId: "question-1", transcript: "I am going to the shop" });
  assert.equal(r.isCorrect, true);
});

test("scoreVoice không acceptedAnswers: giữ logic cũ (single answer)", () => {
  const q = makeQuestion({
    answer: "Turn off the light", score: 25,
    type: { id: "qtype-2-voice", name: "Voice" }, options: [],
  });
  assert.equal(scoreQuestion(q, { questionId: "question-1", transcript: "Turn off the light" }).isCorrect, true);
  assert.equal(scoreQuestion(q, { questionId: "question-1", transcript: "completely different" }).isCorrect, false);
});
```

Test cũ (qtype-1-mc, scoreVoice single, qtype-4..7 Mode A) vẫn pass — `acceptedAnswers` undefined → candidates = `[question.answer]` → logic cũ.

## 6. File sẽ tạo/sửa

| Hành động | File | Chi tiết |
|---|---|---|
| sửa | `src/app/exercises/[id]/page.tsx` (`:76-84`) | map `acceptedAnswers` vào exerciseData.questions |
| sửa | `src/app/exercises/[id]/ExerciseEngineClient.tsx` (`:16-36`) | `ExerciseQuestion` +field `acceptedAnswers?: string[] \| null` |
| sửa | `src/app/exercises/[id]/SpeakSentenceQuestion.tsx` (`:69-76`) | `checkAnswer` multi-match (max overlap) |
| sửa | `src/lib/scoring.ts` (`:10-22`, `:107-125`) | `ScoringQuestion` +field + `scoreVoice` max-match |
| sửa | `src/lib/__tests__/scoring.test.ts` | +2 test scoreVoice acceptedAnswers (TDD) |

**KHÔNG sửa submit/route.ts** (verify dòng 121-126: raw Prisma `question` object include default `acceptedAnswers`, truyền thẳng `scoreQuestion(question, answer)` — TypeScript structural typing chấp nhận `ScoringQuestion` +field optional).

**KHÔNG sửa:** SpeakWordQuestion (g01 single), Mode A component (xong), seed/content (SP3d), schema (`acceptedAnswers` đã có cột), engine dispatch (Mode B route qtype-2-voice đã có), `parseWordPrompt` (SpeakSentence dùng `question.answer` không parse content cho match).

## 7. Thay đổi behavior?

- g02 weak-forms Mode B (4 câu): user đọc "I'm..." hoặc "I am..." → cả 2 accept (multi-answer). Trước đây chỉ accept `question.answer` ("I'm..." dạng trong answer).
- g01/g03/g04 Mode B: KHÔNG đổi (acceptedAnswers null → candidates = [answer] → logic cũ).
- Score Mode B: max accuracy across accepted forms → score cao nhất dạng match.
- UI SpeakSentenceQuestion: local feedback (correct/incorrect) cũng multi-match — immediate UX đúng.
- XP/streak/badge/leaderboard: KHÔNG đụng (scoring cùng flow submit).
- Mode A: KHÔNG đụng (xong).

## 8. Rủi ro & giải pháp

| Rủi ro | Giải pháp |
|---|---|
| **`acceptedAnswers` Prisma Json type** (string[] \| null trong DB) | `page.tsx` cast `question.acceptedAnswers as string[] \| null`. Scoring check `Array.isArray` + length > 0 trước spread. Test bắt. |
| **`Math.max(...[])` = -Infinity** nếu candidates rỗng | Guard: candidates luôn ≥1 (`[question.answer]` minimum). Test empty acceptedAnswers → candidates = [answer]. |
| **submit/route.ts** — verify KHÔNG cần sửa | Đọc dòng 121-126: `question` raw Prisma (include default `acceptedAnswers`) truyền thẳng `scoreQuestion`. TypeScript structural typing → `ScoringQuestion` +field optional accept raw object. Spec mục 2/6 đã update: không sửa submit route. |
| **SpeakWordQuestion không đụng** (g01 single) | g01 acceptedAnswers null → nếu vô tình có multi, SpeakWord dùng exact match `normalizeAnswer` đơn — KHÔNG sửa. Test verify g01 path không break. |
| **SpeechRecognition mơ hồ** (nhận "I am" khi nói "I'm") | Max overlap strategy handle — cả 2 dạng accept. Spec ghi rõ. |
| **1 commit nhỏ** (6 file sửa, không tạo file mới) | 1 commit gộp. TDD scoring trước. |
