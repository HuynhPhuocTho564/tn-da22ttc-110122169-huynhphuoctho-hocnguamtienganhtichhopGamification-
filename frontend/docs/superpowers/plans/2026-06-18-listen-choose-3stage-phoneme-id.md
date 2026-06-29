# listen_choose 3-stage (phoneme identification) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesin mode `listen_choose` ("Luyện tai") thành 3 stage tăng dần độ khó — nhận diện âm mục tiêu (phoneme) thay vì đoán từ. Stage 1 (q1-4) hiện word+audio+N nút IPA; Stage 2 (q5-8) ẩn word, IPA skeleton khuyết target; Stage 3 (q9-10) chỉ audio+N nút. Fix scoring exact-match cho IPA.

**Architecture:** Hướng A (seed-staged): helper `buildListenChooseQuestions` (tách ra `prisma/listen-choose-builder.ts`, testable) sinh 10 câu/exercise với content JSON `{stage, answerType:"phoneme", word, ipa, audioUrl, targetPhoneme, contrastPhonemes[], skeleton}`. Seed canonical + script re-generate `seed_listen_choose.ts` (copy audioUrl từ WordItem DB, không re-fetch). Engine `ListenChooseQuestion` đọc `stage` → render 3 kiểu. Scoring: exact-match branch cho `answerType:"phoneme"` (engine + server).

**Tech Stack:** Next.js 16, Prisma 6 (PostgreSQL), TypeScript 6, Tailwind 4, node:test qua `tsx`. Runner: `tsx`. Test: `npm test` = `tsx --test "src/**/*.test.ts"`.

**Working directory:** Mọi lệnh từ `english_pronunciation_app/frontend/` (repo root `D:\01_Company_Work\Projects\Web_HoTroPhatAmEN`).

**Spec:** `docs/superpowers/specs/2026-06-18-listen-choose-3stage-phoneme-id-design.md`

**Git:** User handles all commits. DO NOT commit/push/branch.

---

## File Structure

| Hành động | File | Trách nhiệm |
|---|---|---|
| Create | `prisma/listen-choose-builder.ts` | Helper testable: `buildListenChooseQuestions` — pool lọc 1-âm, contrast N-âm, mồi 1-âm, skeleton calc, split 4/4/2, pool<10 lặp |
| Modify | `prisma/seed_lessons.ts` (`generateQuestions` nhánh listen_choose, line 798-860) | Gọi helper + ghi content JSON 3-stage + AnswerOption = contrastPhonemes |
| Create | `prisma/seed_listen_choose.ts` | Script re-generate chỉ listen_choose questions (copy audioUrl từ WordItem DB, không re-fetch) |
| Modify | `src/app/exercises/[id]/ExerciseEngineClient.tsx` (`ListenChooseQuestion` line 262-341, `WordPrompt` type, `normalizeAnswer` usage line 309/324) | Render 3 stage + exact-match branch |
| Modify | `src/lib/scoring.ts` (`scoreMultipleChoice` line 73-92) | Exact-match branch cho phoneme |
| Create | `src/lib/__tests__/listen-choose-builder.test.ts` | Unit test helper (skeleton, lọc 1-âm, mồi, split, lặp) |
| Modify | `src/lib/__tests__/scoring.test.ts` | Exact-match IPA test |

---

## Task 1: Helper `buildListenChooseQuestions` (TDD)

**Files:**
- Create: `prisma/listen-choose-builder.ts`
- Test: `src/lib/__tests__/listen-choose-builder.test.ts`

- [ ] **Step 1: Viết test thất bại**

