# SP1 — Feedback trong lúc làm bài Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hệ thống feedback trong lúc làm — Lớp 1 (SFX ting/buzz + shake + color) + Lớp 3 (combo 🔥 + lời khen) cho **tất cả mode**; Lớp 2 (contrast comparison + IPA + nghĩa + 2 loa nghe so sánh) cho **Mode A (listen_choose)**. Tách SFX module + combo hook + feedback sheet ra file riêng (engine 1159 dòng → giảm độ phức tạp).

**Architecture:** Hướng A (module dùng chung + tách component): `lib/sfx.ts` (Web Audio oscillator, SP2 tái dùng `playTada`), `hooks/useComboStreak.ts` (combo + praise chung all mode), `ListenFeedbackSheet.tsx` (Lớp 2 Mode A, tách khỏi engine). Engine import lại, gọi `playSfx` + `combo` ở listen/voice handler, render 🔥 + mute button ở header. Seed nhỏ bake `option.audioUrl` vào content listen_choose (cho 2 loa nghe so sánh).

**Tech Stack:** Next.js 16, TypeScript 6, Tailwind 4, Web Audio API (oscillator, không file), node:test qua `tsx`. Runner: `tsx`. Test: `npm test`.

**Working directory:** `english_pronunciation_app/frontend/` (repo root `D:\01_Company_Work\Projects\Web_HoTroPhatAmEN`).

**Spec:** `docs/superpowers/specs/2026-06-18-sp1-in-exercise-feedback-design.md`

**Git:** User handles all commits. DO NOT commit/push/branch.

---

## File Structure

| Hành động | File | Trách nhiệm |
|---|---|---|
| Create | `src/lib/sfx.ts` | Web Audio oscillator — playCorrect/playWrong/playTada, mute localStorage, useSfxMuted hook |
| Create | `src/hooks/useComboStreak.ts` | combo counter + 🔥 milestone + lời khen ngẫu nhiên popup |
| Create | `src/app/exercises/[id]/ListenFeedbackSheet.tsx` | Lớp 2 Mode A — contrast + IPA + nghĩa + 2 loa nghe so sánh |
| Modify | `src/app/globals.css` | `@keyframes shake` + `.animate-shake` + prefers-reduced-motion |
| Modify | `src/app/exercises/[id]/ExerciseEngineClient.tsx` | header (🔥+mute), import sheet thay inline bottom sheet, playSfx ở handler, combo hook |
| Create | `prisma/seed_listen_choose_audio.ts` | bake option.audioUrl vào content listen_choose (copy từ WordItem DB, không re-fetch) |
| Create | `src/lib/__tests__/sfx.test.ts` | test mute/preference logic |
| Create | `src/hooks/__tests__/useComboStreak.test.ts` | test combo++/reset/milestone |

---

## Task 1: `lib/sfx.ts` — Web Audio oscillator (TDD)

**Files:**
- Create: `src/lib/sfx.ts`
- Test: `src/lib/__tests__/sfx.test.ts`

- [ ] **Step 1: Viết test thất bại**

Tạo `src/lib/__tests__/sfx.test.ts`:

```ts
import assert from "node:assert/strict";
import test, { beforeEach, afterEach } from "node:test";
import { isSfxMuted, setSfxMuted, SFX_KEY } from "../sfx";

// Mock localStorage cho node:test (không có trong node)
const store = new Map<string, string>();
const localStorageMock = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => store.set(k, v),
  removeItem: (k: string) => store.delete(k),
};
(globalThis as unknown as { localStorage: Storage }).localStorage = localStorageMock as unknown as Storage;

beforeEach(() => store.clear());
afterEach(() => store.clear());

test("isSfxMuted: default false khi localStorage trống", () => {
  assert.equal(isSfxMuted(), false);
});

test("setSfxMuted(true) → isSfxMuted true + lưu localStorage", () => {
  setSfxMuted(true);
  assert.equal(isSfxMuted(), true);
  assert.equal(store.get(SFX_KEY), "1");
});

test("setSfxMuted(false) → isSfxMuted false + localStorage '0'", () => {
  setSfxMuted(true); // set true trước
  setSfxMuted(false);
  assert.equal(isSfxMuted(), false);
  assert.equal(store.get(SFX_KEY), "0");
});
```

