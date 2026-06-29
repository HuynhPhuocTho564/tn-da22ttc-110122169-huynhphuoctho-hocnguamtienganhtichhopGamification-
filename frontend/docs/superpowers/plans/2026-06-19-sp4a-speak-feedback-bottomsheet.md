# SP4a-followup 2: Speak Feedback Bottom Sheet Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace inline layout-shift feedback in 3 speak components (speak_word / speak_sentence / speak_minimal_pairs) with a fixed bottom-sheet overlay (Persistent Contextual Bottom Sheet — Duolingo pattern), eliminating the giật khung hình (layout shift) bug.

**Architecture:** New `SpeakFeedbackSheet` component (fixed `bottom-0`, slide-up entrance, `border-t-4` + `shadow-2xl` layer separation) driven by props (`isCorrect`, `transcript`, `answerText`, `audioReplay` render prop, `onRetry`, `onNext`). The 3 speak components delete their inline `correct`/`incorrect` blocks and render `<SpeakFeedbackSheet>` instead, keeping the IPA/word/audio card content untouched above. `ListenFeedbackSheet` (luyện tai) is NOT modified — it already follows this pattern.

**Tech Stack:** Next.js 14 (app router), React 18, TypeScript, Tailwind CSS. No new dependencies.

**Spec:** `docs/superpowers/specs/2026-06-19-sp4a-speak-feedback-bottomsheet-design.md`

---

## File Structure

| File | Action | Responsibility |
|---|---|---|
| `frontend/src/app/exercises/[id]/SpeakFeedbackSheet.tsx` | **Create** | Bottom-sheet overlay component (slide-up, props-driven, 2 buttons). |
| `frontend/src/app/exercises/[id]/SpeakWordQuestion.tsx` | Modify | Delete inline correct/incorrect blocks (lines 190-234), render sheet. |
| `frontend/src/app/exercises/[id]/SpeakSentenceQuestion.tsx` | Modify | Delete inline correct/incorrect blocks (lines 177-213), render sheet. |
| `frontend/src/app/exercises/[id]/SpeakMinimalPairsQuestion.tsx` | Modify | Replace correct/incorrect ternary branches (lines 226-254) with sheet render. |
| `frontend/src/app/exercises/[id]/ListenFeedbackSheet.tsx` | NOT modified | Luyện tai already correct pattern — avoid regression. |
| `frontend/src/hooks/useWaveformRecorder.ts` | NOT modified | Waveform unrelated to feedback sheet. |

**Working-tree note for engineer:** The 3 speak files already have uncommitted waveform-container fixes (container always rendered). This plan builds on that current state. Do NOT revert those fixes. Verify by reading the files before editing — line numbers below match the current (post-waveform-fix) state.

---

## Task 1: Create `SpeakFeedbackSheet` component

**Files:**
- Create: `frontend/src/app/exercises/[id]/SpeakFeedbackSheet.tsx`

- [ ] **Step 1: Create the component file**

Create `frontend/src/app/exercises/[id]/SpeakFeedbackSheet.tsx` with this exact content:

```tsx
"use client";

import { useEffect, useState } from "react";

export type SpeakFeedbackSheetProps = {
  isCorrect: boolean;
  transcript: string;
  answerText: string;
  retryLabel?: string;
  audioReplay?: React.ReactNode;
  onRetry: () => void;
  onNext: () => void;
};

// Bottom-sheet feedback overlay (Persistent Contextual Bottom Sheet — Duolingo pattern).
// Cố định đáy, slide-up entrance, overlay (không đẩy content card).
// Dùng chung cho 3 dạng speak (word / sentence / minimal_pairs).
export default function SpeakFeedbackSheet({
  isCorrect,
  transcript,
  answerText,
  retryLabel,
  audioReplay,
  onRetry,
  onNext,
}: SpeakFeedbackSheetProps) {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    const r = requestAnimationFrame(() => setEntered(true));
    return () => cancelAnimationFrame(r);
  }, []);

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed bottom-0 left-0 right-0 z-50 max-h-[40vh] overflow-y-auto border-t-4 p-4 shadow-2xl transition-transform duration-300 sm:p-6 ${
        entered ? "translate-y-0" : "translate-y-full"
      } ${isCorrect ? "border-success-400 bg-success-50" : "border-error-400 bg-error-50"}`}
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-1 items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-xl font-black ${
              isCorrect ? "text-success-600" : "text-error-600"
            }`}
            aria-hidden="true"
          >
            {isCorrect ? "✓" : "✗"}
          </div>
          <div className="space-y-3">
            <h2 className={`text-2xl font-bold ${isCorrect ? "text-success-700" : "text-error-700"}`}>
              {isCorrect ? "Xuất sắc!" : "Chưa chính xác"}
            </h2>
            <p className="font-medium text-neutral-800">
              Bạn nói:{" "}
              <span className={`font-bold ${isCorrect ? "text-success-700" : "text-error-700"}`}>
                "{transcript || "Không rõ"}"
              </span>
              {!isCorrect && (
                <>
                  {" "}— đáp án:{" "}
                  <span className="font-bold text-success-700">"{answerText}"</span>
                </>
              )}
            </p>
            {!isCorrect && audioReplay}
          </div>
        </div>
        <div className="flex gap-2 sm:mt-2">
          {!isCorrect && (
            <button
              type="button"
              onClick={onRetry}
              className="rounded-xl border-2 border-error-300 bg-white px-6 py-4 font-bold text-error-700 transition-colors hover:bg-error-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-error-300"
            >
              🔄 {retryLabel ?? "Thử lại"}
            </button>
          )}
          <button
            type="button"
            onClick={onNext}
            className={`rounded-xl px-8 py-4 text-lg font-bold text-white transition-colors focus:outline-none focus-visible:ring-4 ${
              isCorrect
                ? "bg-success-600 hover:bg-success-700 focus-visible:ring-success-300"
                : "bg-error-600 hover:bg-error-700 focus-visible:ring-error-300"
            }`}
          >
            Tiếp theo →
          </button>
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify type-check passes**

Run:
```bash
cd english_pronunciation_app/frontend && npx tsc --noEmit
```
Expected: 0 errors. (Component is self-contained — not yet imported anywhere, so no integration errors.)

- [ ] **Step 3: Commit**

```bash
git add english_pronunciation_app/frontend/src/app/exercises/[id]/SpeakFeedbackSheet.tsx
git commit -m "SP4a-followup2: add SpeakFeedbackSheet bottom-sheet component"
```

---

## Task 2: Integrate `SpeakFeedbackSheet` into `SpeakWordQuestion`

**Files:**
- Modify: `frontend/src/app/exercises/[id]/SpeakWordQuestion.tsx`

- [ ] **Step 1: Add the import**

Open `frontend/src/app/exercises/[id]/SpeakWordQuestion.tsx`. At the top, after the existing imports (lines 3-5), add:

```tsx
import SpeakFeedbackSheet from "./SpeakFeedbackSheet";
```

Place it as the last import line (after `useWaveformRecorder` import on line 5).

- [ ] **Step 2: Delete the inline `correct` block**

Delete the entire block from line 190 through line 205 — the `{status === "correct" && (...)}` block (the 🎉 + "Xuất sắc!" + transcript + "Tiếp theo →" button).

Exact text to remove:
```tsx
        {status === "correct" && (
          <div className="space-y-4">
            <div className="text-center text-6xl">🎉</div>
            <div className="rounded-xl border-2 border-success-300 bg-success-50 p-6 text-center">
              <h3 className="text-2xl font-black text-success-700">Xuất sắc!</h3>
              <p className="mt-2 text-sm text-neutral-600">Bạn nói:</p>
              <p className="text-xl font-bold text-success-700">"{transcript}"</p>
              <p className="mt-1 text-sm text-neutral-600">Đáp án:</p>
              <p className="text-lg font-semibold text-neutral-800">"{question.answer}"</p>
            </div>
            <button type="button" onClick={() => onNext(true, transcript)}
              className="w-full rounded-xl bg-success-600 px-8 py-4 text-lg font-bold text-white hover:bg-success-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-success-300">
              Tiếp theo →
            </button>
          </div>
        )}