Tạo `src/lib/__tests__/listen-choose-builder.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSkeleton,
  filterSinglePhonemeWords,
  buildContrastPhonemes,
  splitStages,
  cycleToTen,
} from "../../../prisma/listen-choose-builder";

test("buildSkeleton: thay targetPhoneme trong ipa bằng _", () => {
  assert.equal(buildSkeleton("/ʃiːp/", "/iː/"), "/ʃ_p/");
  assert.equal(buildSkeleton("/fɪl/", "/ɪ/"), "/f_l/");
  assert.equal(buildSkeleton("/siːt/", "/iː/"), "/s_t/");
});

test("buildSkeleton: target không có trong ipa → null (fallback)", () => {
  assert.equal(buildSkeleton("/kæt/", "/iː/"), null);
});

test("filterSinglePhonemeWords: chỉ giữ từ chứa đúng 1 âm trong contrastPhonemes", () => {
  const words = [
    { word: "sheep", ipa: "/ʃiːp/", targetPhoneme: "/iː/", audioUrl: "u1" },
    { word: "father", ipa: "/ˈfɑːðə/", targetPhoneme: "/ɑː/", audioUrl: "u2" }, // chứa cả /ə/
    { word: "ship", ipa: "/ʃɪp/", targetPhoneme: "/ɪ/", audioUrl: "u3" },
  ];
  const contrastPhonemes = ["/ɑː/", "/ʌ/", "/ə/"];
  // father chứa /ɑː/ và /ə/ (cả 2 trong contrast) → loại
  const filtered = filterSinglePhonemeWords(words, contrastPhonemes);
  // sheep/ship không chứa âm nào trong contrast g03 → cũng loại (targetPhoneme phải nằm trong contrast)
  assert.equal(filtered.length, 0);
});

test("filterSinglePhonemeWords: giữ từ có đúng 1 âm contrast (g01 i-ih)", () => {
  const words = [
    { word: "sheep", ipa: "/ʃiːp/", targetPhoneme: "/iː/", audioUrl: "u1" },
    { word: "ship", ipa: "/ʃɪp/", targetPhoneme: "/ɪ/", audioUrl: "u3" },
  ];
  const contrastPhonemes = ["/iː/", "/ɪ/"];
  const filtered = filterSinglePhonemeWords(words, contrastPhonemes);
  assert.equal(filtered.length, 2);
});

test("buildContrastPhonemes: nhóm 2-âm → 2 contrast", () => {
  assert.deepEqual(buildContrastPhonemes(["/iː/", "/ɪ/"], null), ["/iː/", "/ɪ/"]);
});

test("buildContrastPhonemes: nhóm 1-âm → mồi 1 từ neighbor", () => {
  assert.deepEqual(buildContrastPhonemes(["/ɜː/"], "/ʌ/"), ["/ɜː/", "/ʌ/"]);
});

test("splitStages: 10 index → 4 S1 + 4 S2 + 2 S3", () => {
  const stages = splitStages(10);
  assert.equal(stages[0], 1); // index 0 (câu 1)
  assert.equal(stages[3], 1); // câu 4
  assert.equal(stages[4], 2); // câu 5
  assert.equal(stages[7], 2); // câu 8
  assert.equal(stages[8], 3); // câu 9
  assert.equal(stages[9], 3); // câu 10
  assert.equal(stages.length, 10);
});

test("cycleToTen: pool 6 → lặp đến 10", () => {
  const pool = ["a", "b", "c", "d", "e", "f"];
  const result = cycleToTen(pool);
  assert.equal(result.length, 10);
  assert.equal(result[0], "a");
  assert.equal(result[6], "a"); // lặp
  assert.equal(result[9], "d");
});

test("cycleToTen: pool ≥10 → slice 10", () => {
  const pool = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"];
  const result = cycleToTen(pool);
  assert.equal(result.length, 10);
  assert.equal(result[0], "a");
  assert.equal(result[9], "j");
});
```

- [ ] **Step 2: Chạy test → xác nhận fail**

Run: `npm test`
Expected: FAIL — module `listen-choose-builder` không tồn tại, import error.

- [ ] **Step 3: Tạo helper `listen-choose-builder.ts`**

Tạo `prisma/listen-choose-builder.ts`:

```ts
/**
 * LISTEN-CHOOSE 3-STAGE BUILDER (SP-fix) - Helper sinh 10 câu phoneme-ID cho mode listen_choose.
 *
 * 3 stage: S1 (q1-4) hiện word+audio+N nút IPA; S2 (q5-8) ẩn word + IPA skeleton;
 * S3 (q9-10) chỉ audio+N nút. N = số contrastPhonemes (2 hoặc 3, nhóm 1-âm mồi → 2).
 *
 * Tách ra file riêng để testable (không phụ thuộc Prisma).
 */

export type ListenChooseWord = {
  word: string;
  ipa: string;
  targetPhoneme: string;
  audioUrl: string;
};

export type ListenChooseQuestion = {
  stage: 1 | 2 | 3;
  answerType: "phoneme";
  word: string;
  ipa: string;
  audioUrl: string;
  targetPhoneme: string;
  contrastPhonemes: string[];
  skeleton: string | null;
  answer: string; // = targetPhoneme
};

/**
 * Thay targetPhoneme substring trong ipa bằng "_".
 * Trả về null nếu target không nằm trong ipa (fallback: stage 2 render stage 1).
 */
export function buildSkeleton(ipa: string, targetPhoneme: string): string | null {
  if (!ipa.includes(targetPhoneme)) return null;
  return ipa.replace(targetPhoneme, "_");
}

/**
 * Lọc chỉ từ chứa ĐÚNG 1 âm trong contrastPhonemes (xử lý nhóm 3-âm nhiễu).
 * Từ phải chứa targetPhoneme (âm mục tiêu nằm trong contrast) và KHÔNG chứa âm contrast khác.
 */
export function filterSinglePhonemeWords(
  words: ListenChooseWord[],
  contrastPhonemes: string[],
): ListenChooseWord[] {
  return words.filter((w) => {
    // targetPhoneme phải nằm trong contrast
    if (!contrastPhonemes.includes(w.targetPhoneme)) return false;
    // đếm số âm contrast xuất hiện trong ipa
    let count = 0;
    for (const ph of contrastPhonemes) {
      if (w.ipa.includes(ph)) count++;
    }
    return count === 1; // chỉ đúng 1 (chính là target)
  });
}

/**
 * Xây contrastPhonemes. Nhóm N-âm (N≥2) → giữ nguyên. Nhóm 1-âm → mồi 1 từ neighbor.
 * neighborPhoneme = null khi nhóm có ≥2 âm.
 */
export function buildContrastPhonemes(
  targetPhonemes: string[],
  neighborPhoneme: string | null,
): string[] {
  if (targetPhonemes.length >= 2) return targetPhonemes;
  // nhóm 1-âm: mồi
  if (neighborPhoneme) return [targetPhonemes[0], neighborPhoneme];
  // fallback: chỉ 1 (không nên xảy ra nếu seed pass neighbor)
  return targetPhonemes;
}

/**
 * Map index 0-9 → stage (1/2/3). 4/4/2 split.
 */
export function splitStages(total: number): number[] {
  return Array.from({ length: total }, (_, i) => {
    if (i < 4) return 1;
    if (i < 8) return 2;
    return 3;
  });
}

/**
 * Cycle pool đến đủ 10 (pool <10 → lặp). pool ≥10 → slice 10.
 */
export function cycleToTen<T>(pool: T[]): T[] {
  if (pool.length >= 10) return pool.slice(0, 10);
  const result: T[] = [];
  for (let i = 0; i < 10; i++) {
    result.push(pool[i % pool.length]);
  }
  return result;
}

/**
 * Sinh 10 câu listen_choose 3-stage từ pool đã lọc + contrast.
 * pool: words đã filterSinglePhonemeWords. Trả về câu với skeleton + answer = targetPhoneme.
 */
export function buildListenChooseQuestions(
  pool: ListenChooseWord[],
  contrastPhonemes: string[],
): ListenChooseQuestion[] {
  if (pool.length === 0) return [];
  const selected = cycleToTen(pool);
  const stages = splitStages(selected.length);

  return selected.map((w, i) => {
    const stage = stages[i] as 1 | 2 | 3;
    const skeleton = stage === 2 ? buildSkeleton(w.ipa, w.targetPhoneme) : null;
    return {
      stage,
      answerType: "phoneme" as const,
      word: w.word,
      ipa: w.ipa,
      audioUrl: w.audioUrl,
      targetPhoneme: w.targetPhoneme,
      contrastPhonemes,
      skeleton,
      answer: w.targetPhoneme,
    };
  });
}
```

- [ ] **Step 4: Chạy test → xác nhận pass**

Run: `npm test`
Expected: PASS — 8 test mới pass. Tổng ~40 test (32 cũ + 8 mới). Không test cũ hỏng.

- [ ] **Step 5: (KHÔNG commit — user handles git)**

---

## Task 2: Scoring fix — exact-match cho phoneme (TDD)

**Files:**
- Modify: `src/lib/scoring.ts` (`scoreMultipleChoice` line 73-92)
- Test: `src/lib/__tests__/scoring.test.ts`

- [ ] **Step 1: Viết test thất bại**

Thêm vào `src/lib/__tests__/scoring.test.ts` (cuối file):

```ts
test("scoreMultipleChoice: IPA exact-match — /iː/ correct, /ɪ/ wrong", () => {
  const question: ScoringQuestion = {
    id: "q1",
    answer: "/iː/",
    score: 10,
    type: { id: "qtype-1-mc", name: "Trắc nghiệm nghe" },
    options: [
      { id: "o1", content: "/iː/" },
      { id: "o2", content: "/ɪ/" },
    ],
  };
  // chọn /iː/ đúng
  const correctResult = scoreQuestion(question, { questionId: "q1", selectedOptionId: "o1", selectedText: "/iː/" });
  assert.equal(correctResult.isCorrect, true);
  // chọn /ɪ/ sai
  const wrongResult = scoreQuestion(question, { questionId: "q1", selectedOptionId: "o2", selectedText: "/ɪ/" });
  assert.equal(wrongResult.isCorrect, false);
});

test("scoreMultipleChoice: word mode vẫn normalized match (không vỡ)", () => {
  const question: ScoringQuestion = {
    id: "q2",
    answer: "sheep",
    score: 10,
    type: { id: "qtype-1-mc", name: "Trắc nghiệm nghe" },
    options: [
      { id: "o1", content: "sheep" },
      { id: "o2", content: "ship" },
    ],
  };
  const result = scoreQuestion(question, { questionId: "q2", selectedOptionId: "o1", selectedText: "sheep" });
  assert.equal(result.isCorrect, true);
});
```