- [ ] **Step 2: Chạy test → fail (module missing)**

Run: `npm test`
Expected: FAIL — import `../sfx` error.

- [ ] **Step 3: Tạo `src/lib/sfx.ts`**

```ts
"use client";

import { useState, useCallback, useEffect } from "react";

export const SFX_KEY = "sfx_muted";
export type SfxName = "correct" | "wrong" | "tada";

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!audioCtx) {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    audioCtx = new Ctor();
  }
  return audioCtx;
}

export function isSfxMuted(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(SFX_KEY) === "1";
  } catch {
    return false;
  }
}

export function setSfxMuted(muted: boolean): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(SFX_KEY, muted ? "1" : "0");
  } catch {
    // ignore
  }
}

// Tone đơn với oscillator + envelope (fade in/out tránh click).
function playTone(freq: number, duration: number, type: OscillatorType, startOffset = 0): void {
  const ctx = getAudioContext();
  if (!ctx) return;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime + startOffset);
  const start = ctx.currentTime + startOffset;
  const end = start + duration;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(0.3, start + 0.01); // fade in nhanh
  gain.gain.exponentialRampToValueAtTime(0.001, end); // fade out
  osc.connect(gain);
  gain.connect(ctx.destination);
  osc.start(start);
  osc.stop(end);
}

export function playSfx(name: SfxName): void {
  if (isSfxMuted()) return;
  const ctx = getAudioContext();
  if (!ctx) return;
  // resume nếu suspended (autoplay policy)
  if (ctx.state === "suspended") void ctx.resume();

  switch (name) {
    case "correct":
      // ting: sine 880Hz, 0.15s
      playTone(880, 0.15, "sine");
      break;
    case "wrong":
      // buzz: sawtooth 180Hz, 0.2s
      playTone(180, 0.2, "sawtooth");
      break;
    case "tada":
      // arpeggio C5-E5-G5 (523, 659, 784), mỗi 0.12s
      playTone(523.25, 0.12, "sine", 0);
      playTone(659.25, 0.12, "sine", 0.12);
      playTone(783.99, 0.18, "sine", 0.24);
      break;
  }
}

// Hook cho nút mute ở header (re-render khi toggle).
export function useSfxMuted(): [boolean, (m: boolean) => void] {
  const [muted, setMutedState] = useState(false);

  useEffect(() => {
    setMutedState(isSfxMuted());
  }, []);

  const toggle = useCallback((m: boolean) => {
    setSfxMuted(m);
    setMutedState(m);
  }, []);

  return [muted, toggle];
}
```

- [ ] **Step 4: Chạy test → pass**

Run: `npm test`
Expected: PASS — 3 test sfx mới. Tổng ~47 (44 + 3).

- [ ] **Step 5: (KHÔNG commit)**

---

## Task 2: `hooks/useComboStreak.ts` — combo + praise (TDD)

**Files:**
- Create: `src/hooks/useComboStreak.ts`
- Test: `src/hooks/__tests__/useComboStreak.test.ts`

- [ ] **Step 1: Viết test thất bại**

Tạo `src/hooks/__tests__/useComboStreak.test.ts`:

```ts
import assert from "node:assert/strict";
import test from "node:test";
import {
  pickPraise,
  comboMilestoneLevel,
  type ComboState,
} from "../../hooks/useComboStreak";

test("pickPraise: trả về 1 trong danh sách lời khen", () => {
  const praises = ["Chính xác!", "Giỏi lắm!", "Rất tốt!", "Đỉnh quá!", "Bạn làm được rồi!"];
  const result = pickPraise();
  assert.ok(praises.includes(result), `${result} không trong danh sách`);
});

test("comboMilestoneLevel: combo 0-2 → 0 (chưa milestone)", () => {
  assert.equal(comboMilestoneLevel(0), 0);
  assert.equal(comboMilestoneLevel(2), 0);
});

test("comboMilestoneLevel: combo 3-4 → 1, 5-6 → 2, ≥7 → 3", () => {
  assert.equal(comboMilestoneLevel(3), 1);
  assert.equal(comboMilestoneLevel(4), 1);
  assert.equal(comboMilestoneLevel(5), 2);
  assert.equal(comboMilestoneLevel(6), 2);
  assert.equal(comboMilestoneLevel(7), 3);
  assert.equal(comboMilestoneLevel(10), 3);
});

test("nextComboState: đúng → combo+1, praise ở milestone", () => {
  // pure helper để test logic không cần React
  const state: ComboState = { combo: 2, praise: null };
  const next = nextComboStateOnCorrect(state);
  assert.equal(next.combo, 3);
  assert.ok(next.praise !== null, "milestone 3 phải có praise");
});

test("nextComboState: sai → combo 0, praise null", () => {
  const state: ComboState = { combo: 5, praise: "Giỏi lắm!" };
  const next = nextComboStateOnWrong(state);
  assert.equal(next.combo, 0);
  assert.equal(next.praise, null);
});
```

Lưu ý: cần export `pickPraise`, `comboMilestoneLevel`, `nextComboStateOnCorrect`, `nextComboStateOnWrong`, `ComboState` từ hook (pure functions để testable).

- [ ] **Step 2: Chạy test → fail**

Run: `npm test`
Expected: FAIL — import error.

- [ ] **Step 3: Tạo `src/hooks/useComboStreak.ts`**

```ts
"use client";

import { useState, useCallback } from "react";

const PRAISES = ["Chính xác!", "Giỏi lắm!", "Rất tốt!", "Đỉnh quá!", "Bạn làm được rồi!"];

export type ComboState = {
  combo: number;
  praise: string | null;
};

export function pickPraise(): string {
  return PRAISES[Math.floor(Math.random() * PRAISES.length)];
}

// Milestone level cho render 🔥: 0 (chưa), 1 (≥3), 2 (≥5), 3 (≥7).
export function comboMilestoneLevel(combo: number): 0 | 1 | 2 | 3 {
  if (combo >= 7) return 3;
  if (combo >= 5) return 2;
  if (combo >= 3) return 1;
  return 0;
}

// Pure helpers (testable không cần React).
export function nextComboStateOnCorrect(state: ComboState): ComboState {
  const nextCombo = state.combo + 1;
  const level = comboMilestoneLevel(nextCombo);
  const prevLevel = comboMilestoneLevel(state.combo);
  // praise chỉ khi vừa đạt milestone mới (level tăng)
  const praise = level > prevLevel ? pickPraise() : null;
  return { combo: nextCombo, praise };
}

export function nextComboStateOnWrong(state: ComboState): ComboState {
  return { combo: 0, praise: null };
}

export function useComboStreak(): {
  combo: number;
  praise: string | null;
  milestone: 0 | 1 | 2 | 3;
  onCorrect: () => void;
  onWrong: () => void;
  reset: () => void;
  clearPraise: () => void;
} {
  const [state, setState] = useState<ComboState>({ combo: 0, praise: null });

  const onCorrect = useCallback(() => {
    setState((s) => nextComboStateOnCorrect(s));
  }, []);

  const onWrong = useCallback(() => {
    setState((s) => nextComboStateOnWrong(s));
  }, []);

  const reset = useCallback(() => {
    setState({ combo: 0, praise: null });
  }, []);

  const clearPraise = useCallback(() => {
    setState((s) => ({ ...s, praise: null }));
  }, []);

  return {
    combo: state.combo,
    praise: state.praise,
    milestone: comboMilestoneLevel(state.combo),
    onCorrect,
    onWrong,
    reset,
    clearPraise,
  };
}
```

- [ ] **Step 4: Chạy test → pass**

