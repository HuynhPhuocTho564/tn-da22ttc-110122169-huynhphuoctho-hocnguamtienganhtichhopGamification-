# SP4 Mode A — UI 4 dạng CĐ4 (listen-style) Design

Ngày: 2026-06-19
Trạng thái: design đã được user duyệt qua 4 section (scope / data flow / UI layout / scoring+risk), text-only brainstorm (visual companion fail trên Windows, dùng ASCII mockup).
Scope: master **SP4** (Exercise Engine v2) — **Mode A** (1/2 nửa CĐ4). Mode B (`acceptedAnswers` multi-answer speech) → spec riêng (SP4 Mode B) sau. SP3d đã seed content CĐ4 + sửa seed (commit `5f8affd` plan, code chưa commit gộp SP3d+(b)).

Lưu ý tên: "SP4 Mode A" = 4 UI dạng listen cho CĐ4. KHÁC SP4a (voice waveform + speak feedback bottom-sheet — đã xong, subset master SP4).

## Mục tiêu

Xây 4 component UI mới cho Mode A CĐ4 (listen-style, không speech): Word Stress (tap-stress) / Weak Forms (choose-weak) / Linking (choose-linking) / Assimilation (choose-assimilation). Thêm 4 branch render trong engine + 4 branch scoring. Mode A bài CĐ4 từ "render blank" (explore: `qtype-4..7` không có branch → màn trống) → render đúng + scoring đúng. User playtest được 4 dạng nghe/chọn ngay (không phụ thuộc speech — Mode B defer).

## 1. Hiện trạng (verify explore 19/06, read-only)

- **Engine dispatch theo `currentQuestion.type` (QuestionType id), KHÔNG theo `content.qtype`/`content.mode`** (`ExerciseEngineClient.tsx:561-574`). CĐ4 Mode A typeId `qtype-4..7` → **không branch render → blank**.
- **`parseWordPrompt`/`WordPrompt` (`:38-122`) drop field CĐ4** (syllables/stressIndex/weakWords/linkingPairs/assimilationType/original/result) — chỉ đọc word/ipa/audioUrl/hint/options. Component mới phải tự `JSON.parse(content)` (precedent `SpeakMinimalPairsQuestion.parsePairPrompt` `:16-40`).
- **`isVoiceTask` (`:505`)** = `type === "qtype-2-voice" || type === "qtype-3-minimal-pairs"` → Mode A (qtype-4..7) KHÔNG voice task → dùng `ListenFeedbackSheet` (pattern listen_choose). **Không cần sửa flag**.
- **Answer flow listen** (`handleAnswerListen` `:405`): set `isAnswered`, record `{selectedOptionId, selectedText}`, add score on correct, show `ListenFeedbackSheet`, không auto-advance → `handleNextListen` (`:453`).
- **AnswerOption flow** (`page.tsx:getQuestionOptions` `:17-45`): nếu `question.options.length > 0` (DB AnswerOption rows) → dùng rows; else parse `content.options`. CĐ4 Mode A seed đã tạo AnswerOption rows → `question.options` tự populated.
- **Scoring** (`scoring.ts:127` `scoreQuestion`): chỉ branch `qtype-1-mc` → `scoreMultipleChoice`; **mọi type khác → `scoreVoice`** (transcript word-overlap). CĐ4 `qtype-4..7` → `scoreVoice` → transcript null → accuracy 0 → **luôn false, score 0** (bug). `ScoringQuestion` (`:10-22`): `{ id, answer, score, type:{id,name}, options[] }` — không có `acceptedAnswers` (Mode B mới cần).
- **`SubmitAnswer` shape** (`:57-64`): `{ questionId, selectedOptionId?, selectedText?, transcript?, audioUrl?, timeSpent? }` — có `selectedText` sẵn cho multi-select encoding (không sửa schema).
- **scoring.test.ts đã có** (`src/lib/__tests__/scoring.test.ts`) — pattern `makeQuestion(overrides)` helper + `scoreQuestion(q, {questionId, selectedOptionId, timeSpent})`. Mở rộng thêm test qtype-4..7.
- **Audio Mode A**: tap-stress (g01) = word mp3 local (`audioUrl` từ contentJson); 3 dạng câu (g02/3/4) = `audioUrl: null` → dùng **speechSynthesis** runtime (precedent `SpeakSentenceQuestion.tsx:29 playSentence`).
- **Content CĐ4 đã seed** (verify SP3d Task 10): 4 nhóm ACTIVE, g01 mode_a=7 câu (tap-stress), g02/3/4 mode_a=8 câu mỗi nhóm. Question.content JSON có field CĐ4 đúng shape.