```

- [ ] **Step 3: Delete the inline `incorrect` block**

Delete the entire block that immediately followed — the `{status === "incorrect" && (...)}` block (the 😐 + "Chưa chính xác" + retry/skip buttons). This was lines 207-234.

Exact text to remove:
```tsx
        {status === "incorrect" && (
          <div className="space-y-4">
            <div className="text-center text-5xl">😐</div>
            <div className="rounded-xl border-2 border-error-300 bg-error-50 p-6 text-center">
              <h3 className="text-xl font-bold text-error-700">Chưa chính xác</h3>
              {retryCount > 0 && <p className="mt-1 text-sm text-neutral-500">Lần thử: {retryCount + 1}</p>}
              <p className="mt-2 text-sm text-neutral-600">Bạn nói:</p>
              <p className="text-xl font-bold text-error-700">"{transcript || "Không rõ"}"</p>
              <p className="mt-1 text-sm text-neutral-600">Đáp án đúng:</p>
              <p className="text-lg font-semibold text-neutral-800">"{question.answer}"</p>
            </div>
            {contentData.hint && (
              <div className="rounded-xl border-2 border-primary-200 bg-primary-50 p-4 text-center">
                <p className="text-sm font-semibold text-primary-800">💡 {contentData.hint}</p>
              </div>
            )}
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={startRecording}
                className="rounded-xl border-2 border-primary-300 bg-primary-50 px-6 py-4 font-bold text-primary-700 hover:bg-primary-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-300">
                🔄 Thử lại
              </button>
              <button type="button" onClick={() => onNext(false, transcript)}
                className="rounded-xl border-2 border-neutral-300 bg-white px-6 py-4 font-bold text-neutral-600 hover:bg-neutral-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-neutral-300">
                Bỏ qua →
              </button>
            </div>
          </div>
        )}
```

- [ ] **Step 4: Insert the sheet render**

In the same location where the two blocks were (after the `status === "error"` block closing `)}`, before the card's closing `</div>` on the original line 235), insert:

```tsx
        {(status === "correct" || status === "incorrect") && (
          <SpeakFeedbackSheet
            isCorrect={status === "correct"}
            transcript={transcript}
            answerText={question.answer}
            audioReplay={<AudioButton audioUrl={contentData.audioUrl} label="🔊 Nghe lại mẫu" />}
            onRetry={startRecording}
            onNext={() => onNext(status === "correct", transcript)}
          />
        )}