Run: `npm test`
Expected: PASS — 5 test combo mới. Tổng ~52.

- [ ] **Step 5: (KHÔNG commit)**

---

## Task 3: Shake animation (globals.css)

**Files:**
- Modify: `src/app/globals.css` (thêm keyframe shake + reduced-motion guard)

- [ ] **Step 1: Thêm shake keyframe**

Tìm block `@keyframes blob` (khoảng dòng 242-256) hoặc block `@media (prefers-reduced-motion: reduce)` (dòng 263-272). Thêm sau đó (hoặc gần các keyframe khác):

```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-6px); }
  40%, 80% { transform: translateX(6px); }
}
.animate-shake {
  animation: shake 0.4s ease-in-out;
}
```

Và trong block `@media (prefers-reduced-motion: reduce)` thêm:
```css
  .animate-shake { animation: none; }
```

(nếu block reduced-motion đã disable tất cả `animation: none` cho `.animate-*` → đã cover, không cần thêm. Kiểm tra nội dung block trước.)

- [ ] **Step 2: (KHÔNG commit)**

---

## Task 4: `ListenFeedbackSheet.tsx` — Lớp 2 Mode A

**Files:**
- Create: `src/app/exercises/[id]/ListenFeedbackSheet.tsx`

Component tách bottom sheet (hiện tại inline `ExerciseEngineClient.tsx:1113-1158`). Props nhận question (content JSON có word/ipa/options[].audioUrl), contrast comparison, 2 loa nghe so sánh.

- [ ] **Step 1: Tạo component**