Lưu ý: kiểm tra `scoring.test.ts` đã import `scoreQuestion` + `ScoringQuestion`. Nếu chưa, thêm vào import.

- [ ] **Step 2: Chạy test → xác nhận fail**

Run: `npm test`
Expected: FAIL — `/iː/` normalize thành `""` hoặc `"i"`, `/ɪ/` → `""` → isCorrect sai (cả 2 có thể true nếu cả 2 rỗng). Test IPA exact-match fail.

- [ ] **Step 3: Sửa `scoreMultipleChoice` thêm exact-match branch**

Trong `src/lib/scoring.ts`, sửa `scoreMultipleChoice` (line 73-92):

```ts
function scoreMultipleChoice(question: ScoringQuestion, answer: SubmitAnswerInput): QuestionScoreResult {
  const selectedOption = answer.selectedOptionId
    ? question.options.find((option) => option.id === answer.selectedOptionId)
    : null;
  const selectedText = selectedOption?.content ?? answer.selectedText ?? "";
  // Exact-match branch (cho IPA phoneme answer): /iː/ vs /ɪ/ khác nhau nguyên văn.
  // Normalized match vẫn thắng cho word (word ≠ exact IPA).
  const isCorrect =
    selectedText === question.answer ||
    normalizeAnswerText(selectedText) === normalizeAnswerText(question.answer);

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
```

- [ ] **Step 4: Chạy test → xác nhận pass**

Run: `npm test`
Expected: PASS — 2 test scoring mới pass. IPA exact-match đúng (/iː/ correct, /ɪ/ wrong), word mode vẫn OK. Tổng ~42 test.

- [ ] **Step 5: (KHÔNG commit)**

---

## Task 3: Engine — exact-match branch + WordPrompt type

**Files:**
- Modify: `src/app/exercises/[id]/ExerciseEngineClient.tsx` (`WordPrompt` type ~line 30-40, `ListenChooseQuestion` render line 262-341, normalizeAnswer usage line 309/324)

- [ ] **Step 1: Mở rộng `WordPrompt` type thêm stage + phoneme fields**

Tìm type `WordPrompt` (khoảng line 30-40, có `word, ipa, audioUrl, hint, options`). Thêm:

```ts
type WordPrompt = {
  word?: String;
  ipa?: string;
  audioUrl?: string;
  hint?: string;
  options?: Array<{ id?: string; text?: string; content?: string; audioUrl?: string }>;
  // v2 listen_choose 3-stage:
  answerType?: "phoneme";
  stage?: 1 | 2 | 3;
  targetPhoneme?: string;
  contrastPhonemes?: string[];
  skeleton?: string | null;
};
```

(Lưu ý: kiểm tra type `WordPrompt` thực tế trong file trước khi edit — tên field phải khớp. `String` capitalized có thể là `string` — match code hiện có.)

- [ ] **Step 2: Sửa `ListenChooseQuestion` render 3 stage**

Thay toàn bộ component `ListenChooseQuestion` (line 262-341) bằng version đọc `stage`:

```tsx
function ListenChooseQuestion({
  question,
  onAnswer,
  isAnswered,
  selectedAnswer,
}: {
  question: ExerciseQuestion;
  onAnswer: (isCorrect: boolean, selectedOpt: string, selectedOptionId?: string | null) => void;
  isAnswered: boolean;
  selectedAnswer: string | null;
}) {
  const contentData = useMemo(() => parseWordPrompt(question.content), [question.content]);
  const stage = contentData.stage ?? 1; // fallback stage 1 cho câu cũ (word-mode)
  const isPhonemeMode = contentData.answerType === "phoneme";

  // Phoneme mode: option = contrastPhonemes. Word mode (cũ): option = contentData.options.
  const options = isPhonemeMode
    ? (contentData.contrastPhonemes ?? []).map((ph, i) => ({
        id: `${question.id}-ph-${i}`,
        content: ph,
      }))
    : (question.options.length > 0
        ? question.options
        : contentData.options?.map((option, index) => ({
            id: String(option.id ?? `${question.id}-json-option-${index}`),
            content: String(option.text ?? option.content ?? ""),
          })).filter((option) => option.content.length > 0) ?? []);

  const displayWord = contentData.word ? contentData.word.charAt(0).toUpperCase() + contentData.word.slice(1) : "...";

  useEffect(() => {
    if (!contentData.audioUrl) return;
    const timer = window.setTimeout(() => {
      const audio = new Audio(contentData.audioUrl);
      audio.play().catch((error) => console.warn("Autoplay prevented:", error));
    }, 500);
    return () => window.clearTimeout(timer);
  }, [contentData.audioUrl, question.id]);

  // exact-match cho phoneme, normalize cho word
  const checkCorrect = (optContent: string) =>
    isPhonemeMode
      ? optContent === question.answer
      : normalizeAnswer(optContent) === normalizeAnswer(question.answer);

  return (
    <div className="space-y-10 text-center">
      <div className="flex flex-col items-center gap-4">
        {/* Stage 1: hiện word. Stage 2: ẩn word, hiện skeleton. Stage 3: ẩn cả word + skeleton. */}
        {stage === 1 && (
          <h2 className="text-5xl font-bold text-neutral-900 sm:text-6xl">{displayWord}</h2>
        )}
        {stage === 2 && contentData.skeleton && (
          <h2 className="font-ipa text-5xl font-bold text-neutral-900 sm:text-6xl">
            {contentData.skeleton.replace("_", <span className="text-warning-500">_</span>)}
          </h2>
        )}
        {stage === 2 && !contentData.skeleton && (
          // fallback: target không trong ipa → render stage 1 (show word)
          <h2 className="text-5xl font-bold text-neutral-900 sm:text-6xl">{displayWord}</h2>
        )}
        {/* Stage 3: không hiện word/skeleton */}
        <AudioButton audioUrl={contentData.audioUrl} label="Phát lại audio" />
      </div>

      <div>
        <p className="mb-6 text-lg font-medium text-neutral-600">
          {stage === 1 && (question.name || "Phân biệt âm mục tiêu")}
          {stage === 2 && (question.name || "Nghe & điền âm còn thiếu")}
          {stage === 3 && (question.name || "Âm bạn vừa nghe là")}
        </p>
        <div className="flex flex-wrap justify-center gap-4">
          {options.map((option) => {
            let buttonClass = "border-neutral-200 bg-white text-neutral-800 hover:border-primary-300";
            if (isAnswered) {
              if (checkCorrect(option.content)) {
                buttonClass = "border-success-500 bg-success-50 text-success-700 ring-4 ring-success-100";
              } else if (option.content === selectedAnswer) {
                buttonClass = "border-error-500 bg-error-50 text-error-700";
              } else {
                buttonClass = "border-neutral-200 bg-neutral-50 text-neutral-400";
              }
            }

            return (
              <button
                key={option.id}
                type="button"
                onClick={() =>
                  onAnswer(
                    checkCorrect(option.content),
                    option.content,
                    question.options.length > 0 ? option.id : null,
                  )
                }
                disabled={isAnswered}
                aria-pressed={selectedAnswer === option.content}
                className={`h-20 min-w-32 rounded-xl border-4 px-6 font-ipa text-3xl font-bold transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 ${buttonClass}`}
              >
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

Lưu ý: dòng skeleton `{contentData.skeleton.replace("_", <span>...)}` — React không cho string.replace trả JSX trực tiếp. Sửa thành split:

```tsx
        {stage === 2 && contentData.skeleton && (
          <h2 className="font-ipa text-5xl font-bold text-neutral-900 sm:text-6xl">
            {contentData.skeleton.split("_").map((part, i, arr) => (
              <span key={i}>
                {part}
                {i < arr.length - 1 && <span className="text-warning-500">_</span>}
              </span>
            ))}
          </h2>
        )}
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS. Nếu lỗi type `WordPrompt` — kiểm tra field type khớp code hiện có (`String` vs `string`).

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: PASS — `/exercises/[id]` build OK.

- [ ] **Step 5: (KHÔNG commit)**

---

## Task 4: Seed canonical — `generateQuestions` nhánh listen_choose dùng helper

**Files:**
- Modify: `prisma/seed_lessons.ts` (`generateQuestions` nhánh listen_choose line 798-860)

Mục đích: seed chính thức sinh câu 3-stage cho re-seed đầy đủ sau này. Script Task 5 cho DB hiện tại (không re-fetch).

- [ ] **Step 1: Thêm import helper**

Trong `prisma/seed_lessons.ts`, thêm import (sau import lesson-content, ~line 40):

```ts
import { buildListenChooseQuestions, filterSinglePhonemeWords, buildContrastPhonemes, type ListenChooseWord } from "./listen-choose-builder";
```