## 2. Scope

**Trong scope SP4 Mode A:**
- 4 component UI mới: `TapStressQuestion.tsx`, `ChooseWeakQuestion.tsx`, `ChooseLinkingQuestion.tsx`, `ChooseAssimilationQuestion.tsx` (src/app/exercises/[id]/).
- Engine `ExerciseEngineClient.tsx:572-575`: thêm 4 branch render `currentQuestion.type === "qtype-4..7"`.
- Scoring `scoring.ts:127`: thêm 4 branch `scoreQuestion` + 3 helper (`scoreTapStress`, `scoreMultiSelect`, `scoreSingleSelect`).
- Test `scoring.test.ts`: mở rộng thêm test qtype-4..7 (TDD).
- (Optional) Helper `useSynthesisAudio` nếu 3 dạng câu share logic speechSynthesis — judge ở plan phase.

**Defer (ra khỏi Mode A):**
- **Mode B** (`acceptedAnswers` multi-answer speech) → spec riêng SP4 Mode B. Cần: `page.tsx` select `acceptedAnswers` + `submit/route.ts` select + `ScoringQuestion` +field + `scoreVoice` max-match + speak component local multi-match.
- Scoring multiplier/retake (gamification) → spec riêng.
- Unlock CĐ4 runtime gating (80% CĐ3) → SP6.
- Scale content (8→full) → sau pilot.

## 3. Data flow + contentJson parse

**ContentJson shape (seed SP3d, đã verify):**

```ts
// qtype-4-tap-stress (g01)
{ mode:"mode_a_listen_choose", qtype:"tap-stress", word, ipa, syllables:string[], stressIndex:number, audioUrl:string }

// qtype-5-choose-weak (g02)
{ mode:"mode_a_listen_choose", qtype:"choose-weak", sentence, ipa, weakWords:string[], audioUrl:null }

// qtype-6-choose-linking (g03)
{ mode:"mode_a_listen_choose", qtype:"choose-linking", sentence, ipa, linkingPairs:string[][], audioUrl:null }

// qtype-7-choose-assimilation (g04)
{ mode:"mode_a_listen_choose", qtype:"choose-assimilation", sentence, ipa, assimilationType, original, result, audioUrl:null }
```

**AnswerOption rows (seed) + `question.answer`:**

| Dạng | AnswerOption rows (→ `question.options`) | `question.answer` | Select | Correctness |
|---|---|---|---|---|
| tap-stress | syllables `["pho","to","graph"]` | `String(stressIndex)` vd `"0"` | single | option index === Number(answer) |
| choose-weak | sentence words `["I'm","going","to","the","shop"]` | `weakWords.join(",")` vd `"to,the"` | multi | selectedSet === answerSet |
| choose-linking | adjacent pairs `["Turn→off","off→the",...]` | `linkingPairs.map(p=>p.join("→")).join(",")` vd `"Turn→off"` | multi | selectedSet === answerSet |
| choose-assimilation | `[result, original]` | `assimResult` vd `"didʒu"` | single | selectedText === answer (exact) |

**Parse pattern (mỗi component tự parse):**
```ts
// TapStressQuestion.tsx
type TapStressContent = { word:string; ipa:string; syllables:string[]; stressIndex:number; audioUrl:string };
function parseTapStress(content:string):TapStressContent { return JSON.parse(content) as TapStressContent; }
```
(tương tự 3 component — parse field riêng, KHÔNG dùng `parseWordPrompt` chung.)