```

**Note on `hint`:** The old incorrect block showed `contentData.hint`. The sheet does NOT show hint (spec section 2 — sheet keeps it minimal: transcript + answer + replay + buttons). If you want to preserve hint display, it can be added to `audioReplay` node later — but per approved spec, omit it now.

- [ ] **Step 5: Verify type-check + build + tests**

Run:
```bash
cd english_pronunciation_app/frontend && npx tsc --noEmit && npm run build && npm test
```
Expected: tsc 0 errors; build success; 62/62 tests pass (no new tests; smoke test is manual in Task 5).

- [ ] **Step 6: Commit**

```bash
git add english_pronunciation_app/frontend/src/app/exercises/[id]/SpeakWordQuestion.tsx
git commit -m "SP4a-followup2: SpeakWordQuestion uses bottom-sheet feedback (no layout shift)"
```

---

## Task 3: Integrate `SpeakFeedbackSheet` into `SpeakSentenceQuestion`

**Files:**
- Modify: `frontend/src/app/exercises/[id]/SpeakSentenceQuestion.tsx`

- [ ] **Step 1: Add the import**

Open `frontend/src/app/exercises/[id]/SpeakSentenceQuestion.tsx`. After line 6 (`import { calculateWordOverlapAccuracy } from "@/lib/scoring";`), add:

```tsx
import SpeakFeedbackSheet from "./SpeakFeedbackSheet";
```

- [ ] **Step 2: Delete the inline `correct` block**

Delete the entire `{status === "correct" && (...)}` block — originally lines 177-190.

Exact text to remove:
```tsx
        {status === "correct" && (
          <div className="space-y-4">
            <div className="text-center text-6xl">🎉</div>
            <div className="rounded-xl border-2 border-success-300 bg-success-50 p-6 text-center">
              <h3 className="text-2xl font-black text-success-700">Xuất sắc!</h3>
              <p className="mt-2 text-sm text-neutral-600">Bạn nói:</p>
              <p className="text-lg font-bold text-success-700">"{transcript}"</p>
            </div>
            <button type="button" onClick={() => onNext(true, transcript)}
              className="w-full rounded-xl bg-success-600 px-8 py-4 text-lg font-bold text-white hover:bg-success-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-success-300">
              Tiếp theo →
            </button>
          </div>
        )}
```

- [ ] **Step 3: Delete the inline `incorrect` block**

Delete the entire `{status === "incorrect" && (...)}` block — originally lines 192-213.

Exact text to remove:
```tsx
        {status === "incorrect" && (
          <div className="space-y-4">
            <div className="text-center text-5xl">😐</div>
            <div className="rounded-xl border-2 border-error-300 bg-error-50 p-6 text-center">
              <h3 className="text-xl font-bold text-error-700">Chưa chính xác</h3>
              <p className="mt-2 text-sm text-neutral-600">Bạn nói:</p>
              <p className="text-lg font-bold text-error-700">"{transcript || "Không rõ"}"</p>
              <p className="mt-1 text-sm text-neutral-600">Đáp án đúng:</p>
              <p className="text-lg font-semibold text-neutral-800">"{question.answer}"</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button type="button" onClick={startRecording}
                className="rounded-xl border-2 border-accent-300 bg-accent-50 px-6 py-4 font-bold text-accent-700 hover:bg-accent-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-accent-300">
                🔄 Thử lại
              </button>
              <button type="button" onClick={() => onNext(false, transcript)}
                className="rounded-xl border-2 border-neutral-300 bg-white px-6 py-4 font-bold text-neutral-600 hover:bg-neutral-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-neutral-300">
                Bỏ qua →
              </button>
            </div>
          </div>
        )}
```

- [ ] **Step 4: Insert the sheet render**

In the location where the two blocks were (after the `status === "error"` block closing `)}`, before the card's closing `</div>`), insert:

```tsx
        {(status === "correct" || status === "incorrect") && (
          <SpeakFeedbackSheet
            isCorrect={status === "correct"}
            transcript={transcript}
            answerText={question.answer}
            audioReplay={
              <button
                type="button"
                onClick={() => playSentence(question.answer)}
                aria-label="Nghe lại câu mẫu"
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-accent-200 bg-accent-50 px-4 py-2 text-sm font-bold text-accent-700 transition-colors hover:bg-accent-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-accent-500"
              >
                🎧 Nghe lại câu mẫu
              </button>
            }
            onRetry={startRecording}
            onNext={() => onNext(status === "correct", transcript)}
          />
        )}