- [ ] **Step 2: Thay nhánh listen_choose trong `generateQuestions`**

Thay block `if (mode.id === "listen_choose")` (line 798-860) bằng:

```ts
        // --- listen_choose 3-stage (phoneme-ID) ---
        if (mode.id === "listen_choose") {
          // Skip nếu sound group không thuộc CĐ1-3 (CĐ4 dùng mode_a_listen_choose riêng)
          if (sg.topicId === "topic-4-stress-connected") continue;

          // 1. Pool từ ACTIVE của sound group (từ content)
          const poolWords: ListenChooseWord[] = content.words
            .filter((w) => {
              const wordItem = await prisma.wordItem.findFirst({ where: { word: w.word, ipa: w.ipa } });
              return wordItem && wordItem.status === "ACTIVE" && wordItem.audioUrl;
            })
            .map((w) => ({
              word: w.word,
              ipa: w.ipa,
              targetPhoneme: w.targetPhonemes[0],
              audioUrl: (await prisma.wordItem.findFirst({ where: { word: w.word, ipa: w.ipa } }))?.audioUrl ?? "",
            }));

          // 2. Contrast: nhóm 1-âm → mồi từ neighbor
          let neighborPhoneme: string | null = null;
          if (sg.targetPhonemes.length === 1) {
            const neighbor = SOUND_GROUPS.find(
              (n) => n.topicId === sg.topicId && Math.abs(n.orderIndex - sg.orderIndex) === 1 && n.targetPhonemes.length >= 1,
            );
            neighborPhoneme = neighbor?.targetPhonemes[0] ?? null;
            if (!neighborPhoneme) {
              console.warn(`   ⚠️  Không tìm neighbor cho nhóm 1-âm ${sg.id}, contrast chỉ 1 nút.`);
            }
          }
          const contrastPhonemes = buildContrastPhonemes(sg.targetPhonemes, neighborPhoneme);

          // 3. Lọc từ 1-âm
          const filteredPool = filterSinglePhonemeWords(poolWords, contrastPhonemes);
          if (filteredPool.length === 0) {
            console.warn(`   ⚠️  Pool rỗng sau lọc 1-âm cho ${sg.id}, listen_choose → DRAFT.`);
            continue;
          }

          // 4. Sinh 10 câu 3-stage
          const questions3stage = buildListenChooseQuestions(filteredPool, contrastPhonemes);

          for (const q of questions3stage) {
            const questionId = generateQuestionId(exerciseId, questionIndex);
            const contentJson = JSON.stringify({
              mode: "listen_choose",
              answerType: "phoneme",
              stage: q.stage,
              word: q.word,
              ipa: q.ipa,
              audioUrl: q.audioUrl,
              targetPhoneme: q.targetPhoneme,
              contrastPhonemes: q.contrastPhonemes,
              skeleton: q.skeleton,
            });

            const options = q.contrastPhonemes.map((ph, i) => ({
              id: `${questionId}-opt-${i}`,
              text: ph,
            }));

            await prisma.question.upsert({
              where: { id: questionId },
              update: {
                name: `Q${questionIndex}`,
                content: contentJson,
                answer: q.answer,
                score: 10,
                status: "ACTIVE",
                typeId: qtypeMap["qtype-1-mc"].id,
              },
              create: {
                id: questionId,
                name: `Q${questionIndex}`,
                content: contentJson,
                answer: q.answer,
                score: 10,
                status: "ACTIVE",
                typeId: qtypeMap["qtype-1-mc"].id,
                exerciseId,
              },
            });

            // AnswerOption rows = contrastPhonemes (content = IPA y nguyên)
            await prisma.answerOption.deleteMany({ where: { questionId } });
            for (const opt of options) {
              await prisma.answerOption.create({
                data: { content: opt.text, questionId },
              });
            }

            questionIndex++;
            totalQuestions++;
            createdForThisExercise++;
          }
          continue;
        }
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS. Nếu `prisma/*.ts` không trong tsconfig include → verify bằng cách chạy script Task 5 (tsx sẽ bắt type error).

- [ ] **Step 4: (KHÔNG commit)**

---

## Task 5: Script re-generate `seed_listen_choose.ts` (DB hiện tại, không re-fetch)

**Files:**
- Create: `prisma/seed_listen_choose.ts`

Lý do KHÔNG re-run seed đầy đủ: re-fetch audio (regression SP3a). Script này chỉ re-generate Question + AnswerOption cho listen_choose, copy audioUrl từ WordItem DB.

- [ ] **Step 1: Tạo script**

Tạo `prisma/seed_listen_choose.ts`:

```ts
/**
 * SEED LISTEN_CHOOSE 3-STAGE (SP-fix) - Re-generate Question + AnswerOption cho mode listen_choose.
 *
 * Chỉ re-generate listen_choose questions (CĐ1-3). Copy audioUrl từ WordItem DB hiện có,
 * KHÔNG re-fetch API → tránh regression SP3a local audio.
 *
 * Chạy: npx tsx prisma/seed_listen_choose.ts
 * Yêu cầu: DB đã seed đầy đủ (SP3a) + schema đã có subcategory (nếu dùng).
 */