**Data flow:**
1. `page.tsx` load question + options (đã có, không sửa — AnswerOption rows tự vào `question.options`).
2. Engine dispatch `type === "qtype-4..7"` → render component tương ứng.
3. Component: parse content → render audio (mp3 tap-stress / speechSynthesis 3 dạng câu) + options UI → user select → `onAnswer(isCorrect, selectedOpt, selectedOptionId?, selectedText?)`.
4. Engine `handleAnswerListen` (đã có `:405`) — record `selectedOptionId`/`selectedText`, show `ListenFeedbackSheet`, không auto-advance.
5. Submit → `scoreQuestion` branch `qtype-4..7` → score (re-compute từ `question.answer` + payload).

## 4. UI layout (ASCII mockup, text-only brainstorm)

Pattern chung: header (ipa/sentence — giữ nguyên khi feedback) + audio button + vùng chọn + `ListenFeedbackSheet` (trồi đáy, overlay, không đẩy content — pattern SP4a `ListenFeedbackSheet`).

### 4.1 tap-stress (g01) — single-select syllable blocks

```
┌─────────────────────────────────────┐
│  🔊 photograph   /ˈfoʊtəɡræf/        │  ← audio mp3 + ipa
│  Bấm âm tiết được nhấn               │
│  ┌──────┐ ┌──────┐ ┌──────┐         │  ← syllable blocks (question.options)
│  │ pho  │ │ to   │ │ graph│         │
│  └──────┘ └──────┘ └──────┘         │
└─────────────────────────────────────┘
Feedback: ✓/✗ + "Đáp án: pho (âm tiết 1)"
```
Bấm 1 block → `onAnswer(index === Number(answer))`. Block đúng xanh, sai đỏ + đúng xanh.

### 4.2 choose-weak (g02) — multi-select word chips

```
┌─────────────────────────────────────┐
│  🎧 "I'm going to the shop."         │  ← speechSynthesis (audioUrl null)
│  /aɪm ˈɡoʊɪŋ tə ðə ˈʃɑp/            │
│  Chọn từ đọc lướt (weak /ə/)         │
│  [I'm] [going] [to✓] [the✓]         │  ← word chips (question.options), toggle
│  [shop]                              │
│              [ Xong (2) ]            │  ← submit button (count)
└─────────────────────────────────────┘
Feedback: "Bạn chọn: to, the. Đáp án: to, the"
```
Toggle chip → state `Set<optionId>`. Nút "Xong" → `onAnswer(selectedSet === answerSet, ..., selectedText=join(",") )`. Chip đúng xanh/sai đỏ.

### 4.3 choose-linking (g03) — multi-select pair chips

```
┌─────────────────────────────────────┐
│  🎧 "Turn off the light."            │
│  /ˈtɜrn ˈɔf ðə ˈlaɪt/               │
│  Chọn cặp từ nối âm (linking)        │
│  [Turn→off] [off→the] [the→light]   │  ← pair chips (question.options), toggle
│              [ Xong (1) ]            │
└─────────────────────────────────────┘
```
Cùng pattern choose-weak, chip = cặp `wordA→wordB`. Multi-select + "Xong".

### 4.4 choose-assimilation (g04) — single-select variant buttons

```
┌─────────────────────────────────────┐
│  🎧 "Did you see it?"               │
│  Loại biến âm: dj→dʒ                 │
│  Chọn phát âm đúng (nghe câu tự nhiên)│
│  ┌─────────────┐  ┌─────────────┐   │  ← 2 variant buttons (question.options)
│  │ didʒu       │  │ did you     │   │  ← result (đúng) | original (sai)
│  └─────────────┘  └─────────────┘   │
└─────────────────────────────────────┘
```
Single-select như tap-stress. `question.options` = `[result, original]`, `answer = assimResult`. Bấm 1 → `onAnswer(selectedText === answer)`.