```tsx
"use client";

import { useMemo } from "react";
import Button from "@/components/ui/Button";
import { parseWordPrompt, type ExerciseQuestion } from "./ExerciseEngineClient";

type ListenFeedbackSheetProps = {
  isCorrect: boolean;
  selectedAnswer: string | null;
  question: ExerciseQuestion;
  hint: string;
  onAdvance: () => void;
};

// Âm thanh loa nhỏ để nghe lại 1 audioUrl.
function MiniSpeaker({ audioUrl, label }: { audioUrl?: string; label: string }) {
  if (!audioUrl) return null;
  const play = () => {
    const audio = new Audio(audioUrl);
    audio.play().catch((e) => console.warn("contrast audio failed:", e));
  };
  return (
    <button
      type="button"
      onClick={play}
      aria-label={label}
      className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-300 bg-white px-3 py-2 text-sm font-bold text-neutral-700 transition-colors hover:border-primary-300 hover:text-primary-700 disabled:opacity-40"
    >
      <span aria-hidden="true">🔊</span> {label}
    </button>
  );
}

export default function ListenFeedbackSheet({
  isCorrect,
  selectedAnswer,
  question,
  hint,
  onAdvance,
}: ListenFeedbackSheetProps) {
  const contentData = useMemo(() => parseWordPrompt(question.content), [question.content]);
  const isPhonemeMode = contentData.answerType === "phoneme";
  const displayWord = contentData.word
    ? contentData.word.charAt(0).toUpperCase() + contentData.word.slice(1)
    : "";
  const ipa = contentData.ipa ?? "";
  const meaning = ""; // best-effort: meaningVi chưa có trong content → để trống, ẩn nếu rỗng

  // Contrast audio: option có audioUrl (bake từ seed). Tìm option của selectedAnswer + option của correct answer.
  const options = contentData.options ?? [];
  const selectedOption = options.find(
    (o) => (o.text ?? o.content) === selectedAnswer,
  );
  const correctOption = options.find(
    (o) => (o.text ?? o.content) === question.answer,
  );

  // Highlight IPA target trong IPA đầy đủ (stage 1 đúng).
  const highlightedIpa = useMemo(() => {
    if (!isPhonemeMode || !ipa || !contentData.targetPhoneme) return null;
    const bare = contentData.targetPhoneme.replace(/\//g, "");
    if (!bare || !ipa.includes(bare)) return null;
    const parts = ipa.split(bare);
    return parts.map((p, i, arr) => (
      <span key={i}>
        {p}
        {i < arr.length - 1 && <span className="font-bold text-success-600">{bare}</span>}
      </span>
    ));
  }, [isPhonemeMode, ipa, contentData.targetPhoneme]);

  return (
    <div
      className={`fixed bottom-0 left-0 right-0 border-t-2 p-4 transition-transform duration-300 sm:p-6 translate-y-0 ${
        isCorrect ? "border-success-200 bg-success-50" : "border-warning-200 bg-warning-50"
      }`}
      role="status"
      aria-live="polite"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-1 items-start gap-4">
          <div
            className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-xl font-black ${
              isCorrect ? "bg-white text-success-600" : "bg-white text-warning-600"
            }`}
            aria-hidden="true"
          >
            {isCorrect ? "✓" : "✗"}
          </div>
          <div className="space-y-3">
            <h2
              className={`text-2xl font-bold ${
                isCorrect ? "text-success-700" : "text-warning-700"
              }`}
            >
              {isCorrect ? "Tuyệt vời!" : "Chưa chính xác"}
            </h2>

            {/* ĐÚNG: hiện word + IPA (highlight target) + nghĩa + replay */}
            {isCorrect && (
              <div className="space-y-2">
                <p className="font-bold text-neutral-900">
                  {displayWord}{" "}
                  <span className="font-ipa text-success-700">
                    {highlightedIpa ?? ipa}
                  </span>
                  {meaning && <span className="font-normal text-neutral-600"> — {meaning}</span>}
                </p>
                <MiniSpeaker audioUrl={contentData.audioUrl} label="Phát lại" />
              </div>
            )}

            {/* SAI: contrast comparison + 2 loa nghe so sánh */}
            {!isCorrect && (
              <div className="space-y-3">
                <p className="font-medium text-neutral-800">
                  Bạn chọn{" "}
                  <span className="font-bold text-warning-700">{selectedAnswer}</span>,
                  đáp án{" "}
                  <span className="font-bold text-success-700">{question.answer}</span>
                </p>
                {/* 2 loa: nghe âm user chọn + âm đúng (nếu có audioUrl bake) */}
                {(selectedOption?.audioUrl || correctOption?.audioUrl) && (
                  <div className="flex flex-wrap gap-2">
                    <span className="text-sm font-semibold text-neutral-600">So sánh 2 âm:</span>
                    {selectedOption?.audioUrl && (
                      <MiniSpeaker audioUrl={selectedOption.audioUrl} label={selectedAnswer ?? "âm chọn"} />
                    )}
                    {correctOption?.audioUrl && (
                      <MiniSpeaker audioUrl={correctOption.audioUrl} label={question.answer} />
                    )}
                  </div>
                )}
              </div>
            )}

            {hint && (
              <div
                className={`mt-2 rounded-lg p-4 text-sm ${
                  isCorrect ? "bg-success-100 text-success-800" : "bg-warning-100 text-warning-800"
                }`}
              >
                {hint}
              </div>
            )}
          </div>
        </div>

        <Button
          variant={isCorrect ? "success" : "error"}
          size="lg"
          className="min-h-14 w-full text-lg sm:mt-2 sm:w-48"
          onClick={onAdvance}
        >
          {isCorrect ? "Tiếp theo" : "Đã hiểu"}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Export `parseWordPrompt` + `ExerciseQuestion` từ engine**

`ListenFeedbackSheet` import `parseWordPrompt` + `ExerciseQuestion` từ `./ExerciseEngineClient`. Cần export 2 cái này. Trong `ExerciseEngineClient.tsx`, tìm `function parseWordPrompt` (line ~126) → đổi thành `export function parseWordPrompt`. Tìm `type ExerciseQuestion` (line ~14) → đổi thành `export type ExerciseQuestion`.

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS.

- [ ] **Step 4: (KHÔNG commit)**

---

## Task 5: Seed contrast audio (`seed_listen_choose_audio.ts`)

