# SP2 — Màn hình tổng kết redesin (End-of-Lesson Summary) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Git policy:** Engineer KHÔNG tự commit. Mỗi task kết thúc bằng checkpoint review với user; user tự commit khi convenient. Không chạy `git add`/`git commit`/`git push`.

**Goal:** Redesin màn hình tổng kết sau bài tập thành layout 3-tier (Peak-End Rule) + confetti ≥80% + progress bias, tách ra `ExerciseSummaryScreen` component riêng + expose `previousBestScore` & `streak` trong submit API.

**Architecture:** Hướng A (spec section 3). Tách `ExerciseSummaryScreen.tsx` khỏi engine ~1236 dòng; thêm `lib/confetti.ts` wrapper lazy-import `canvas-confetti` (cô lập lib + testable trong Node); mở rộng submit API response thêm 2 field nhỏ (read-only, không update streak); progress bias tính client-side. Tầng 1 = khen + vòng tròn % CSS conic-gradient + confetti/tada; tầng 2 = 3 card XP/streak/badges + progress bias; tầng 3 = list lỗi + nghe lại + 2 nút.

**Tech Stack:** Next.js 16 (App Router, client components), React 18, TypeScript 6, Tailwind 4, Prisma 6, `canvas-confetti` (dep mới), test runner `tsx --test` (Node built-in `node:test` + `node:assert/strict`).

**Spec reference:** `docs/superpowers/specs/2026-06-19-sp2-summary-redesign-design.md`

**Codebase root note:** Source nằm dưới `english_pronunciation_app/frontend/`. Mọi path trong plan đều tương đối từ `english_pronunciation_app/frontend/` (trừ khi ghi rõ). Chạy lệnh `npm`/`npx` từ thư mục `english_pronunciation_app/frontend/`.

---

## File Structure

| Hành động | File | Trách nhiệm |
|---|---|---|
| tạo | `src/lib/confetti.ts` | `celebrate()` (lazy-import canvas-confetti, 3 burst) + `prefersReducedMotion()` (export để test) |
| tạo test | `src/lib/__tests__/confetti.test.ts` | test `prefersReducedMotion` với matchMedia mock (pattern `sfx.test.ts`) |
| tạo | `src/app/exercises/[id]/ExerciseSummaryScreen.tsx` | Layout 3-tier; nhận props từ engine; gọi confetti/tada trong useEffect |
| sửa | `src/app/api/exercises/submit/route.ts` | thêm `streakCount/longestStreak` vào user select + expose `previousBestScore` & `streak` trong response (read-only) |
| sửa | `src/app/exercises/[id]/ExerciseEngineClient.tsx` | mở rộng `SubmitResult` type (+`badgesAwarded`/`previousBestScore`/`streak`), export `ExerciseData` & `IncorrectQuestion`, thay inline `isFinished` block bằng `<ExerciseSummaryScreen>` |
| cài dep | `package.json` | `canvas-confetti` + `@types/canvas-confetti` (dev) |

**Decomposition rationale:** Engine đã ~1236 dòng sau SP1 → tách summary screen (đang ~91 dòng inline, line 1065-1156) ra component riêng, nhất quán với `ListenFeedbackSheet` đã tách ở SP1. Confetti wrapper cô lập lib → dễ swap + lazy-import để test được `prefersReducedMotion` trong Node mà không load DOM lib. Submit API chỉ thêm 2 field read-only → không phá v1.

---

## Task 1: Cài dependency `canvas-confetti`

**Files:**
- Modify: `english_pronunciation_app/frontend/package.json` (qua npm)

- [ ] **Step 1: Cài canvas-confetti + types**

Chạy từ `english_pronunciation_app/frontend/`:
```bash
npm install canvas-confetti
npm install --save-dev @types/canvas-confetti
```
Expected: 2 package thêm vào `dependencies` (`canvas-confetti`) và `devDependencies` (`@types/canvas-confetti`). Bundle tăng ~6KB gzip.

- [ ] **Step 2: Verify package.json có 2 entry**

Mở `english_pronunciation_app/frontend/package.json`, xác nhận `dependencies` có `"canvas-confetti": "^..."` và `devDependencies` có `"@types/canvas-confetti": "..."`.

- [ ] **Step 3: Checkpoint review với user**

Chưa có code mới ngoài dep. Báo user: dep đã cài, review `package.json` rồi tiếp Task 2.

---

## Task 2: `lib/confetti.ts` wrapper + test reduced-motion (TDD)

**Files:**
- Create: `src/lib/confetti.ts`
- Test: `src/lib/__tests__/confetti.test.ts`