**Component tách 4 file riêng** (không gộp — tránh prop-branching), mỗi cái ~80-120 dòng. Helper chung `useSynthesisAudio` nếu 3 dạng câu share logic (judge plan phase).

## 5. Scoring (scoring.ts — thêm 4 branch + 3 helper)

```ts
// scoring.ts scoreQuestion — thêm sau nhánh qtype-1-mc
if (question.type.id === "qtype-4-tap-stress") return scoreTapStress(question, answer);
if (question.type.id === "qtype-5-choose-weak") return scoreMultiSelect(question, answer);
if (question.type.id === "qtype-6-choose-linking") return scoreMultiSelect(question, answer);
if (question.type.id === "qtype-7-choose-assimilation") return scoreSingleSelect(question, answer);
```

**`QuestionScoreResult` shape (verify `scoring.ts:24-35` — 7 field bắt buộc):** `{ questionId, isCorrect, score, maxScore, accuracyScore, feedback, selectedOptionId, transcript, audioUrl, timeSpent }`. Helper phải return đủ — **KHÔNG phải 3 field** (sửa so với brainstorm Section 5).

```ts
// Helper dùng chung build result (DRY — tránh repeat 7 field mỗi helper)
function buildResult(
  q: ScoringQuestion, a: SubmitAnswerInput, isCorrect: boolean, feedback: string
): QuestionScoreResult {
  return {
    questionId: q.id,
    isCorrect,
    score: isCorrect ? q.score : 0,
    maxScore: q.score,
    accuracyScore: isCorrect ? 100 : 0,
    feedback,
    selectedOptionId: a.selectedOptionId ?? null,
    transcript: a.transcript ?? null,
    audioUrl: a.audioUrl ?? null,
    timeSpent: a.timeSpent ?? null,
  };
}

function scoreTapStress(q: ScoringQuestion, a: SubmitAnswerInput): QuestionScoreResult {
  // answer = String(stressIndex); chọn option theo index
  const idx = q.options.findIndex((o) => o.id === a.selectedOptionId);
  const isCorrect = idx >= 0 && idx === Number(q.answer);
  const correctSyllable = q.options[Number(q.answer)]?.content ?? "?";
  return buildResult(q, a, isCorrect, isCorrect ? "Chọn đúng âm tiết nhấn" : `Đáp án: ${correctSyllable} (âm tiết ${Number(q.answer) + 1})`);
}

function scoreMultiSelect(q: ScoringQuestion, a: SubmitAnswerInput): QuestionScoreResult {
  // answer = "to,the" (comma-join); selectedText = "to,the" (component join)
  const expected = new Set(q.answer.split(",").map(normalizeAnswerText).filter(Boolean));
  const selected = new Set((a.selectedText ?? "").split(",").map(normalizeAnswerText).filter(Boolean));
  const isCorrect = expected.size === selected.size && [...expected].every((x) => selected.has(x));
  return buildResult(q, a, isCorrect, isCorrect ? "Chọn đúng" : `Đáp án: ${q.answer}`);
}

function scoreSingleSelect(q: ScoringQuestion, a: SubmitAnswerInput): QuestionScoreResult {
  // assimilation: answer = "didʒu"; chọn 1 option — exact match (IPA chars, không normalize)
  const selectedText = q.options.find((o) => o.id === a.selectedOptionId)?.content ?? a.selectedText ?? "";
  const isCorrect = selectedText === q.answer;
  return buildResult(q, a, isCorrect, isCorrect ? "Chọn đúng phát âm biến âm" : `Đáp án: ${q.answer}`);
}
```

**Multi-select encoding:** component truyền `selectedText = selectedContents.join(",")` (vd `"to,the"`). `selectedOptionId` undefined cho multi (scoring dùng `selectedText`). `SubmitAnswer` có `selectedText` sẵn — **không sửa schema**.