**Files:**
- Create: `prisma/seed_listen_choose_audio.ts`

Bake `option.audioUrl` vào content JSON của câu listen_choose (copy từ WordItem DB, không re-fetch). Cho ListenFeedbackSheet 2 loa nghe so sánh.

Lưu ý: câu listen_choose 3-stage đã có `contrastPhonemes` (IPA), KHÔNG có `options[]` word. Contrast audio cho phoneme-mode = audio của **word đại diện** cho mỗi IPA. Build lại options từ contrastPhonemes + tra WordItem mẫu.

- [ ] **Step 1: Tạo script**

```ts
/**
 * SEED LISTEN_CHOOSE CONTRAST AUDIO (SP1) - Bake option.audioUrl vào content listen_choose.
 *
 * Cho phoneme-mode 3-stage: mỗi contrastPhoneme → tìm 1 WordItem ACTIVE có targetPhoneme đó
 * trong cùng sound group → lấy audioUrl. Add options[{text:phoneme, audioUrl}] vào content JSON.
 * KHÔNG re-fetch API → copy từ WordItem DB hiện có (an toàn SP3a).
 *
 * Chạy: npx tsx prisma/seed_listen_choose_audio.ts
 */

import { PrismaClient } from "@prisma/client";
import { SOUND_GROUPS } from "./lesson-catalog";
import { getContentBySoundGroup } from "./lesson-content";

const prisma = new PrismaClient();

async function main() {
  console.log("🔊 Baking contrast audioUrls vào listen_choose content (no re-fetch)...");

  let updated = 0;
  let noAudio = 0;

  for (const sg of SOUND_GROUPS) {
    if (sg.topicId === "topic-4-stress-connected") continue;
    const content = getContentBySoundGroup(sg.id);
    if (!content) continue;

    const exerciseId = `ex-${sg.id}-listen_choose`;
    const questions = await prisma.question.findMany({ where: { exerciseId } });

    for (const q of questions) {
      const parsed = JSON.parse(q.content) as {
        mode: string;
        answerType?: string;
        contrastPhonemes?: string[];
        word?: string;
        ipa?: string;
        audioUrl?: string;
        options?: Array<{ text: string; audioUrl?: string }>;
      };

      if (parsed.mode !== "listen_choose" || parsed.answerType !== "phoneme" || !parsed.contrastPhonemes) {
        continue; // skip câu word-mode cũ hoặc không phải listen_choose
      }

      // Build options từ contrastPhonemes: mỗi phoneme → 1 word ACTIVE có targetPhoneme đó + audioUrl
      const options: Array<{ text: string; audioUrl?: string }> = [];
      for (const ph of parsed.contrastPhonemes) {
        // Tìm word trong sound group có targetPhoneme === ph, ACTIVE, có audioUrl
        const candidate = content.words.find((w) => w.targetPhonemes[0] === ph);
        if (candidate) {
          const wordItem = await prisma.wordItem.findFirst({ where: { word: candidate.word, ipa: candidate.ipa } });
          if (wordItem && wordItem.status === "ACTIVE" && wordItem.audioUrl) {
            options.push({ text: ph, audioUrl: wordItem.audioUrl });
          } else {
            options.push({ text: ph }); // no audio → ẩn nút loa
            noAudio++;
          }
        } else {
          options.push({ text: ph });
          noAudio++;
        }
      }

      const newContent = JSON.stringify({ ...parsed, options });
      await prisma.question.update({ where: { id: q.id }, data: { content: newContent } });
      updated++;
    }
  }

  console.log(`\n✅ ${updated} questions updated với contrast audioUrls`);
  if (noAudio > 0) console.log(`   ⚠️  ${noAudio} option không có audio (ẩn nút loa, graceful)`);
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

Run: `npx tsx prisma/seed_listen_choose_audio.ts`
Expected: `✅ ~110 questions updated` (số câu listen_choose 3-stage). Một số option no-audio (graceful).

- [ ] **Step 3: (KHÔNG commit)**

---

## Task 6: Engine integrate — header + playSfx + combo + sheet

**Files:**
- Modify: `src/app/exercises/[id]/ExerciseEngineClient.tsx`

Tích hợp: import sfx + combo hook + ListenFeedbackSheet; header render 🔥 + mute + praise popup; handler gọi playSfx + combo; thay inline bottom sheet bằng `<ListenFeedbackSheet>`.

- [ ] **Step 1: Thêm imports**

Đầu file (sau các import hiện có):

```ts
import { playSfx, useSfxMuted } from "@/lib/sfx";
import { useComboStreak } from "@/hooks/useComboStreak";
import ListenFeedbackSheet from "./ListenFeedbackSheet";
```

- [ ] **Step 2: Khởi tạo combo + mute trong component chính**

Trong `ExerciseEngineClient` (sau `const [isFinished, setIsFinished] = useState(false);` ~line 844):

```ts
  const combo = useComboStreak();
  const [muted, setMuted] = useSfxMuted();