**Design note (khác spec section 5, improvement):** Spec viết top-level `import confetti from "canvas-confetti"`. Plan dùng **lazy dynamic import** bên trong `celebrate()` để: (1) `confetti.ts` import được trong Node test mà không load DOM lib (canvas-confetti chạm `document`); (2) `prefersReducedMotion` là pure function test được độc lập. `prefersReducedMotion` được **export** (spec để private) để test — chi phí thấp, lợi ích test rõ.

- [ ] **Step 1: Viết failing test cho `prefersReducedMotion`**

Tạo `src/lib/__tests__/confetti.test.ts`:
```ts
import assert from "node:assert/strict";
import test, { beforeEach, afterEach } from "node:test";
import { prefersReducedMotion } from "../confetti";

// Mock window.matchMedia cho node:test (confetti.ts guard `typeof window`).
let reduceMatches = false;
const matchMediaMock = (query: string): MediaQueryList => ({
  matches: query.includes("prefers-reduced-motion") ? reduceMatches : false,
  media: query,
  onchange: null,
  addListener: () => {},
  removeListener: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  dispatchEvent: () => false,
});
const windowMock = { matchMedia: matchMediaMock };
(globalThis as unknown as { window: typeof windowMock }).window = windowMock;

beforeEach(() => {
  reduceMatches = false;
});
afterEach(() => {
  reduceMatches = false;
});

test("prefersReducedMotion: false khi matchMedia không match reduce", () => {
  reduceMatches = false;
  assert.equal(prefersReducedMotion(), false);
});

test("prefersReducedMotion: true khi matchMedia matches reduce", () => {
  reduceMatches = true;
  assert.equal(prefersReducedMotion(), true);
});
```

- [ ] **Step 2: Chạy test để verify fail**

Chạy từ `english_pronunciation_app/frontend/`:
```bash
npx tsx --test "src/lib/__tests__/confetti.test.ts"
```
Expected: FAIL — `Cannot find module '../confetti'` (file chưa tạo).

- [ ] **Step 3: Viết `src/lib/confetti.ts`**

Tạo `src/lib/confetti.ts`:
```ts
// SP2: Confetti wrapper — cô lập canvas-confetti, lazy-import để test được
// prefersReducedMotion trong Node mà không load DOM lib. Đổi particle/lib sau chỉ cần sửa đây.

export function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true; // SSR / non-browser → skip an toàn
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

// Pháo hoa nhẹ, 3 burst. Chỉ gọi khi exerciseScore >= 80 (gọi trong ExerciseSummaryScreen).
// Lazy import để confetti.ts importable trong Node test (canvas-confetti chạm document).
export function celebrate(): void {
  if (prefersReducedMotion()) return; // tôn trọng reduce-motion
  void import("canvas-confetti").then(({ default: confetti }) => {
    confetti({
      particleCount: 80,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#10b981", "#3b82f6", "#f59e0b"],
    });
    setTimeout(() => {
      confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0, y: 0.7 } });
    }, 200);
    setTimeout(() => {
      confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1, y: 0.7 } });
    }, 400);
  }).catch((error: unknown) => {
    console.warn("confetti failed:", error);
  });
}
```

- [ ] **Step 4: Chạy test để verify pass**

Chạy từ `english_pronunciation_app/frontend/`:
```bash
npx tsx --test "src/lib/__tests__/confetti.test.ts"
```
Expected: PASS — 2 test pass (`prefersReducedMotion: false...` + `...true...`).

- [ ] **Step 5: Verify tsc không lỗi**

```bash
npx tsc --noEmit
```
Expected: 0 error (`canvas-confetti` types đã cài Task 1; `MediaQueryList` mock khớp DOM lib types).

- [ ] **Step 6: Checkpoint review với user**

Báo user: `confetti.ts` + test done, 2 test pass. Review rồi tiếp Task 3.

---

## Task 3: Submit API expose `previousBestScore` + `streak` (read-only)

**Files:**
- Modify: `src/app/api/exercises/submit/route.ts:91-98` (user select) + `route.ts:262-305` (response)

**Design note (khác spec section 4, improvement):** Spec viết `result.updatedUser.streakCount`. Nhưng streak KHÔNG update ở submit (chỉ read để expose) → dùng `user.streakCount`/`user.longestStreak` (read trước transaction, line 91-98) chính xác và đơn giản hơn. KHÔNG cần mở rộng `updatedUser` select (line 202-205). `previousBestAttempt` đã query line 132-144 select `{score}` → dùng `previousBestAttempt?.score ?? null` trực tiếp.

**Testing note:** Submit route cần Prisma + auth → khó unit test (spec section 8: "integration — khó unit test, smoke test qua dev"). Task này verify bằng `tsc --noEmit` (type) + smoke check thủ công (review response shape). KHÔNG tạo test file.

- [ ] **Step 1: Thêm `streakCount` + `longestStreak` vào user select**