**Lưu ý IPA chars** (assimilation `didʒu` — ʒ không phải `\w`): `scoreSingleSelect` **exact match** (không `normalizeAnswerText` — normalize sẽ trôi ʒ). Test bắt.

## 6. Test design (TDD, mở rộng scoring.test.ts)

Pattern `makeQuestion(overrides)` + `scoreQuestion(q, {questionId, ...})` (file đã có). Thêm test:

```ts
test("scoreTapStress: chọn đúng âm tiết nhấn → isCorrect", () => {
  const q = makeQuestion({ answer: "0", score: 10, type: { id: "qtype-4-tap-stress", name: "" },
    options: [{ id: "o0", content: "pho" }, { id: "o1", content: "to" }, { id: "o2", content: "graph" }] });
  assert.equal(scoreQuestion(q, { questionId: "question-1", selectedOptionId: "o0" }).isCorrect, true);
  assert.equal(scoreQuestion(q, { questionId: "question-1", selectedOptionId: "o1" }).isCorrect, false);
});

test("scoreMultiSelect (choose-weak): đúng set → isCorrect, thiếu/thừa → false", () => {
  const q = makeQuestion({ answer: "to,the", score: 10, type: { id: "qtype-5-choose-weak", name: "" }, options: [] });
  assert.equal(scoreQuestion(q, { questionId: "question-1", selectedText: "to,the" }).isCorrect, true);
  assert.equal(scoreQuestion(q, { questionId: "question-1", selectedText: "to" }).isCorrect, false);
  assert.equal(scoreQuestion(q, { questionId: "question-1", selectedText: "to,the,a" }).isCorrect, false);
});

test("scoreMultiSelect (choose-linking): đúng set pair → isCorrect", () => {
  const q = makeQuestion({ answer: "Turn→off", score: 10, type: { id: "qtype-6-choose-linking", name: "" }, options: [] });
  assert.equal(scoreQuestion(q, { questionId: "question-1", selectedText: "Turn→off" }).isCorrect, true);
  assert.equal(scoreQuestion(q, { questionId: "question-1", selectedText: "Turn→off,off→the" }).isCorrect, false);
});

test("scoreSingleSelect (assimilation): chọn đúng result (IPA exact) → isCorrect", () => {
  const q = makeQuestion({ answer: "didʒu", score: 10, type: { id: "qtype-7-choose-assimilation", name: "" },
    options: [{ id: "o0", content: "didʒu" }, { id: "o1", content: "did you" }] });
  assert.equal(scoreQuestion(q, { questionId: "question-1", selectedOptionId: "o0" }).isCorrect, true);
  assert.equal(scoreQuestion(q, { questionId: "question-1", selectedOptionId: "o1" }).isCorrect, false);
});
```

Test cũ (qtype-1-mc, scoreVoice, rating) vẫn pass — không regression.

## 7. File sẽ tạo/sửa

| Hành động | File | Chi tiết |
|---|---|---|
| tạo | `src/app/exercises/[id]/TapStressQuestion.tsx` | component tap-stress (single-select syllable blocks + mp3 audio) |
| tạo | `src/app/exercises/[id]/ChooseWeakQuestion.tsx` | component choose-weak (multi-select word chips + speechSynthesis) |
| tạo | `src/app/exercises/[id]/ChooseLinkingQuestion.tsx` | component choose-linking (multi-select pair chips + speechSynthesis) |
| tạo | `src/app/exercises/[id]/ChooseAssimilationQuestion.tsx` | component choose-assimilation (single-select variant buttons + speechSynthesis) |
| tạo (optional) | `src/app/exercises/[id]/useSynthesisAudio.ts` | helper speechSynthesis nếu 3 dạng câu share (judge plan) |
| sửa | `src/app/exercises/[id]/ExerciseEngineClient.tsx` (`:572-575`) | thêm 4 branch render `qtype-4..7` |
| sửa | `src/lib/scoring.ts` (`:127`) | thêm 4 branch `scoreQuestion` + 3 helper `scoreTapStress`/`scoreMultiSelect`/`scoreSingleSelect` |
| sửa | `src/lib/__tests__/scoring.test.ts` | mở rộng thêm 4 test qtype-4..7 (TDD) |