```

- [ ] **Step 3: Gọi playSfx + combo trong handler**

Trong `handleAnswerListen` (~line 918-935), thêm sau `setSelectedAnswer(answerOpt)`:

```ts
    if (correct) {
      playSfx("correct");
      combo.onCorrect();
    } else {
      playSfx("wrong");
      combo.onWrong();
    }
```

Trong `handleNextVoice` (~line 937-956), thêm sau khi xác định correct/wrong (trước if currentIndex):

```ts
    if (correct) {
      playSfx("correct");
      combo.onCorrect();
    } else {
      playSfx("wrong");
      combo.onWrong();
    }
```

Trong `finishExercise` hoặc chỗ `setIsFinished(true)` → gọi `combo.reset()`.

- [ ] **Step 4: Header render 🔥 + mute + praise popup**

Tìm header (line ~1129-1145). Thêm nút mute + combo 🔥 + praise popup. Cấu trúc header hiện: `[← Lộ trình] [ProgressBar] [score]`. Thêm mute button cạnh nút Lộ trình, combo 🔥 cạnh score.

```tsx
      <header className="sticky top-0 z-10 flex items-center justify-between border-b border-neutral-200 bg-white px-4 py-4 transition-colors sm:px-6">

        <div className="flex items-center gap-2">
          <button type="button" onClick={() => router.push("/learning_map")} aria-label="Quay về lộ trình"
            className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold text-neutral-500 transition-colors hover:text-neutral-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500">
            <span aria-hidden="true">←</span> Lộ trình
          </button>
          {/* Nút mute SFX */}
          <button type="button" onClick={() => setMuted(!muted)} aria-label={muted ? "Bật âm thanh" : "Tắt âm thanh"}
            aria-pressed={muted}
            className="rounded-lg p-2 text-lg transition-colors hover:bg-neutral-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500">
            {muted ? "🔇" : "🔊"}
          </button>
        </div>

        <div className="mx-4 max-w-2xl flex-1">
          <ProgressBar value={progressPercent} max={100} size="lg" showPercentage={false} label={`Câu ${currentIndex + 1}/${questions.length}`} />
        </div>

        <div className="flex items-center gap-3">
          {/* Combo 🔥 */}
          {combo.milestone > 0 && (
            <span className="text-xl font-bold" aria-label={`Combo ${combo.combo} câu đúng liên tiếp`}>
              {"🔥".repeat(combo.milestone)}
            </span>
          )}
          <div className="min-w-16 text-right font-bold text-neutral-700" aria-label={`Điểm hiện tại ${score}`}>
            {score} điểm
          </div>
        </div>
      </header>

      {/* Praise popup (hiện 0.6s khi milestone) */}
      {combo.praise && (
        <PraisePopup text={combo.praise} onDismiss={combo.clearPraise} />
      )}