Mở `src/app/api/exercises/submit/route.ts`. Tại block user query (line 91-98), sửa:
```ts
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        xp: true,
        level: true,
        streakCount: true,
        longestStreak: true,
      },
    });
```
(Giữ nguyên phần còn lại; chỉ thêm 2 dòng `streakCount`/`longestStreak`.)

- [ ] **Step 2: Thêm `previousBestScore` + `streak` vào response**

Cùng file, trong object trả về của `success(...)` (sau `badgesAwarded: result.badgesAwarded,` ~line 297, trước `questionResults:`), thêm:
```ts
        badgesAwarded: result.badgesAwarded,
        previousBestScore: previousBestAttempt?.score ?? null,
        streak: {
          count: user.streakCount,
          longest: user.longestStreak,
        },
        questionResults: questionResults.map((questionResult) => ({
```
(Các field khác giữ nguyên; chỉ chèn 4 dòng `previousBestScore` + `streak` block.)

- [ ] **Step 3: Verify tsc không lỗi**

```bash
npx tsc --noEmit
```
Expected: 0 error. Nếu lỗi `Property 'streakCount' does not exist` → verify `prisma/schema.prisma:35-36` có `streakCount Int @default(0)` + `longestStreak Int @default(0)` (đã confirm). Nếu Prisma client chưa regenerate → chạy `npx prisma generate`.

- [ ] **Step 4: Smoke review response shape**

Đọc lại block `return success({...}, 201)` (line 262-307), xác nhận response có đủ: `exerciseAttemptId, exerciseScore, isCompleted, rating, rewards{...}, progress{...}, dailyActivity, badgesAwarded, previousBestScore, streak{count,longest}, questionResults`. (Không chạy server — review visual.)

- [ ] **Step 5: Checkpoint review với user**

Báo user: submit API expose 2 field done, tsc pass. Review rồi tiếp Task 4.

---

## Task 4: Mở rộng client `SubmitResult` type + export types từ engine

**Files:**
- Modify: `src/app/exercises/[id]/ExerciseEngineClient.tsx:27-32` (export `ExerciseData`) + `:62-80` (SubmitResult type) + `:82-86` (export `IncorrectQuestion`)

**Context:** Client `SubmitResult` hiện (line 62-80) **thiếu `badgesAwarded`** dù API đã trả (route line 297) → Task này thêm cả `badgesAwarded` + 2 field mới. `ExerciseData` (line 27-32) và `IncorrectQuestion` (line 82-86) hiện là type nội bộ (không `export`) → cần export để `ExerciseSummaryScreen` import (pattern như `ExerciseQuestion` đã export line 17, `parseWordPrompt` đã export line 136).

- [ ] **Step 1: Export `ExerciseData`**

Mở `src/app/exercises/[id]/ExerciseEngineClient.tsx`. Tại line 27, đổi:
```ts
export type ExerciseData = {
  id: string;
  name: string;
  description: string | null;
  questions: ExerciseQuestion[];
};
```
(Thêm `export` — phần thân giữ nguyên.)

- [ ] **Step 2: Export `IncorrectQuestion`**

Cùng file, tại line 82, đổi:
```ts
export type IncorrectQuestion = {
  question: ExerciseQuestion;
  selected: string;
  correct: string;
};
```
(Thêm `export`.)

- [ ] **Step 3: Mở rộng `SubmitResult` thêm `badgesAwarded` + `previousBestScore` + `streak`**

Cùng file, tại block `SubmitResult` (line 62-80), sửa thành:
```ts
type SubmitResult = {
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
  };
};
```
(Thêm 3 field cuối: `badgesAwarded` khớp `BadgeAward` shape — `{id,name,type}` từ `gamification.ts:29-33`; `previousBestScore: number | null`; `streak{count,longest}`.)

- [ ] **Step 4: Verify tsc không lỗi**

```bash
npx tsc --noEmit
```
Expected: 0 error. (Type mới thêm, chưa dùng — không break code hiện tại. Field `badgesAwarded`/`previousBestScore`/`streak` API trả nhưng client trước không read → an toàn.)

- [ ] **Step 5: Checkpoint review với user**

Báo user: type mở rộng + 2 type export done, tsc pass. Review rồi tiếp Task 5 (component lớn nhất).

---

## Task 5: Tạo `ExerciseSummaryScreen.tsx` — layout 3-tier

**Files:**
- Create: `src/app/exercises/[id]/ExerciseSummaryScreen.tsx`