```

`playSentence` is already defined at the top of the file (lines 28-37) — reused as-is.

- [ ] **Step 5: Verify type-check + build + tests**

Run:
```bash
cd english_pronunciation_app/frontend && npx tsc --noEmit && npm run build && npm test
```
Expected: tsc 0 errors; build success; 62/62 tests pass.

- [ ] **Step 6: Commit**

```bash
git add english_pronunciation_app/frontend/src/app/exercises/[id]/SpeakSentenceQuestion.tsx
git commit -m "SP4a-followup2: SpeakSentenceQuestion uses bottom-sheet feedback (no layout shift)"
```

---

## Task 4: Integrate `SpeakFeedbackSheet` into `SpeakMinimalPairsQuestion`

**Files:**
- Modify: `frontend/src/app/exercises/[id]/SpeakMinimalPairsQuestion.tsx`

This file's check/results section is a ternary (lines 221-255): `idle`/`processing` → check button; `correct` → inline block; else (incorrect) → inline block. We keep the `idle`/`processing` branch and replace the `correct`/`incorrect` branches with sheet render.

- [ ] **Step 1: Add the import**

Open `frontend/src/app/exercises/[id]/SpeakMinimalPairsQuestion.tsx`. After line 5 (`import { useWaveformRecorder, type RecorderLevel } from "@/hooks/useWaveformRecorder";`), add:

```tsx
import SpeakFeedbackSheet from "./SpeakFeedbackSheet";
```

- [ ] **Step 2: Replace the `correct` and `incorrect` ternary branches**

The current structure (lines 221-255) is:

```tsx
        {overallStatus === "idle" || overallStatus === "processing" ? (
          <button type="button" onClick={checkBothAnswers} disabled={!canCheck || overallStatus === "processing"}
            className="w-full rounded-xl border-2 border-warning-500 bg-warning-500 px-8 py-5 text-xl font-black uppercase tracking-widest text-white transition-all hover:bg-warning-600 hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-warning-300 disabled:cursor-not-allowed disabled:opacity-50">
            {overallStatus === "processing" ? "⏳ Đang kiểm tra..." : canCheck ? "✓ Kiểm tra kết quả" : "⚠️ Hãy đọc cả 2 từ"}
          </button>
        ) : overallStatus === "correct" ? (
          <div className="space-y-6 text-center">
            <div className="text-7xl">🎉</div>
            <h3 className="text-3xl font-black text-success-600">Xuất sắc!</h3>
            <p className="text-neutral-600">Bạn đã phân biệt đúng 2 từ</p>
            <button type="button" onClick={() => onNext(true, combinedTranscript)}
              className="rounded-xl border-2 border-success-500 bg-success-500 px-10 py-4 text-lg font-bold text-white hover:bg-success-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-success-300">
              Tiếp theo →
            </button>
          </div>
        ) : (
          <div className="space-y-6 text-center">
            <div className="text-6xl">😐</div>
            <h3 className="text-2xl font-black text-error-600">Chưa chính xác</h3>
            <div className="rounded-xl border-2 border-error-300 bg-error-50 p-5">
              <p className="text-sm font-semibold text-neutral-600">Đáp án đúng:</p>
              <p className="mt-2 text-xl font-bold text-neutral-900">{pairs[0].word} & {pairs[1].word}</p>
            </div>
            <div className="flex flex-col justify-center gap-4 sm:flex-row">
              <button type="button" onClick={() => { setOverallStatus("idle"); setStatuses(["idle", "idle"]); setTranscripts(["", ""]); recorder0.reset(); recorder1.reset(); }}
                className="rounded-xl border-2 border-primary-400 bg-primary-500 px-8 py-4 font-bold text-white hover:bg-primary-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-300">
                🔄 Làm lại
              </button>
              <button type="button" onClick={() => onNext(false, combinedTranscript)}
                className="rounded-xl border-2 border-neutral-300 bg-white px-8 py-4 font-bold text-neutral-600 hover:bg-neutral-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-neutral-300">
                Bỏ qua →
              </button>
            </div>
          </div>
        )}