```

Thêm component `PraisePopup` (trong file, sau imports hoặc gần các sub-component):

```tsx
function PraisePopup({ text, onDismiss }: { text: string; onDismiss: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onDismiss, 600);
    return () => window.clearTimeout(timer);
  }, [text, onDismiss]);
  return (
    <div className="pointer-events-none fixed left-1/2 top-24 z-20 -translate-x-1/2 animate-bounce rounded-full bg-primary-600 px-6 py-3 text-lg font-bold text-white shadow-lg">
      {text}
    </div>
  );
}
```

- [ ] **Step 5: Thay inline bottom sheet bằng `<ListenFeedbackSheet>`**

Tìm block bottom sheet inline (line ~1163-1208, `{!isVoiceTask && (...)}`):

```tsx
        {!isVoiceTask && (
          <ListenFeedbackSheet
            isCorrect={isCorrect}
            selectedAnswer={selectedAnswer}
            question={currentQuestion}
            hint={currentHint}
            onAdvance={handleNextListen}
          />
        )}
```

(Xóa toàn bộ block inline cũ `fixed bottom-0 ...` thay bằng component này.)

- [ ] **Step 6: Shake animation cho nút sai (ListenChooseQuestion)**

Trong `ListenChooseQuestion`, thêm class `animate-shake` cho nút khi `isAnswered && !isCorrect && option.content === selectedAnswer`. Sửa buttonClass branch sai:

```tsx
              } else if (option.content === selectedAnswer) {
                buttonClass = "border-error-500 bg-error-50 text-error-700 animate-shake";
              }
```

- [ ] **Step 7: Type-check + build**

Run: `npx tsc --noEmit`
Expected: PASS.

Run: `npm run build`
Expected: PASS — 24/24 pages.

- [ ] **Step 8: (KHÔNG commit)**

---

## Task 7: Quality gate cuối

**Files:** không sửa — chỉ verify.

- [ ] **Step 1: Validate + db sync**

Run: `npx prisma validate` → valid.
Run: `npx prisma db push --skip-generate` → in sync.

- [ ] **Step 2: Type-check + test + build**

Run: `npx tsc --noEmit` → 0 error.
Run: `npm test` → pass (sfx 3 + combo 5 + 44 cũ = 52).
Run: `npm run build` → 24/24 pages.

- [ ] **Step 3: Smoke test thủ công**

`npm run dev` → vào 1 exercise listen_choose:
- Chọn đúng → nghe "ting", nút xanh, bottom sheet "Tuyệt vời!" + word + IPA highlight + replay.
- Chọn sai → nghe "buzz", nút đỏ + shake, bottom sheet "Chưa chính xác" + contrast + 2 loa nghe so sánh + "Đã hiểu".
- Đúng 3 liên tiếp → 🔥 xuất hiện ở header + praise popup 0.6s.
- Sai → combo reset, 🔥 biến.
- Nút 🔊/🔇 header toggle SFX (localStorage).
- Voice mode: đúng/sai vẫn có ting/buzz + combo (inline feedback giữ nguyên).

- [ ] **Step 4: (KHÔNG commit)**

---

## Self-Review (đã kiểm tra)

**Spec coverage:** 
- §4 sfx module → Task 1 ✓ | §5 combo hook → Task 2 ✓ | §6 feedback sheet → Task 4 ✓ | §7 voice SFX+combo → Task 6 ✓ | §8 shake → Task 3 ✓ | §9 seed contrast audio → Task 5 ✓ | §10 testing → Task 1/2 ✓ | quality gate → Task 7 ✓

**Placeholder scan:** Không TBD. Code đầy đủ.

**Type consistency:** `ComboState`, `SfxName`, `ListenFeedbackSheetProps` nhất quán. `parseWordPrompt`/`ExerciseQuestion` export từ engine (Task 4 Step 2) → import trong sheet.

**Lưu ý thực thi:** Task 6 Step 4 header edit + Step 5 sheet replace là edit lớn nhất — đọc kỹ context dòng trước khi edit. PraisePopup dùng `animate-bounce` (đã có trong Tailwind). Shake trong Task 6 Step 6 thêm class vào branch sai.