**Context:**
- Component thay block inline `isFinished` hiện tại (engine line 1065-1156, ~91 dòng).
- Tái dụng pattern `MiniSpeaker` từ `ListenFeedbackSheet.tsx:16-32` (nút 🔊 nghe lại audio).
- Tái dụng `parseWordPrompt` + `formatQuestionWord`-style logic. `formatQuestionWord` là function nội bộ engine (line 188-200, không export) → component tự inline helper nhỏ tương đương (xử lý content JSON có `word` hoặc array).
- `playSfx("tada")` đã có (`sfx.ts:75-80`). `useSfxMuted` không cần — `playSfx` tự check `isSfxMuted()`.
- Button variants: `primary`, `success`, `ghost` (`Button.tsx:5,42-48`).
- API response `rating` là string: `"EXCELLENT" | "GOOD" | "PASS" | "NEEDS_PRACTICE"` (từ `getExerciseRating` trong `scoring.ts`). Component switch theo rating string.
- `exerciseScore` = 0-100 (API trả `exerciseScore` + `maxScore: 100`). Confetti/tada khi `exerciseScore >= 80`.

**Testing note:** UI component React cần DOM → khó unit test trong `node:test` (không có jsdom). Spec section 8: "Summary screen render: smoke test thủ công". Task này verify bằng `tsc --noEmit` + review visual. KHÔNG tạo test file.

- [ ] **Step 1: Tạo `src/app/exercises/[id]/ExerciseSummaryScreen.tsx`**