import { PrismaClient } from "@prisma/client";
import { SOUND_GROUPS, getSoundGroupsByTopic } from "./lesson-catalog";
import { getContentBySoundGroup } from "./lesson-content";
import {
  buildListenChooseQuestions,
  filterSinglePhonemeWords,
  buildContrastPhonemes,
  type ListenChooseWord,
} from "./listen-choose-builder";

const prisma = new PrismaClient();

function generateQuestionId(exerciseId: string, index: number): string {
  return `${exerciseId.replace("ex-", "q-")}-${String(index).padStart(3, "0")}`;
}

async function main() {
  console.log("🎧 Re-generating listen_choose 3-stage questions (no audio re-fetch)...");

  let totalQuestions = 0;
  let totalExercises = 0;

  for (const sg of SOUND_GROUPS) {
    if (sg.topicId === "topic-4-stress-connected") continue; // CĐ4 dùng mode_a_listen_choose

    const content = getContentBySoundGroup(sg.id);
    if (!content || content.words.length === 0) continue;

    const exerciseId = `ex-${sg.id}-listen_choose`;
    const exercise = await prisma.exercise.findUnique({ where: { id: exerciseId } });
    if (!exercise) continue;

    // 1. Pool từ ACTIVE
    const poolWords: ListenChooseWord[] = [];
    for (const w of content.words) {
      const wordItem = await prisma.wordItem.findFirst({ where: { word: w.word, ipa: w.ipa } });
      if (wordItem && wordItem.status === "ACTIVE" && wordItem.audioUrl) {
        poolWords.push({
          word: w.word,
          ipa: w.ipa,
          targetPhoneme: w.targetPhonemes[0],
          audioUrl: wordItem.audioUrl,
        });
      }
    }

    // 2. Contrast (mồi nếu 1-âm)
    let neighborPhoneme: string | null = null;
    if (sg.targetPhonemes.length === 1) {
      const neighbor = SOUND_GROUPS.find(
        (n) => n.topicId === sg.topicId && Math.abs(n.orderIndex - sg.orderIndex) === 1,
      );
      neighborPhoneme = neighbor?.targetPhonemes[0] ?? null;
    }
    const contrastPhonemes = buildContrastPhonemes(sg.targetPhonemes, neighborPhoneme);

    // 3. Lọc 1-âm
    const filteredPool = filterSinglePhonemeWords(poolWords, contrastPhonemes);
    if (filteredPool.length === 0) {
      console.warn(`   ⚠️  ${sg.id}: pool rỗng sau lọc 1-âm, skip.`);
      // Chuyển exercise DRAFT
      await prisma.exercise.update({ where: { id: exerciseId }, data: { status: "DRAFT", questionCount: 0 } });
      continue;
    }

    // 4. Sinh 10 câu
    const questions3stage = buildListenChooseQuestions(filteredPool, contrastPhonemes);

    // Delete old listen_choose questions cho exercise này (idempotent)
    await prisma.question.deleteMany({ where: { exerciseId } });

    let qIndex = 1;
    for (const q of questions3stage) {
      const questionId = generateQuestionId(exerciseId, qIndex);
      const contentJson = JSON.stringify({
        mode: "listen_choose",
        answerType: "phoneme",
        stage: q.stage,
        word: q.word,
        ipa: q.ipa,
        audioUrl: q.audioUrl,
        targetPhoneme: q.targetPhoneme,
        contrastPhonemes: q.contrastPhonemes,
        skeleton: q.skeleton,
      });

      await prisma.question.create({
        data: {
          id: questionId,
          name: `Q${qIndex}`,
          content: contentJson,
          answer: q.answer,
          score: 10,
          status: "ACTIVE",
          typeId: "qtype-1-mc",
          exerciseId,
        },
      });

      // AnswerOption = contrastPhonemes
      for (let i = 0; i < q.contrastPhonemes.length; i++) {
        await prisma.answerOption.create({
          data: { content: q.contrastPhonemes[i], questionId },
        });
      }

      qIndex++;
      totalQuestions++;
    }

    // Cập nhật questionCount + status ACTIVE
    await prisma.exercise.update({
      where: { id: exerciseId },
      data: { questionCount: questions3stage.length, status: "ACTIVE" },
    });
    totalExercises++;
    console.log(`   ✓ ${sg.id}: ${questions3stage.length} câu 3-stage`);
  }

  console.log(`\n✅ ${totalQuestions} questions trong ${totalExercises} exercises listen_choose`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 2: Chạy script**

Run: `npx tsx prisma/seed_listen_choose.ts`
Expected output (đại khái):
```
🎧 Re-generating listen_choose 3-stage questions (no audio re-fetch)...
   ✓ map-t1-g01-i-ih: 10 câu 3-stage
   ✓ map-t1-g02-e-ae: 10 câu 3-stage
   ...
✅ 260 questions trong 26 exercises listen_choose
```
(26 nhóm CĐ1-3 × 10 câu = 260. Một vài nhóm có thể <10 nếu pool<10 nhưng cycleToTen đảm bảo 10. Verify không có error "pool rỗng" cho nhóm có content ACTIVE.)

- [ ] **Step 3: Verify DB — 1 câu sample**

Run query (qua tsx script nhỏ hoặc prisma studio): kiểm tra 1 Question listen_choose có content JSON với `stage`, `answerType:"phoneme"`, `targetPhoneme`, `contrastPhonemes`, `skeleton`. Answer = targetPhoneme (IPA). AnswerOption content = IPA y nguyên.

- [ ] **Step 4: (KHÔNG commit)**

---

## Task 6: Quality gate cuối

**Files:** không sửa — chỉ verify.

- [ ] **Step 1: Validate + db sync**

Run: `npx prisma validate` → schema valid.
Run: `npx prisma db push` → DB in sync (không thay đổi thêm).

- [ ] **Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS — 0 error.

- [ ] **Step 3: Test**

Run: `npm test`
Expected: PASS — tất cả test pass (helper 8 + scoring 2 mới + 32 cũ = 42). Không test cũ hỏng.

- [ ] **Step 4: Build**

Run: `npm run build`
Expected: PASS — 24/24 pages, `/exercises/[id]` build OK.

- [ ] **Step 5: Smoke test thủ công (khuyến nghị)**

`npm run dev` → vào 1 exercise listen_choose (vd `/exercises/ex-map-t1-g01-i-ih-listen_choose`):
- Câu 1-4 (Stage 1): hiện word "Sheep" + audio + 2 nút IPA `/iː/` `/ɪ/`.
- Câu 5-8 (Stage 2): ẩn word, hiện skeleton `/ʃ_p/` + audio + 2 nút.
- Câu 9-10 (Stage 3): chỉ audio + 2 nút.
- Chọn đúng/sai → nút đổi màu đúng (exact-match IPA, không phải normalize bug).
- Submit → kết quả lưu OK, scoring server đúng (IPA exact-match).

- [ ] **Step 6: (KHÔNG commit)**

---

## Self-Review (đã kiểm tra)

**Spec coverage:** Tất cả mục spec có task:
- §2 content JSON schema → Task 1 (helper) + Task 4/5 (seed ghi) ✓
- §2 seed logic (pool lọc 1-âm, contrast N-âm, mồi 1-âm, skeleton, 4/4/2, lặp) → Task 1 (helper test) + Task 4/5 ✓
- §3 UI 3 stage → Task 3 ✓
- §4 scoring fix (engine + server exact-match) → Task 2 (server) + Task 3 (engine) ✓
- §5 edge cases (pool<10 lặp, skeleton fallback, 1-âm mồi, pool=0 DRAFT) → Task 1 helper + Task 4/5 ✓
- §5 testing → Task 1 (helper) + Task 2 (scoring) ✓
- §5 quality gate → Task 6 ✓
- §6 file → khớp ✓
- §7 rủi ro (re-fetch audio) → Task 5 script riêng không re-fetch ✓

**Placeholder scan:** Không TBD/TODO. Mọi step code có code đầy đủ.

**Type consistency:** `ListenChooseWord`, `ListenChooseQuestion`, `buildListenChooseQuestions` signature nhất quán Task 1/4/5. `answerType:"phoneme"` nhất quán helper→seed→engine→scoring. `stage: 1|2|3` nhất quán.

**Lưu ý thực thi:** Task 3 Step 2 có cảnh báo JSX string.replace → đã cho fix split. Task 4 Step 2 dùng `await` trong `.filter/.map` (không hợp lệ) — khi thực thi, chuyển sang for-loop để await WordItem (như Task 5 pattern). Plan đã ghi Task 5 dùng for-loop; Task 4 nên làm tương tự khi implement.