```

Replace the **entire** block above with:

```tsx
        {overallStatus === "idle" || overallStatus === "processing" ? (
          <button type="button" onClick={checkBothAnswers} disabled={!canCheck || overallStatus === "processing"}
            className="w-full rounded-xl border-2 border-warning-500 bg-warning-500 px-8 py-5 text-xl font-black uppercase tracking-widest text-white transition-all hover:bg-warning-600 hover:shadow-lg focus:outline-none focus-visible:ring-4 focus-visible:ring-warning-300 disabled:cursor-not-allowed disabled:opacity-50">
            {overallStatus === "processing" ? "⏳ Đang kiểm tra..." : canCheck ? "✓ Kiểm tra kết quả" : "⚠️ Hãy đọc cả 2 từ"}
          </button>
        ) : (
          <SpeakFeedbackSheet
            isCorrect={overallStatus === "correct"}
            transcript={combinedTranscript}
            answerText={`${pairs[0].word} & ${pairs[1].word}`}
            retryLabel="Làm lại cả 2"
            audioReplay={
              <div className="flex flex-wrap items-center gap-2">
                <AudioButton audioUrl={pairs[0].audioUrl} label={`🔊 ${pairs[0].word}`} />
                <AudioButton audioUrl={pairs[1].audioUrl} label={`🔊 ${pairs[1].word}`} />
              </div>
            }
            onRetry={() => {
              setOverallStatus("idle");
              setStatuses(["idle", "idle"]);
              setTranscripts(["", ""]);
              recorder0.reset();
              recorder1.reset();
            }}
            onNext={() => onNext(overallStatus === "correct", combinedTranscript)}
          />
        )}