**KHÔNG sửa:** `page.tsx` (AnswerOption flow đã có), `submit/route.ts` (scoring qua `scoreQuestion` đã có), schema (`SubmitAnswer` có `selectedText` sẵn), seed/content (SP3d đã xong), `parseWordPrompt` (component tự parse), `ListenFeedbackSheet` (dùng lại), Mode B (spec riêng).

## 8. Thay đổi behavior?

- 4 dạng Mode A CĐ4: blank → render đúng UI + scoring đúng. User playtest được 4 dạng nghe/chọn (không cần speech).
- 4 exercise mode_a (g01 tap-stress 7 câu, g02/3/4 mode_a 8 câu mỗi nhóm) playable.
- Scoring: `qtype-4..7` từ luôn-false-0 → đúng theo select.
- `ListenFeedbackSheet` dùng cho 4 dạng (pattern listen) — feedback đáy, không đẩy content.
- XP/streak/badge/leaderboard: KHÔNG đụng (scoring branch mới, cùng flow submit).
- Engine: thêm 4 branch, không refactor branch cũ (qtype-1/2/3).
- Mode B (g01/2/3/4 mode_b): **KHÔNG đụng** (vẫn render SpeakWord/SpeakSentence, scoring `scoreVoice` — acceptedAnswers chưa consume). Mode B playable ở mức cũ (single `answer`), multi-answer = spec riêng.

## 9. Rủi ro & giải pháp

| Rủi ro | Giải pháp |
|---|---|
| **Multi-select là pattern mới** (listen_choose hiện chỉ single) | Component `Set<string>` state + nút "Xong"; TDD scoring test bắt set-comparison; UI tham chiếu Duolingo multi-select. |
| **speechSynthesis 3 dạng câu** (audioUrl null) | Tái sử dụng pattern `SpeakSentenceQuestion.tsx:29 playSentence`. Helper `useSynthesisAudio` nếu DRY (judge plan). |
| **IPA chars assimilation** (`didʒu` — ʒ) | `scoreSingleSelect` exact match, KHÔNG `normalizeAnswerText`. Test bắt. |
| **parseWordPrompt drop field CĐ4** | Mỗi component tự `JSON.parse(content)` (precedent `SpeakMinimalPairsQuestion.parsePairPrompt`). Không sửa parser chung. |
| **4 component + scoring + engine dispatch** = chạm nhiều file | Tách task: scoring (TDD trước) → 4 component (mỗi cái 1 task) → engine dispatch (cuối). Pattern plan SP3d. |
| **answer comma-join** trùng delimiter nếu word chứa "," | Word/pair tiếng Anh bình thường không chứa "," — an toàn. Test edge nếu lo. |
| **`question.options` rỗng** (ChooseWeak/Linking/Assimilation nếu seed chưa tạo AnswerOption) | SP3d Task 10 verify: AnswerOption rows đã tạo (g01 syllables, g02 words, g03 pairs, g04 variants). Component fallback: nếu `options.length === 0` → parse từ content (weakWords/linkingPairs/result+original). Judge plan. |
| **`QuestionScoreResult` shape** (7 field bắt buộc) | Verify `scoring.ts:24-35`: `{ questionId, isCorrect, score, maxScore, accuracyScore, feedback, selectedOptionId, transcript, audioUrl, timeSpent }`. Helper `buildResult(q, a, isCorrect, feedback)` DRY — fill đủ field. Spec Section 5 đã update. |
| **chưa playtest speech** (Mode B defer) | Mode A KHÔNG speech → playtest được ngay. Mode B = spec riêng. |
| **1 commit lớn** (4 component + scoring + engine) | Plan chia task: scoring (1 task) → component (4 task) → engine (1 task) → playtest + quality gate (1 task). Review giữa task. |