Tạo file với nội dung đầy đủ:
```tsx
"use client";

import { useEffect, useMemo } from "react";
import Button from "@/components/ui/Button";
import Card from "@/components/ui/Card";
import { playSfx } from "@/lib/sfx";
import { celebrate } from "@/lib/confetti";
import {
  parseWordPrompt,
  type ExerciseData,
  type ExerciseQuestion,
  type IncorrectQuestion,
  type SubmitResult,
} from "./ExerciseEngineClient";

type ExerciseSummaryScreenProps = {
  exercise: ExerciseData;
  submitResult: SubmitResult;
  incorrectQuestions: IncorrectQuestion[];
  submitStatus: "idle" | "submitting" | "success" | "error";
  submitError: string | null;
  onRetry: () => void; // "Làm lại bài này" (router.reload)
  onExit: () => void; // "Về lộ trình" (router.push /learning_map)
};

// Lời khen theo rating (tầng 1).
function praiseByRating(rating: string): string {
  switch (rating) {
    case "EXCELLENT":
      return "Tuyệt đỉnh!";
    case "GOOD":
      return "Hoàn thành xuất sắc!";
    case "PASS":
      return "Bạn đang tiến bộ!";
    case "NEEDS_PRACTICE":
    default:
      return "Cần luyện thêm!";
  }
}

// Màu vòng tròn % theo rating (conic-gradient).
function ringColorByRating(rating: string): string {
  switch (rating) {
    case "EXCELLENT":
    case "GOOD":
      return "#10b981"; // success
    case "PASS":
      return "#3b82f6"; // primary
    case "NEEDS_PRACTICE":
    default:
      return "#f59e0b"; // warning
  }
}

// Hiện word từ content JSON (word đơn hoặc array pair) — tương đương formatQuestionWord engine.
function formatQuestionWord(question: ExerciseQuestion): string {
  try {
    const parsed = JSON.parse(question.content);
    if (Array.isArray(parsed)) {
      return parsed.map((item: { word?: string }) => item.word).filter(Boolean).join(" & ");
    }
    if (parsed?.word) return String(parsed.word);
  } catch {
    // Plain text fallback below.
  }
  return question.content;
}

// Nút 🔊 nghe lại audio (tái dụng MiniSpeaker pattern từ ListenFeedbackSheet).
function ReplayButton({ audioUrl }: { audioUrl?: string }) {
  if (!audioUrl) return null;
  const play = () => {
    const audio = new Audio(audioUrl);
    audio.play().catch((e) => console.warn("replay audio failed:", e));
  };
  return (
    <button
      type="button"
      onClick={play}
      aria-label="Nghe lại âm này"
      className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-bold text-neutral-700 transition-colors hover:border-primary-300 hover:text-primary-700"
    >
      <span aria-hidden="true">🔊</span> Nghe lại
    </button>
  );
}

export default function ExerciseSummaryScreen({
  exercise,
  submitResult,
  incorrectQuestions,
  submitStatus,
  submitError,
  onRetry,
  onExit,
}: ExerciseSummaryScreenProps) {
  const score = submitResult.exerciseScore;
  const isHighScore = score >= 80;
  const ringColor = ringColorByRating(submitResult.rating);
  const praise = praiseByRating(submitResult.rating);

  // Confetti + tada khi >= 80% (chỉ khi lưu thành công, không khi đang submit/error).
  useEffect(() => {
    if (submitStatus !== "success") return;
    if (!isHighScore) return;
    celebrate();
    playSfx("tada");
  }, [submitStatus, isHighScore]);

  // Progress bias client-side (tầng 2): exerciseScore - previousBestScore.
  const progressBias = useMemo(() => {
    if (submitResult.previousBestScore === null) return null;
    return score - submitResult.previousBestScore;
  }, [score, submitResult.previousBestScore]);

  return (
    <div className="flex min-h-screen flex-col items-center bg-neutral-50 p-6 sm:p-8">
      <Card className="w-full max-w-2xl space-y-8 p-8 text-center sm:p-12">
        {/* ===== TẦNG 1 (top): khen + vòng tròn % ===== */}
        <h1 className="text-3xl font-black text-neutral-900">{praise}</h1>

        {/* Vòng tròn % CSS conic-gradient (không lib). */}
        <div
          className="mx-auto flex h-40 w-40 items-center justify-center rounded-full text-4xl font-black text-neutral-900"
          style={{
            background: `conic-gradient(${ringColor} ${score}%, #e5e7eb 0)`,
          }}
          role="img"
          aria-label={`Điểm ${score} trên 100`}
        >
          <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full bg-white">
            <span className="text-4xl font-black" style={{ color: ringColor }}>
              {score}%
            </span>
          </div>
        </div>

        {/* ===== TẦNG 2 (middle): XP + streak + badges + progress bias ===== */}
        {submitStatus === "submitting" && (
          <p className="text-sm font-medium text-neutral-600" role="status">
            Đang lưu kết quả và tính XP...
          </p>
        )}

        {submitStatus === "success" && (
          <div className="space-y-4">
            {/* 3 card grid: XP / Streak / Badges */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {/* XP */}
              <div className="rounded-lg bg-primary-50 p-4 text-primary-700">
                <p className="text-sm font-semibold">⭐ XP</p>
                <p className="text-2xl font-black">+{submitResult.rewards.totalXpEarned}</p>
              </div>

              {/* Streak 🔥 — ẩn card nếu count === 0 */}
              {submitResult.streak.count > 0 ? (
                <div className="rounded-lg bg-warning-50 p-4 text-warning-700">
                  <p className="text-sm font-semibold">🔥 Streak</p>
                  <p className="text-2xl font-black">{submitResult.streak.count} ngày</p>
                </div>
              ) : (
                <div className="rounded-lg bg-neutral-100 p-4 text-neutral-500">
                  <p className="text-sm font-semibold">🔥 Streak</p>
                  <p className="text-sm font-bold">Chưa có streak</p>
                </div>
              )}

              {/* Badges 🏅 */}
              <div className="rounded-lg bg-success-50 p-4 text-success-700">
                <p className="text-sm font-semibold">🏅 Huy hiệu</p>
                {submitResult.badgesAwarded.length > 0 ? (
                  <ul className="mt-1 space-y-1 text-sm font-bold">
                    {submitResult.badgesAwarded.map((badge) => (
                      <li key={badge.id}>🏅 {badge.name}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm font-bold">Chưa có badge mới</p>
                )}
              </div>
            </div>

            {/* Progress bias — chỉ hiện nếu previousBestScore !== null */}
            {progressBias !== null && (
              <div className="text-sm font-bold">
                {progressBias > 0 && (
                  <p className="text-success-700">
                    Tốt hơn {progressBias}% so với lần trước!
                  </p>
                )}
                {progressBias === 0 && (
                  <p className="text-neutral-600">Cùng điểm lần trước.</p>
                )}
                {progressBias < 0 && (
                  <p className="text-warning-700">
                    Thấp hơn {-progressBias}% so với lần trước — cố gắng nhé!
                  </p>
                )}
              </div>
            )}

            {/* Level + XP hiện tại */}
            <p className="text-sm text-neutral-600">
              Level hiện tại:{" "}
              <span className="font-bold text-neutral-900">{submitResult.progress.level}</span> —
              XP: <span className="font-bold text-neutral-900">{submitResult.progress.currentXp}</span>
            </p>
          </div>
        )}

        {submitStatus === "error" && (
          <div className="rounded-lg bg-warning-50 p-4 text-sm text-warning-800" role="alert">
            {submitError || "Kết quả local đã có, nhưng chưa lưu được vào database."}
          </div>
        )}

        {/* ===== TẦNG 3 (bottom): lỗi + nghe lại + 2 nút ===== */}
        {incorrectQuestions.length > 0 && (
          <div className="rounded-xl border border-error-200 bg-error-50 p-6 text-left">
            <h2 className="mb-4 text-lg font-bold text-error-800">Cần chú ý</h2>
            <ul className="space-y-4">
              {incorrectQuestions.map((item, index) => {
                const audioUrl = parseWordPrompt(item.question.content).audioUrl;
                return (
                  <li
                    key={`${item.question.id}-${index}`}
                    className="rounded-lg border border-error-100 bg-white p-4"
                  >
                    <p className="font-bold text-neutral-900">"{formatQuestionWord(item.question)}"</p>
                    <p className="mt-1 text-sm text-neutral-600">
                      Bạn trả lời{" "}
                      <span className="font-bold text-error-700">{item.selected || "Không rõ"}</span>,
                      đáp án đúng là{" "}
                      <span className="font-bold text-success-700">{item.correct}</span>.
                    </p>
                    <div className="mt-2">
                      <ReplayButton audioUrl={audioUrl} />
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* 2 nút */}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Button variant="primary" size="lg" className="min-h-14 text-lg" onClick={onRetry}>
            Làm lại bài này
          </Button>
          <Button variant="ghost" size="lg" className="min-h-14 text-lg" onClick={onExit}>
            Về lộ trình
          </Button>
        </div>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Verify tsc không lỗi**

```bash
npx tsc --noEmit
```
Expected: 0 error. Nếu lỗi import type → verify Task 4 đã export `ExerciseData`/`IncorrectQuestion`/`SubmitResult`. Nếu lỗi `SubmitResult` không export → component import `type SubmitResult` nhưng engine khai báo `type SubmitResult` (không export) → cần thêm `export` vào `type SubmitResult` ở Task 4 Step 3 (sửa `type SubmitResult` → `export type SubmitResult`).

**QUAN TRỌNG — thực hiện ngay sửa nếu lỗi trên:** Mở `src/app/exercises/[id]/ExerciseEngineClient.tsx`, tại line 62 đổi `type SubmitResult = {` → `export type SubmitResult = {`. Chạy lại `npx tsc --noEmit`. Expected: 0 error. (Plan ghi trước: `SubmitResult` phải export vì component import nó. Nếu Task 4 chưa export thì sửa ở đây.)

- [ ] **Step 3: Checkpoint review với user**

Báo user: `ExerciseSummaryScreen.tsx` tạo done, tsc pass. Review rồi tiếp Task 6 (engine integrate — task cuối code).

---

## Task 6: Engine integrate — render component, xóa inline block

**Files:**
- Modify: `src/app/exercises/[id]/ExerciseEngineClient.tsx:1065-1156` (thay inline `isFinished` block) + `:1-10` (import component)

- [ ] **Step 1: Import `ExerciseSummaryScreen` vào engine**

Mở `src/app/exercises/[id]/ExerciseEngineClient.tsx`. Tại block import đầu file (line 1-10), thêm import sau `import ListenFeedbackSheet from "./ListenFeedbackSheet";` (line 10):
```ts
import ListenFeedbackSheet from "./ListenFeedbackSheet";
import ExerciseSummaryScreen from "./ExerciseSummaryScreen";
```

- [ ] **Step 2: Thay inline `isFinished` block bằng component**

Cùng file, thay toàn bộ block `if (isFinished) {...}` (line 1065-1156):
```tsx
  if (isFinished) {
    const correctCount = questions.length - incorrectQuestions.length;
    const percent = Math.round((correctCount / questions.length) * 100);
    void percent; // giữ nguyên local percent để logic xóa sạch (submitResult.exerciseScore là nguồn chính)

    if (!submitResult) {
      return (
        <div className="flex min-h-screen flex-col items-center bg-neutral-50 p-6 sm:p-8">
          <Card className="w-full max-w-2xl space-y-8 p-8 text-center sm:p-12">
            <p className="text-lg font-bold text-neutral-700">
              {submitStatus === "error"
                ? submitError || "Không lưu được kết quả."
                : "Đang lưu kết quả..."}
            </p>
          </Card>
        </div>
      );
    }

    return (
      <ExerciseSummaryScreen
        exercise={exercise}
        submitResult={submitResult}
        incorrectQuestions={incorrectQuestions}
        submitStatus={submitStatus}
        submitError={submitError}
        onRetry={() => router.reload()}
        onExit={() => router.push("/learning_map")}
      />
    );
  }
```

**Lưu ý về `percent`/`void percent`:** Block cũ tính `correctCount`/`percent`/`isPassed` từ local score để hiển thị inline. Component mới dùng `submitResult.exerciseScore` (từ API) làm nguồn chính. Để xóa sạch code cũ mà không để biến unused (lint warning), dùng `void percent`. Nếu lint vẫn phàn nàn, xóa hẳn dòng `const correctCount` + `const percent` + `void percent` (chúng không còn được dùng). Ưu tiên xóa hẳn cho sạch — chọn xóa:

**Thay phiên (chọn cách này — sạch hơn):** Thay block `if (isFinished) {...}` bằng phiên bản không tính local percent:
```tsx
  if (isFinished) {
    if (!submitResult) {
      return (
        <div className="flex min-h-screen flex-col items-center bg-neutral-50 p-6 sm:p-8">
          <Card className="w-full max-w-2xl space-y-8 p-8 text-center sm:p-12">
            <p className="text-lg font-bold text-neutral-700">
              {submitStatus === "error"
                ? submitError || "Không lưu được kết quả."
                : "Đang lưu kết quả..."}
            </p>
          </Card>
        </div>
      );
    }

    return (
      <ExerciseSummaryScreen
        exercise={exercise}
        submitResult={submitResult}
        incorrectQuestions={incorrectQuestions}
        submitStatus={submitStatus}
        submitError={submitError}
        onRetry={() => router.reload()}
        onExit={() => router.push("/learning_map")}
      />
    );
  }
```
(Dùng phiên bản này — không tính `correctCount`/`percent`/`isPassed` vì component dùng `submitResult.exerciseScore`. Xóa ~91 dòng inline cũ.)

**Edge case guard `if (!submitResult)`:** Khi `isFinished` true nhưng submit đang `submitting`/`error` (chưa có result), component nhận `submitResult: SubmitResult` (non-null theo type) → không an toàn. Guard `if (!submitResult)` render fallback đơn giản. Đây là edge case spec section 8 ("submitStatus === error → giữ box lỗi"). Khi `submitResult` null + status error → fallback hiện lỗi; khi submitting → "Đang lưu...". Khi `submitResult` có → component xử lý status submitting/error/success bên trong (tầng 2).

- [ ] **Step 3: Xóa import không còn dùng (nếu có)**

Sau khi xóa block inline, kiểm tra các import engine không còn dùng:
- `ProgressBar` — vẫn dùng ở header (line 1186, 1188) → **giữ**.
- `Card` — vẫn dùng ở block `questions.length === 0` (line 1054) và fallback `!submitResult` → **giữ**.
- `Button` — vẫn dùng ở block `questions.length === 0` (line 1057) → **giữ**.

(Không cần xóa import nào — tất cả vẫn dùng.)

- [ ] **Step 4: Verify tsc không lỗi**

```bash
npx tsc --noEmit
```
Expected: 0 error. Nếu lỗi `submitResult` possibly null → guard `if (!submitResult)` đã xử lý (sau guard, TS narrow `submitResult` non-null trong block return component).

- [ ] **Step 5: Checkpoint review với user**

Báo user: engine integrate done, ~91 dòng inline thay bằng component, tsc pass. Review rồi tiếp Task 7 (quality gate).

---

## Task 7: Quality gate — tsc + test + build

**Files:** None (verification only)

**Context:** Spec section 8 yêu cầu `prisma validate` + `tsc --noEmit` + `npm test` + `npm run build` pass. Plan KHÔNG đụng `prisma/schema.prisma` (Task 3 chỉ thêm select field có sẵn, không thêm field) → bỏ `prisma validate`. Giữ tsc + test + build.

- [ ] **Step 1: Chạy tsc full**

```bash
npx tsc --noEmit
```
Expected: 0 error.

- [ ] **Step 2: Chạy test suite**

```bash
npm test
```
Expected: ALL pass. `confetti.test.ts` (2 test mới) + các test cũ (`sfx`, `scoring`, `gamification`, `useComboStreak`, `auth-redirect`, `lesson-catalog`, `lesson-content`, `listen-choose-builder`). Không regression.

- [ ] **Step 3: Chạy build**

```bash
npm run build
```
Expected: Build thành công (Next.js 16 production build). Không lỗi import `canvas-confetti` (lazy import → chỉ load client-side). Nếu build warn về `canvas-confetti` dynamic import → OK (lazy import là chủ ý).

- [ ] **Step 4: Checkpoint final review với user**

Báo user: SP2 implementation hoàn tất. Quality gate pass (tsc 0 error, all tests pass, build OK). Tổng kết files tạo/sửa. User review + commit khi convenient.

---

## Self-Review

### 1. Spec coverage
- **Spec section 1 (hiện trạng):** Plan Task 4+6 đối ứng "engine ~1236 dòng → tách summary screen". ✓
- **Spec section 2 (khoảng trống):** Confetti = Task 1+2. previousBestScore expose = Task 3. streak expose = Task 3 (read-only, không update — khớp spec "KHÔNG update streak"). tada = Task 5 (tái dụng `playSfx("tada")`). ✓
- **Spec section 3 (hướng A, 5 đơn vị):** confetti.ts = Task 2. ExerciseSummaryScreen = Task 5. submit API expose = Task 3. SubmitResult mở rộng = Task 4. confetti test = Task 2. ✓
- **Spec section 4 (API expose):** Task 3 thêm `previousBestScore` + `streak{count,longest}`. Plan dùng `user.streakCount` (improvement vs spec `result.updatedUser.streakCount` — đã ghi note, vì streak không update). ✓
- **Spec section 5 (confetti wrapper):** Task 2, lazy import (improvement đã note), `prefersReducedMotion` export để test. ✓
- **Spec section 6 (3-tier):** Task 5 tầng 1 (khen+ring+confetti/tada), tầng 2 (3 card+bias), tầng 3 (lỗi+replay+2 nút). Props khớp spec. ✓
- **Spec section 7 (engine integrate):** Task 6 mở rộng type + export + render component. ✓
- **Spec section 8 (edge cases):**
  - `previousBestScore === null` → ẩn bias (Task 5 `progressBias !== null`). ✓
  - `streak.count === 0` → "Chưa có streak" (Task 5). ✓
  - `badgesAwarded` rỗng → "Chưa có badge mới" (Task 5). ✓
  - `submitStatus === "error"` → box lỗi (Task 5 + guard Task 6). ✓
  - `incorrectQuestions` rỗng → ẩn tầng 3 list, vẫn 2 nút (Task 5 `incorrectQuestions.length > 0`). ✓
  - prefers-reduced-motion → skip confetti, tada vẫn phát (Task 2 skip confetti only; `playSfx("tada")` độc lập — tada respect `isSfxMuted()` chứ không respect reduce-motion. Spec nói "tada sound vẫn phát" → khớp). ✓
- **Spec section 9 (files):** 6 entries khớp Task 1-6. ✓
- **Spec section 10 (rủi ro):** canvas-confetti dep = Task 1. previousBestAttempt tên biến = Task 3 dùng đúng `previousBestAttempt` (route line 132). streak 0 graceful = Task 5. engine 1236 dòng = Task 6 tách. confetti perf = Task 2 particleCount thấp + reduce-motion skip. router.reload = Task 6 `onRetry`. ✓

**Gap phát hiện & xử lý:**
- Spec không nói client `SubmitResult` thiếu `badgesAwarded` → Plan Task 4 thêm cả 3 field (badgesAwarded + previousBestScore + streak). Đã ghi rõ.
- Spec không nói `ExerciseData`/`IncorrectQuestion`/`SubmitResult` cần export → Plan Task 4 export 3 type. Task 5 Step 2 ghi guard `SubmitResult` export nếu tsc lỗi.
- Spec line ref `route.ts:262-305` / `:132-144` / `:91-98` — Plan verify actual line numbers (91-98, 132-144, 262-307) khớp.

### 2. Placeholder scan
- Không có "TBD"/"TODO"/"implement later".
- Mỗi step code có code block đầy đủ (Task 2 confetti.ts + test, Task 3 select + response, Task 4 type, Task 5 component, Task 6 integrate).
- Task 5 component ~250 dòng hoàn chỉnh, không placeholder.
- Task 6 có 2 phiên bản block thay thế — chọn phiên bản "sạch hơn" (không tính local percent), ghi rõ lý do. Không ambiguous.

### 3. Type consistency
- `SubmitResult` (Task 4) = `badgesAwarded: Array<{id,name,type}>` khớp `BadgeAward` (`gamification.ts:29-33`) + API response (`route.ts:297` `result.badgesAwarded`). ✓
- `previousBestScore: number | null` khớp API `previousBestAttempt?.score ?? null` (score là number). ✓
- `streak: {count: number; longest: number}` khớp API `streak: {count: user.streakCount, longest: user.longestStreak}` (streakCount/longestStreak = `Int`). ✓
- `ExerciseSummaryScreenProps` (Task 5) dùng `SubmitResult`/`IncorrectQuestion`/`ExerciseData` export từ engine (Task 4). ✓
- `praiseByRating`/`ringColorByRating` switch theo `rating: string` (API trả string). ✓
- `playSfx("tada")` — `tada` là `SfxName` (`sfx.ts:6`). ✓
- `celebrate()` import từ `lib/confetti` (Task 2 export). ✓
- Engine `onRetry={() => router.reload()}` / `onExit={() => router.push("/learning_map")}` khớp props type `() => void`. ✓

No type drift found.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-19-sp2-summary-redesign.md`. Two execution options:

**1. Subagent-Driven (recommended)** — Tôi dispatch fresh subagent per task, review giữa các task, iteration nhanh. Phù hợp vì 7 task có dependency tuần tự (Task 1→2→3→4→5→6→7) nhưng mỗi task self-contained.

**2. Inline Execution** — Execute tasks trong session này bằng executing-plans, batch execution với checkpoint review.

**Git policy:** Engineer không tự commit (user handles). Mỗi task kết thúc checkpoint review với user.

Which approach?