```

**Key changes:**
- Removed the separate `overallStatus === "correct" ?` branch — collapsed into a single `else` (any non-idle/processing status renders the sheet).
- `retryLabel="Làm lại cả 2"` (was "Làm lại" / inline) — clear that both words reset.
- `audioReplay` = 2 `AudioButton` (one per word) — `AudioButton` is already defined at lines 60-72.
- `onRetry` preserves the exact reset logic from the old "Làm lại" button (lines 245).
- The 2-column card above (lines 168-218) stays untouched — user sees both words + IPA for comparison while the sheet overlays.

- [ ] **Step 3: Verify type-check + build + tests**

Run:
```bash
cd english_pronunciation_app/frontend && npx tsc --noEmit && npm run build && npm test
```
Expected: tsc 0 errors; build success; 62/62 tests pass.

- [ ] **Step 4: Commit**

```bash
git add english_pronunciation_app/frontend/src/app/exercises/[id]/SpeakMinimalPairsQuestion.tsx
git commit -m "SP4a-followup2: SpeakMinimalPairsQuestion uses bottom-sheet feedback (no layout shift)"
```

---

## Task 5: Quality gate + manual smoke test

**Files:** none (verification only)

- [ ] **Step 1: Full quality gate**

Run:
```bash
cd english_pronunciation_app/frontend && npx tsc --noEmit && npm run build && npm test
```
Expected: tsc 0 errors; build success (24/24 static pages); 62/62 tests pass, 0 fail.

- [ ] **Step 2: Manual smoke test (mic + real browser — engineer or user runs this)**

Start dev server if not running:
```bash
cd english_pronunciation_app/frontend && npm run dev
```
Hard-refresh browser (Ctrl+Shift+R) to clear cache. Test each speak mode:

**speak_word (luyện miệng):**
- [ ] Enter a speak_word exercise. IPA + masked word + 🔊 Nghe mẫu show at top.
- [ ] Press 🎤, say a word, stop.
- [ ] On CORRECT: bottom sheet slides up from bottom (green, ✓ "Xuất sắc!", "Bạn nói: ...", single "Tiếp theo →" button). The IPA/word/audio card above does NOT shift.
- [ ] On INCORRECT: bottom sheet slides up (red, ✗ "Chưa chính xác", "Bạn nói: X — đáp án: Y", "🔊 Nghe lại mẫu" button + "🔄 Thử lại" + "Tiếp theo →"). Card above does NOT shift.
- [ ] Press "Thử lại" → sheet disappears → mic reappears → record again (old waveform cleared).
- [ ] Press "Tiếp theo" → sheet disappears → next question mounts idle.

**speak_sentence (thực chiến):**
- [ ] Enter a speak_sentence exercise. Masked sentence + 🎧 Nghe mẫu câu at top.
- [ ] Record correct → green sheet, single "Tiếp theo →".
- [ ] Record incorrect → red sheet, "🎧 Nghe lại câu mẫu" button (plays speechSynthesis) + "Thử lại" + "Tiếp theo". Card above does NOT shift.

**speak_minimal_pairs (thử thách kép):**
- [ ] Enter a speak_minimal_pairs exercise. 2 columns (IPA + masked word + 🔊 + 🎤) at top.
- [ ] Record both words, press "Kiểm tra kết quả".
- [ ] On CORRECT: green sheet, "Bạn nói: ...", single "Tiếp theo →". 2 columns stay visible above (no shift).
- [ ] On INCORRECT: red sheet, "Bạn nói: X — đáp án: word1 & word2", 2 "🔊" buttons (one per word) + "🔄 Làm lại cả 2" + "Tiếp theo →". 2 columns stay visible.
- [ ] Press "Làm lại cả 2" → sheet disappears → both columns reset to idle → record again.
- [ ] Press "Tiếp theo" → sheet disappears → next question.

- [ ] **Step 3: Report smoke test results**

Report to the user which checklist items passed/failed. If any failed, note the exact symptom (e.g. "sheet covers audio button on minimal_pairs when both columns long") for debugging. Do NOT claim success without running the gate + smoke test.

---

## Self-Review

**1. Spec coverage:**
- Spec §2 (SpeakFeedbackSheet component + props) → Task 1. ✓
- Spec §3 (mockup + flow) → Tasks 2-4 (integrate) + Task 5 (smoke test verifies flow). ✓
- Spec §4 (integrate 3 components, line references) → Tasks 2, 3, 4. ✓
- Spec §5 (animation slide-up + edge cases) → Task 1 (rAF entrance) + Task 5 (smoke test covers transcript-empty, audioReplay-undefined via real audio). ✓
- Spec §6 (test design — smoke 7 steps) → Task 5 Step 2. ✓
- Spec §7 (files table) → File Structure section. ✓
- Spec §8 (rủi ro: sheet covers content, color consistency, exit anim, z-50) → Task 5 smoke test covers sheet-covers-content; others are noted risks (no action needed in plan). ✓
- Spec §9 (defer) → respected (ListenFeedbackSheet untouched, no refactor, no exit anim). ✓

**2. Placeholder scan:** No "TBD", "TODO", "implement later", "add error handling", "similar to Task N". Every step has full code or exact text to remove. ✓

**3. Type consistency:**
- `SpeakFeedbackSheetProps` defined in Task 1 (isCorrect, transcript, answerText, retryLabel?, audioReplay?, onRetry, onNext) — used identically in Tasks 2, 3, 4. ✓
- `audioReplay?: React.ReactNode` — Task 2 injects `<AudioButton>`, Task 3 injects `<button>` (speechSynthesis), Task 4 injects `<div>` with 2 `<AudioButton>`. All valid React nodes. ✓
- `onRetry` / `onNext` signatures: `() => void` — Task 2/3 pass `startRecording` (returns void) / arrow calling `onNext(bool, string)`; Task 4 passes arrow with reset logic / arrow calling `onNext`. ✓
- `retryLabel` default "Thử lại" (Task 1) — Task 4 overrides "Làm lại cả 2". ✓
- `AudioButton` (word/minimal_pairs) and `playSentence` (sentence) are pre-existing helpers reused — no new definitions needed. ✓

No issues found.
