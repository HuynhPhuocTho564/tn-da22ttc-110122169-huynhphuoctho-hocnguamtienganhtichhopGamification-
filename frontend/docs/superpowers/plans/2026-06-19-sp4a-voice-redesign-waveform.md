# SP4a — Redesign 3 mode voice + waveform live Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Git policy:** Engineer KHÔNG tự commit. Mỗi task kết thúc checkpoint review với user; user tự commit khi convenient. Không chạy `git add`/`git commit`/`git push`.

**Goal:** Tách 3 component voice riêng (sửa bug "luyện miệng = thực chiến giống nhau" do dùng chung VoiceQuestion + heuristic word count), redesign UI (IPA trên + từ ẩn + audio dưới + waveform live), thêm dynamic feedback (sóng đổi màu theo âm lượng qua AnalyserNode RMS).

**Architecture:** Hướng A (spec). (1) Hook `useWaveformRecorder` (wavesurfer record plugin `scrollingWaveform` + AnalyserNode RMS dynamic color + `colorForRms` testable). (2) `SpeakWordQuestion` (IPA trên + từ ẩn + audio mp3 + waveform + hint). (3) `SpeakSentenceQuestion` (câu ẩn + audio speechSynthesis + waveform). (4) `SpeakMinimalPairsQuestion` (2 IPA + 2 từ ẩn + 2 audio + waveform chung reset). (5) Engine xóa VoiceQuestion/MinimalPairsQuestion (~490 dòng) + switch render theo `contentData.word` (word vs sentence). 3 component tự inline AudioButton riêng (pattern MiniSpeaker/ReplayButton).

**Tech Stack:** Next.js 16, React 18, TypeScript 6, Tailwind 4, wavesurfer.js ^7.12.7 (+ record plugin có sẵn), Web Speech API (SpeechRecognition + speechSynthesis), test runner `tsx --test` (Node `node:test` + `node:assert/strict`).

**Spec reference:** `docs/superpowers/specs/2026-06-19-sp4a-voice-redesign-waveform-design.md`

**Codebase root note:** Source dưới `english_pronunciation_app/frontend/`. Path tương đối từ `english_pronunciation_app/frontend/`. Chạy `npm`/`npx`/`tsx` từ `english_pronunciation_app/frontend/`.

---

## File Structure

| Hành động | File | Trách nhiệm |
|---|---|---|
| tạo | `src/hooks/useWaveformRecorder.ts` | Hook wavesurfer record + AnalyserNode RMS + `colorForRms` export (dynamic feedback) |
| tạo test | `src/hooks/__tests__/useWaveformRecorder.test.ts` | Test `colorForRms` 3 case (TDD) |
| tạo | `src/app/exercises/[id]/SpeakWordQuestion.tsx` | Luyện miệng 1 từ: IPA trên + từ ẩn + audio + waveform + hint |
| tạo | `src/app/exercises/[id]/SpeakSentenceQuestion.tsx` | Thực chiến câu: câu ẩn + audio speechSynthesis + waveform |
| tạo | `src/app/exercises/[id]/SpeakMinimalPairsQuestion.tsx` | Thử thách kép: 2 IPA + 2 từ ẩn + 2 audio + waveform chung |
| sửa | `src/app/exercises/[id]/ExerciseEngineClient.tsx` | Xóa VoiceQuestion/MinimalPairsQuestion + switch render 3 component theo mode |

**Decomposition rationale:** 3 mode voice tách 3 component (sửa bug "giống nhau" tận gốc). Hook waveform tái dụng 3 mode. 3 component tự inline AudioButton (pattern MiniSpeaker/ReplayButton — tránh export dependency từ engine). `parsePairPrompt` chuyển vào SpeakMinimalPairsQuestion. Task 1 hook + test (TDD), Task 2-4 3 component, Task 5 engine integrate, Task 6 quality gate.

**Type reminder (từ spec + code):** `ExerciseQuestion` (export từ engine line 17-25): `{ id, name, content, type, answer, score, options }`. `parseWordPrompt` (export engine line 136) trả `WordPrompt` với `word/ipa/audioUrl/hint/options/answerType/stage/...`. Hook trả `{ containerRef, state, level, start, stop, reset }`. Component props: `{ question: ExerciseQuestion, onNext: (correct: boolean, transcript: string) => void }`.

---

## Task 1: Hook `useWaveformRecorder` + test `colorForRms` (TDD)

**Files:**
- Create: `src/hooks/useWaveformRecorder.ts`
- Test: `src/hooks/__tests__/useWaveformRecorder.test.ts`

- [ ] **Step 1: Viết failing test `colorForRms`**

Tạo `src/hooks/__tests__/useWaveformRecorder.test.ts`:
```ts
import assert from "node:assert/strict";
import test from "node:test";
import { colorForRms } from "../useWaveformRecorder";

test("colorForRms: rms < 0.05 (im/nhỏ) → xám #94A3B8", () => {
  assert.equal(colorForRms(0.02), "#94A3B8");
});

test("colorForRms: 0.05 ≤ rms < 0.25 (chuẩn) → xanh dương #60A5FA", () => {
  assert.equal(colorForRms(0.15), "#60A5FA");
});

test("colorForRms: rms ≥ 0.25 (quá to) → vàng #FBBF24", () => {
  assert.equal(colorForRms(0.30), "#FBBF24");
});
```

- [ ] **Step 2: Chạy test verify fail**
```bash
npx tsx --test "src/hooks/__tests__/useWaveformRecorder.test.ts"
```
Expected: FAIL — `Cannot find module '../useWaveformRecorder'`.

- [ ] **Step 3: Viết `src/hooks/useWaveformRecorder.ts`**
```ts
"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import WaveSurfer from "wavesurfer.js";
import RecordPlugin from "wavesurfer.js/dist/plugins/record.esm.js";

type RecorderState = "idle" | "recording" | "stopped";
export type RecorderLevel = "silence" | "normal" | "loud";

// Ngưỡng Dynamic Feedback (RMS 0-1) — điểm xuất phát, tinh chỉnh sau test mic thực
const SILENCE_THRESHOLD = 0.05;
const LOUD_THRESHOLD = 0.25;
const COLOR_SILENCE = "#94A3B8"; // xám nhạt (im/nhỏ)
const COLOR_NORMAL = "#60A5FA"; // xanh dương (chuẩn)
const COLOR_LOUD = "#FBBF24"; // vàng (quá to/vỡ)

export function colorForRms(rms: number): string {
  if (rms < SILENCE_THRESHOLD) return COLOR_SILENCE;
  if (rms >= LOUD_THRESHOLD) return COLOR_LOUD;
  return COLOR_NORMAL;
}

function levelForRms(rms: number): RecorderLevel {
  if (rms < SILENCE_THRESHOLD) return "silence";
  if (rms >= LOUD_THRESHOLD) return "loud";
  return "normal";
}

export function useWaveformRecorder() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);
  const recordRef = useRef<RecordPlugin | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number | null>(null);
  const [state, setState] = useState<RecorderState>("idle");
  const [level, setLevel] = useState<RecorderLevel>("silence");

  useEffect(() => {
    if (!containerRef.current) return;
    const ws = WaveSurfer.create({
      container: containerRef.current,
      waveColor: COLOR_NORMAL,
      height: 80,
      barWidth: 3,
      barGap: 2,
    });
    const record = ws.registerPlugin(
      RecordPlugin.create({ scrollingWaveform: true, renderRecordedAudio: false }),
    );
    wavesurferRef.current = ws;
    recordRef.current = record;
    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      void audioCtxRef.current?.close().catch(() => {});
      ws.destroy();
      wavesurferRef.current = null;
      recordRef.current = null;
    };
  }, []);

  const startLevelMonitor = useCallback((stream: MediaStream) => {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    const ctx = new Ctor();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    source.connect(analyser);
    audioCtxRef.current = ctx;

    const buffer = new Uint8Array(analyser.fftSize);
    const tick = () => {
      analyser.getByteTimeDomainData(buffer);
      let sumSq = 0;
      for (let i = 0; i < buffer.length; i++) {
        const norm = (buffer[i] - 128) / 128;
        sumSq += norm * norm;
      }
      const rms = Math.sqrt(sumSq / buffer.length);
      wavesurferRef.current?.setOptions({ waveColor: colorForRms(rms) });
      setLevel(levelForRms(rms));
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const start = useCallback(async () => {
    const record = recordRef.current;
    if (!record) return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      await record.startMic(stream);
      startLevelMonitor(stream);
      setState("recording");
    } catch (error) {
      console.warn("mic access failed:", error);
    }
  }, [startLevelMonitor]);

  const stop = useCallback(() => {
    const record = recordRef.current;
    if (!record) return;
    record.stopMic();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    void audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    setState("stopped");
    setLevel("silence");
  }, []);

  const reset = useCallback(() => {
    const record = recordRef.current;
    if (record) record.stopMic();
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    void audioCtxRef.current?.close().catch(() => {});
    audioCtxRef.current = null;
    wavesurferRef.current?.setOptions({ waveColor: COLOR_NORMAL });
    setState("idle");
    setLevel("silence");
  }, []);

  return { containerRef, state, level, start, stop, reset };
}
```

- [ ] **Step 4: Chạy test verify pass**
```bash
npx tsx --test "src/hooks/__tests__/useWaveformRecorder.test.ts"
```
Expected: PASS — 3 test (silence/normal/loud).

- [ ] **Step 5: Verify tsc**
```bash
npx tsc --noEmit
```
Expected: 0 error. Nếu lỗi type wavesurfer record plugin → verify import path `wavesurfer.js/dist/plugins/record.esm.js` (đã có trong node_modules).

- [ ] **Step 6: Checkpoint review với user**

Báo user: hook + test done, 3 test colorForRms pass, tsc clean. Review rồi tiếp Task 2.

---

## Task 2: `SpeakWordQuestion` (luyện miệng 1 từ)

**Files:**
- Create: `src/app/exercises/[id]/SpeakWordQuestion.tsx`

**Context:** Thay `VoiceQuestion` (engine 396-684) cho word mode. Giữ SpeechRecognition (createRecognition inline) + scoring word-overlap qua `onNext`. UI: IPA trên (hiện) + từ ẩn (toggle) + audio dưới + waveform + hint. Tự inline AudioButton (pattern MiniSpeaker/ReplayButton). `parseWordPrompt` import từ engine (đã export line 136).

- [ ] **Step 1: Tạo `src/app/exercises/[id]/SpeakWordQuestion.tsx`**
```tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { parseWordPrompt, type ExerciseQuestion } from "./ExerciseEngineClient";
import { useWaveformRecorder, type RecorderLevel } from "@/hooks/useWaveformRecorder";

type SpeakWordQuestionProps = {
  question: ExerciseQuestion;
  onNext: (correct: boolean, transcript: string) => void;
};

// SpeechRecognition types (giống engine)
type SpeechRecognitionLike = {
  continuous: boolean; lang: string; interimResults: boolean; maxAlternatives: number;
  onresult: ((e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
  onerror: ((e: { error: string }) => void) | null; onend: (() => void) | null;
  start: () => void; stop: () => void;
};
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & typeof globalThis & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function normalizeAnswer(value: string) {
  return value.toLowerCase().replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ").trim();
}

// Nút audio (inline, pattern MiniSpeaker/ReplayButton)
function AudioButton({ audioUrl, label }: { audioUrl?: string; label: string }) {
  if (!audioUrl) return null;
  const play = () => {
    const audio = new Audio(audioUrl);
    audio.play().catch((e) => console.warn("audio failed:", e));
  };
  return (
    <button type="button" onClick={play} aria-label={label}
      className="inline-flex min-h-11 items-center justify-center rounded-lg border border-primary-200 bg-primary-50 px-4 py-2 text-sm font-bold text-primary-700 transition-colors hover:bg-primary-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500">
      {label}
    </button>
  );
}

// Hint text theo level (dynamic feedback)
function hintText(level: RecorderLevel): { text: string; color: string } {
  switch (level) {
    case "silence": return { text: "🗣️ Nói to hơn", color: "text-neutral-500" };
    case "normal": return { text: "✅ Âm lượng tốt", color: "text-success-600" };
    case "loud": return { text: "⚠️ Nói nhỏ lại", color: "text-warning-600" };
  }
}

export default function SpeakWordQuestion({ question, onNext }: SpeakWordQuestionProps) {
  const contentData = useMemo(() => parseWordPrompt(question.content), [question.content]);
  const [status, setStatus] = useState<"idle" | "recording" | "processing" | "correct" | "incorrect" | "error">("idle");
  const [transcript, setTranscript] = useState("");
  const [showWord, setShowWord] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [speechUnsupported, setSpeechUnsupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const recorder = useWaveformRecorder();

  useEffect(() => {
    setSpeechUnsupported(getSpeechCtor() === null);
    setStatus("idle"); setTranscript(""); setRetryCount(0); setShowWord(false);
    recorder.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  const displayWord = contentData.word ? contentData.word.charAt(0).toUpperCase() + contentData.word.slice(1) : question.answer;
  const maskedWord = "•".repeat(Math.max(contentData.word?.length ?? question.answer.length, 3));
  const hint = hintText(recorder.level);

  const checkAnswer = (recordedText: string) => {
    setStatus("processing");
    recorder.stop();
    window.setTimeout(() => {
      if (normalizeAnswer(recordedText) === normalizeAnswer(question.answer)) setStatus("correct");
      else { setStatus("incorrect"); setRetryCount((c) => c + 1); }
    }, 400);
  };

  const startRecording = () => {
    const Ctor = getSpeechCtor();
    if (!Ctor) { setSpeechUnsupported(true); setStatus("error"); return; }
    const recog = new Ctor();
    recog.continuous = false; recog.lang = "en-US"; recog.interimResults = false; recog.maxAlternatives = 1;
    recog.onresult = (e) => { setTranscript(e.results[0][0].transcript); checkAnswer(e.results[0][0].transcript); };
    recog.onerror = () => setStatus("error");
    recog.onend = () => setStatus((cur) => (cur === "recording" ? "error" : cur));
    recognitionRef.current = recog;
    setStatus("recording"); setTranscript("");
    void recorder.start();
    try {
      recog.start();
      window.setTimeout(() => { try { recog.stop(); } catch { /* already stopped */ } }, 5000);
    } catch (e) { console.error("recognition start failed:", e); setStatus("error"); }
  };

  const stopRecording = () => { try { recognitionRef.current?.stop(); } catch { /* */ } recorder.stop(); };

  return (
    <div className="mx-auto w-full max-w-2xl">
      <div className="rounded-2xl border-2 border-success-300 bg-gradient-to-br from-white to-neutral-50 p-8 shadow-lg">
        {/* Badge */}
        <div className="mb-6 text-center">
          <span className="inline-block rounded-full bg-success-100 px-4 py-1.5 text-sm font-bold text-success-700">🗣️ Luyện miệng</span>
        </div>

        {/* Tầng 1: IPA trên (hiện luôn) */}
        {contentData.ipa && (
          <p className="mb-4 text-center font-ipa text-5xl font-bold text-primary-600">{contentData.ipa}</p>
        )}

        {/* Tầng 2: Từ ẩn dưới IPA */}
        <div className="mb-6 text-center">
          <p className="text-3xl font-black tracking-tight text-neutral-900">
            {showWord ? displayWord : maskedWord}
          </p>
          <button type="button" onClick={() => setShowWord((s) => !s)}
            className="mt-2 text-sm font-bold text-primary-600 hover:text-primary-700">
            {showWord ? "🙈 Ẩn từ" : "👁️ Hiện từ"}
          </button>
        </div>

        {/* Tầng 3: Audio phát */}
        <div className="mb-6 flex justify-center">
          <AudioButton audioUrl={contentData.audioUrl} label="🔊 Nghe mẫu" />
        </div>

        {/* Tầng 4: Mic + waveform + hint */}
        {status === "idle" && (
          <div className="space-y-4 text-center">
            {speechUnsupported && (
              <div className="rounded-xl border-2 border-warning-300 bg-warning-50 p-4 text-sm font-semibold text-warning-800" role="alert">
                ⚠️ Trình duyệt chưa hỗ trợ Web Speech API. Hãy dùng Chrome hoặc Edge.
              </div>
            )}
            <button type="button" onClick={startRecording}
              className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-error-500 to-error-600 shadow-xl transition-all hover:scale-105 hover:shadow-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-error-300">
              <span className="text-5xl" role="img" aria-label="microphone">🎤</span>
            </button>
            <p className="text-sm font-bold text-neutral-500">Nhấn để bắt đầu ghi âm</p>
          </div>
        )}

        {status === "recording" && (
          <div className="space-y-4 text-center">
            <div ref={recorder.containerRef} className="rounded-lg bg-neutral-50 p-2" />
            <p className={`text-sm font-bold ${hint.color}`}>{hint.text}</p>
            <button type="button" onClick={stopRecording}
              className="rounded-xl bg-neutral-200 px-8 py-3 font-bold text-neutral-700 transition-colors hover:bg-neutral-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-neutral-400">
              Dừng ghi âm
            </button>
          </div>
        )}

        {status === "processing" && (
          <div className="space-y-4 text-center">
            <div ref={recorder.containerRef} className="rounded-lg bg-neutral-50 p-2 opacity-60" />
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-primary-200 border-t-primary-600" />
            <p className="text-sm font-semibold text-neutral-600">Đang phân tích giọng nói...</p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4 text-center">
            <div className="text-5xl">😕</div>
            <div className="rounded-xl border-2 border-warning-300 bg-warning-50 p-4 text-warning-800">
              <p className="font-bold">{speechUnsupported ? "Trình duyệt không hỗ trợ" : "Không nghe thấy giọng nói"}</p>
              <p className="mt-1 text-sm">{speechUnsupported ? "Hãy dùng Chrome/Edge" : "Kiểm tra microphone và thử lại"}</p>
            </div>
            <button type="button" onClick={startRecording}
              className="rounded-xl bg-primary-600 px-6 py-3 font-bold text-white hover:bg-primary-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-300">
              Thử lại
            </button>
          </div>
        )}

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
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Verify tsc**
```bash
npx tsc --noEmit
```
Expected: 0 error. Nếu lỗi `RecorderLevel` import → verify Task 1 export `type RecorderLevel`.

- [ ] **Step 3: Checkpoint review với user**

Báo user: SpeakWordQuestion done, tsc clean. Review rồi tiếp Task 3. (Smoke test thủ công: `npm run dev`, làm 1 bài speak_word, verify IPA trên + từ ẩn + audio + waveform + hint — optional, có thể gộp cuối Task 5.)

---

## Task 3: `SpeakSentenceQuestion` (thực chiến câu)

**Files:**
- Create: `src/app/exercises/[id]/SpeakSentenceQuestion.tsx`

**Context:** Thay `VoiceQuestion` cho sentence mode. Giữ speechSynthesis "Nghe mẫu câu" (engine 515-534). UI: câu ẩn (toggle) + audio speechSynthesis + waveform + hint. SpeechRecognition timeout 8s (sentence dài). Tự inline speechSynthesis button.

- [ ] **Step 1: Tạo `src/app/exercises/[id]/SpeakSentenceQuestion.tsx`**
```tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { parseWordPrompt, type ExerciseQuestion } from "./ExerciseEngineClient";
import { useWaveformRecorder, type RecorderLevel } from "@/hooks/useWaveformRecorder";

type SpeakSentenceQuestionProps = {
  question: ExerciseQuestion;
  onNext: (correct: boolean, transcript: string) => void;
};

type SpeechRecognitionLike = {
  continuous: boolean; lang: string; interimResults: boolean; maxAlternatives: number;
  onresult: ((e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
  onerror: ((e: { error: string }) => void) | null; onend: (() => void) | null;
  start: () => void; stop: () => void;
};
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & typeof globalThis & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function normalizeAnswer(value: string) {
  return value.toLowerCase().replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ").trim();
}

function playSentence(text: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  const voices = window.speechSynthesis.getVoices();
  const enVoice = voices.find((v) => v.lang === "en-US") || voices.find((v) => v.lang.startsWith("en"));
  if (enVoice) utter.voice = enVoice;
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utter);
}

function hintText(level: RecorderLevel): { text: string; color: string } {
  switch (level) {
    case "silence": return { text: "🗣️ Nói to hơn", color: "text-neutral-500" };
    case "normal": return { text: "✅ Âm lượng tốt", color: "text-success-600" };
    case "loud": return { text: "⚠️ Nói nhỏ lại", color: "text-warning-600" };
  }
}

export default function SpeakSentenceQuestion({ question, onNext }: SpeakSentenceQuestionProps) {
  const contentData = useMemo(() => parseWordPrompt(question.content), [question.content]);
  const [status, setStatus] = useState<"idle" | "recording" | "processing" | "correct" | "incorrect" | "error">("idle");
  const [transcript, setTranscript] = useState("");
  const [showSentence, setShowSentence] = useState(false);
  const [speechUnsupported, setSpeechUnsupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const recorder = useWaveformRecorder();

  useEffect(() => {
    setSpeechUnsupported(getSpeechCtor() === null);
    setStatus("idle"); setTranscript(""); setShowSentence(false);
    recorder.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  const words = question.answer.trim().split(/\s+/);
  const maskedSentence = words.map(() => "•".repeat(5)).join(" ");
  const hint = hintText(recorder.level);

  const checkAnswer = (recordedText: string) => {
    setStatus("processing");
    recorder.stop();
    window.setTimeout(() => {
      const expectedTokens = normalizeAnswer(question.answer).split(" ").filter(Boolean);
      const actualTokens = normalizeAnswer(recordedText).split(" ").filter(Boolean);
      let matches = 0;
      const remaining = [...actualTokens];
      for (const t of expectedTokens) {
        const idx = remaining.indexOf(t);
        if (idx >= 0) { matches += 1; remaining.splice(idx, 1); }
      }
      const acc = expectedTokens.length > 0 ? Math.round((matches / expectedTokens.length) * 100) : 0;
      setStatus(acc >= 80 ? "correct" : "incorrect");
    }, 400);
  };

  const startRecording = () => {
    const Ctor = getSpeechCtor();
    if (!Ctor) { setSpeechUnsupported(true); setStatus("error"); return; }
    const recog = new Ctor();
    recog.continuous = false; recog.lang = "en-US"; recog.interimResults = false; recog.maxAlternatives = 1;
    recog.onresult = (e) => { setTranscript(e.results[0][0].transcript); checkAnswer(e.results[0][0].transcript); };
    recog.onerror = () => setStatus("error");
    recog.onend = () => setStatus((cur) => (cur === "recording" ? "error" : cur));
    recognitionRef.current = recog;
    setStatus("recording"); setTranscript("");
    void recorder.start();
    try {
      recog.start();
      window.setTimeout(() => { try { recog.stop(); } catch { /* */ } }, 8000); // sentence: 8s
    } catch (e) { console.error("recognition start failed:", e); setStatus("error"); }
  };

  const stopRecording = () => { try { recognitionRef.current?.stop(); } catch { /* */ } recorder.stop(); };

  return (
    <div className="mx-auto w-full max-w-3xl">
      <div className="rounded-2xl border-2 border-accent-300 bg-gradient-to-br from-accent-50 to-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <span className="inline-block rounded-full bg-accent-100 px-4 py-1.5 text-sm font-bold text-accent-700">🎯 Thực chiến</span>
        </div>

        {/* Câu ẩn (toggle) */}
        <div className="mb-6 text-center">
          <p className="text-xl font-bold leading-relaxed text-neutral-900">
            {showSentence ? question.answer : maskedSentence}
          </p>
          <button type="button" onClick={() => setShowSentence((s) => !s)}
            className="mt-3 text-sm font-bold text-accent-600 hover:text-accent-700">
            {showSentence ? "🙈 Ẩn câu" : "👁️ Hiện câu"}
          </button>
        </div>

        {/* Audio speechSynthesis */}
        <div className="mb-6 flex justify-center">
          <button type="button" onClick={() => playSentence(question.answer)} aria-label="Nghe mẫu câu"
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-accent-200 bg-accent-50 px-4 py-2 text-sm font-bold text-accent-700 transition-colors hover:bg-accent-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-accent-500">
            🎧 Nghe mẫu câu
          </button>
        </div>

        {status === "idle" && (
          <div className="space-y-4 text-center">
            {speechUnsupported && (
              <div className="rounded-xl border-2 border-warning-300 bg-warning-50 p-4 text-sm font-semibold text-warning-800" role="alert">
                ⚠️ Trình duyệt chưa hỗ trợ Web Speech API. Hãy dùng Chrome/Edge.
              </div>
            )}
            <button type="button" onClick={startRecording}
              className="mx-auto flex h-32 w-32 items-center justify-center rounded-full bg-gradient-to-br from-accent-500 to-accent-600 shadow-xl transition-all hover:scale-105 hover:shadow-2xl focus:outline-none focus-visible:ring-4 focus-visible:ring-accent-300">
              <span className="text-5xl" role="img" aria-label="microphone">🎤</span>
            </button>
            <p className="text-sm font-bold text-neutral-500">Đọc câu hoàn chỉnh</p>
          </div>
        )}

        {status === "recording" && (
          <div className="space-y-4 text-center">
            <div ref={recorder.containerRef} className="rounded-lg bg-neutral-50 p-2" />
            <p className={`text-sm font-bold ${hint.color}`}>{hint.text}</p>
            <button type="button" onClick={stopRecording}
              className="rounded-xl bg-neutral-200 px-8 py-3 font-bold text-neutral-700 hover:bg-neutral-300 focus:outline-none focus-visible:ring-4 focus-visible:ring-neutral-400">
              Dừng ghi âm
            </button>
          </div>
        )}

        {status === "processing" && (
          <div className="space-y-4 text-center">
            <div ref={recorder.containerRef} className="rounded-lg bg-neutral-50 p-2 opacity-60" />
            <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-accent-200 border-t-accent-600" />
            <p className="text-sm font-semibold text-neutral-600">Đang phân tích giọng nói...</p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4 text-center">
            <div className="text-5xl">😕</div>
            <div className="rounded-xl border-2 border-warning-300 bg-warning-50 p-4 text-warning-800">
              <p className="font-bold">{speechUnsupported ? "Trình duyệt không hỗ trợ" : "Không nghe thấy giọng nói"}</p>
              <p className="mt-1 text-sm">{speechUnsupported ? "Hãy dùng Chrome/Edge" : "Kiểm tra microphone và thử lại"}</p>
            </div>
            <button type="button" onClick={startRecording}
              className="rounded-xl bg-accent-600 px-6 py-3 font-bold text-white hover:bg-accent-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-accent-300">
              Thử lại
            </button>
          </div>
        )}

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

Báo user: SpeakSentenceQuestion done, tsc clean. Review rồi tiếp Task 4.

---

## Task 4: `SpeakMinimalPairsQuestion` (thử thách kép 2 từ)

**Files:**
- Create: `src/app/exercises/[id]/SpeakMinimalPairsQuestion.tsx`

**Context:** Thay `MinimalPairsQuestion` (engine 686-881). Tự inline `parsePairPrompt` (chuyển từ engine). UI: 2 IPA trên (hiện) + 2 từ ẩn (2 toggle) + 2 audio + waveform chung (reset giữa 2 lần thu). Scoring `checkBothAnswers` (word-overlap cả 2).

- [ ] **Step 1: Tạo `src/app/exercises/[id]/SpeakMinimalPairsQuestion.tsx`**
```tsx
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { type ExerciseQuestion } from "./ExerciseEngineClient";
import { useWaveformRecorder, type RecorderLevel } from "@/hooks/useWaveformRecorder";

type SpeakMinimalPairsQuestionProps = {
  question: ExerciseQuestion;
  onNext: (correct: boolean, transcript: string) => void;
};

type WordPrompt = { word: string; ipa?: string; audioUrl?: string; hint?: string };

// parsePairPrompt (chuyển từ engine)
function parsePairPrompt(content: string): [WordPrompt, WordPrompt] {
  try {
    const parsed = JSON.parse(content) as Array<Partial<WordPrompt>>;
    if (Array.isArray(parsed) && parsed.length >= 2) {
      return [
        { word: String(parsed[0].word ?? "Word 1"), ipa: parsed[0].ipa ? String(parsed[0].ipa) : undefined, audioUrl: parsed[0].audioUrl ? String(parsed[0].audioUrl) : undefined, hint: parsed[0].hint ? String(parsed[0].hint) : undefined },
        { word: String(parsed[1].word ?? "Word 2"), ipa: parsed[1].ipa ? String(parsed[1].ipa) : undefined, audioUrl: parsed[1].audioUrl ? String(parsed[1].audioUrl) : undefined, hint: parsed[1].hint ? String(parsed[1].hint) : undefined },
      ];
    }
  } catch { /* fallback below */ }
  const words = content.split(/[-,|]/).map((i) => i.trim()).filter(Boolean);
  return [{ word: words[0] ?? "Word 1" }, { word: words[1] ?? "Word 2" }];
}

type SpeechRecognitionLike = {
  continuous: boolean; lang: string; interimResults: boolean; maxAlternatives: number;
  onresult: ((e: { results: { [i: number]: { [j: number]: { transcript: string } } } }) => void) | null;
  onerror: ((e: { error: string }) => void) | null; onend: (() => void) | null;
  start: () => void; stop: () => void;
};
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getSpeechCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as Window & typeof globalThis & { SpeechRecognition?: SpeechRecognitionCtor; webkitSpeechRecognition?: SpeechRecognitionCtor };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

function normalizeAnswer(value: string) {
  return value.toLowerCase().replace(/[^\w\s]|_/g, "").replace(/\s+/g, " ").trim();
}

function AudioButton({ audioUrl, label }: { audioUrl?: string; label: string }) {
  if (!audioUrl) return null;
  const play = () => { const a = new Audio(audioUrl); a.play().catch((e) => console.warn("audio failed:", e)); };
  return (
    <button type="button" onClick={play} aria-label={label}
      className="inline-flex min-h-11 items-center justify-center rounded-lg border border-warning-200 bg-warning-50 px-4 py-2 text-sm font-bold text-warning-800 transition-colors hover:bg-warning-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-warning-500">
      {label}
    </button>
  );
}

function hintText(level: RecorderLevel): { text: string; color: string } {
  switch (level) {
    case "silence": return { text: "🗣️ Nói to hơn", color: "text-neutral-500" };
    case "normal": return { text: "✅ Âm lượng tốt", color: "text-success-600" };
    case "loud": return { text: "⚠️ Nói nhỏ lại", color: "text-warning-600" };
  }
}

export default function SpeakMinimalPairsQuestion({ question, onNext }: SpeakMinimalPairsQuestionProps) {
  const pairs = useMemo(() => parsePairPrompt(question.content), [question.content]);
  const [statuses, setStatuses] = useState<Array<"idle" | "recording" | "recorded">>(["idle", "idle"]);
  const [transcripts, setTranscripts] = useState(["", ""]);
  const [overallStatus, setOverallStatus] = useState<"idle" | "processing" | "correct" | "incorrect">("idle");
  const [showWords, setShowWords] = useState<[boolean, boolean]>([false, false]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const recorder = useWaveformRecorder();

  useEffect(() => {
    setStatuses(["idle", "idle"]); setTranscripts(["", ""]); setOverallStatus("idle");
    setShowWords([false, false]); setErrorMessage(null);
    recorder.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);

  const hint = hintText(recorder.level);
  const canCheck = statuses[0] === "recorded" && statuses[1] === "recorded";
  const combinedTranscript = transcripts.filter(Boolean).join(" ");

  const startRecording = (index: number) => {
    const Ctor = getSpeechCtor();
    if (!Ctor) { setErrorMessage("Trình duyệt không hỗ trợ Web Speech API. Hãy dùng Chrome/Edge."); return; }
    const recog = new Ctor();
    recog.continuous = false; recog.lang = "en-US"; recog.interimResults = false; recog.maxAlternatives = 1;
    recog.onresult = (e) => {
      const t = e.results[0][0].transcript;
      setTranscripts((cur) => cur.map((item, i) => (i === index ? t : item)));
      setStatuses((cur) => cur.map((item, i) => (i === index ? "recorded" : item)));
      recorder.stop();
    };
    recog.onerror = () => { setStatuses((cur) => cur.map((item, i) => (i === index ? "idle" : item))); setErrorMessage("Không nghe thấy giọng nói. Thử lại."); recorder.reset(); };
    recog.onend = () => setStatuses((cur) => cur.map((item, i) => (i === index && item === "recording" ? "idle" : item)));
    recognitionRef.current = recog;
    setErrorMessage(null);
    recorder.reset(); // reset waveform giữa 2 lần thu
    setStatuses((cur) => cur.map((item, i) => (i === index ? "recording" : item)));
    void recorder.start();
    try {
      recog.start();
      window.setTimeout(() => { try { recog.stop(); } catch { /* */ } }, 5000);
    } catch (e) { console.error("recognition failed:", e); setErrorMessage("Không bắt đầu ghi âm được."); setStatuses((cur) => cur.map((item, i) => (i === index ? "idle" : item))); }
  };

  const checkBothAnswers = () => {
    setOverallStatus("processing");
    window.setTimeout(() => {
      const ok0 = normalizeAnswer(transcripts[0]) === normalizeAnswer(pairs[0].word);
      const ok1 = normalizeAnswer(transcripts[1]) === normalizeAnswer(pairs[1].word);
      setOverallStatus(ok0 && ok1 ? "correct" : "incorrect");
    }, 400);
  };

  const masked = (w: string) => "•".repeat(Math.max(w.length, 3));

  return (
    <div className="mx-auto w-full max-w-5xl">
      <div className="rounded-2xl border-2 border-warning-400 bg-gradient-to-br from-warning-50 via-white to-neutral-50 p-8 shadow-lg">
        <div className="mb-8 text-center">
          <span className="inline-block rounded-full bg-warning-100 px-5 py-2 text-sm font-bold uppercase tracking-wider text-warning-800">⚔️ Thử thách kép</span>
          <h2 className="mt-3 text-3xl font-black uppercase tracking-widest text-neutral-900">Minimal Pairs</h2>
          <p className="mt-2 text-lg text-neutral-600">{question.name || "Đọc lần lượt hai từ"}</p>
        </div>

        {errorMessage && (
          <div className="mb-6 rounded-xl border-2 border-warning-400 bg-warning-50 p-5 text-center font-bold text-warning-800" role="alert">⚠️ {errorMessage}</div>
        )}

        {/* 2 cột: IPA trên + từ ẩn + audio */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {pairs.map((pair, index) => (
            <div key={`${pair.word}-${index}`} className="rounded-xl border-2 border-warning-200 bg-gradient-to-br from-white to-warning-50 p-6 transition-all hover:border-warning-400">
              {/* IPA trên (hiện luôn) */}
              {pair.ipa && <p className="mb-3 text-center font-ipa text-3xl font-bold text-warning-600">{pair.ipa}</p>}
              {/* Từ ẩn (toggle) */}
              <div className="mb-4 text-center">
                <p className="text-3xl font-black uppercase tracking-tight text-neutral-900">{showWords[index] ? pair.word : masked(pair.word)}</p>
                <button type="button" onClick={() => setShowWords((s) => s.map((v, i) => (i === index ? !v : v)) as [boolean, boolean])}
                  className="mt-1 text-xs font-bold text-warning-700 hover:text-warning-800">
                  {showWords[index] ? "🙈 Ẩn" : "👁️ Hiện"}
                </button>
              </div>
              {/* Audio */}
              <div className="mb-4 flex justify-center"><AudioButton audioUrl={pair.audioUrl} label="🔊 Nghe mẫu" /></div>
              {/* Nút thu từng từ */}
              <button type="button" onClick={() => startRecording(index)} disabled={statuses[index] === "recording"}
                className={`w-full rounded-xl border-2 px-6 py-4 font-bold uppercase tracking-wider transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-warning-500 disabled:cursor-wait disabled:opacity-70 ${
                  statuses[index] === "recorded" ? "border-success-500 bg-success-500 text-white hover:bg-success-600"
                  : statuses[index] === "recording" ? "animate-pulse border-error-500 bg-error-500 text-white"
                  : "border-warning-300 bg-warning-100 text-warning-800 hover:border-warning-500 hover:bg-warning-200"}`}>
                {statuses[index] === "recording" ? "🎤 Đang nghe..." : statuses[index] === "recorded" ? "✓ Ghi lại" : "🎤 Bấm để nói"}
              </button>
              {statuses[index] === "recorded" && (
                <div className="mt-3 rounded-lg border border-success-200 bg-success-50 p-3 text-center">
                  <p className="text-xs font-semibold text-neutral-600">Bạn đã đọc:</p>
                  <p className="text-lg font-bold text-success-700">"{transcripts[index]}"</p>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Waveform chung (hiện khi đang thu 1 trong 2) */}
        {(statuses[0] === "recording" || statuses[1] === "recording") && (
          <div className="mb-6 space-y-2 text-center">
            <div ref={recorder.containerRef} className="rounded-lg bg-neutral-50 p-2" />
            <p className={`text-sm font-bold ${hint.color}`}>{hint.text}</p>
          </div>
        )}

        {/* Check button / results */}
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
              <button type="button" onClick={() => { setOverallStatus("idle"); setStatuses(["idle", "idle"]); setTranscripts(["", ""]); recorder.reset(); }}
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

Báo user: SpeakMinimalPairsQuestion done, tsc clean. Review rồi tiếp Task 5 (engine integrate — xóa VoiceQuestion/MinimalPairsQuestion).

---

## Task 5: Engine integrate — xóa cũ + switch render 3 component

**Files:**
- Modify: `src/app/exercises/[id]/ExerciseEngineClient.tsx`

**Context:** Xóa `VoiceQuestion` (396-684) + `MinimalPairsQuestion` (686-881) + `parsePairPrompt` (161-186, đã chuyển vào SpeakMinimalPairs) + `AudioButton` (218-270, **chỉ xóa nếu orphan** — ListenChooseQuestion còn dùng line 342 → **GIỮ AudioButton**). `isSentenceMode` heuristic (411-414) xóa cùng VoiceQuestion. Import 3 component + switch render theo `contentData.word`.

**QUAN TRỌNG — AudioButton KHÔNG xóa:** `AudioButton` (engine 218) còn dùng ở `ListenChooseQuestion` line 342 (`<AudioButton audioUrl={contentData.audioUrl} label="Phát lại audio" />`). Chỉ xóa nếu xác nhận ListenChoose không dùng — nhưng ta đã verify nó dùng → **GIỮ**. SpeakWord/Pairs tự inline AudioButton riêng (Task 2/4 đã làm).

- [ ] **Step 1: Import 3 component mới vào engine**

Mở `src/app/exercises/[id]/ExerciseEngineClient.tsx`. Tại block import đầu file (line 1-11), thêm sau `import ExerciseSummaryScreen from "./ExerciseSummaryScreen";`:
```ts
import ExerciseSummaryScreen from "./ExerciseSummaryScreen";
import SpeakWordQuestion from "./SpeakWordQuestion";
import SpeakSentenceQuestion from "./SpeakSentenceQuestion";
import SpeakMinimalPairsQuestion from "./SpeakMinimalPairsQuestion";
```

- [ ] **Step 2: Xóa `parsePairPrompt` (chuyển vào SpeakMinimalPairs rồi)**

Xóa function `parsePairPrompt` (engine line 161-186, từ `function parsePairPrompt(content: string): [WordPrompt, WordPrompt] {` đến `}` đóng + 1 dòng trắng). Verify không còn dùng khác ngoài MinimalPairsQuestion (đã xóa): `findstr parsePairPrompt` chỉ trả 0 hoặc dòng def.

- [ ] **Step 3: Xóa `VoiceQuestion` function**

Xóa toàn bộ function `VoiceQuestion` (engine line 396-684, từ `function VoiceQuestion({` đến `}` đóng function cuối cùng trước `function MinimalPairsQuestion`). Xóa luôn `isSentenceMode` (bên trong, line 411-414). Verify xóa sạch ~290 dòng.

- [ ] **Step 4: Xóa `MinimalPairsQuestion` function**

Xóa toàn bộ function `MinimalPairsQuestion` (engine line 686-881, từ `function MinimalPairsQuestion({` đến `}` đóng). Verify ~200 dòng.

- [ ] **Step 5: Sửa switch render theo mode (word vs sentence qua `contentData.word`)**

Tại main render (engine line 1142-1150), thay:
```tsx
        {currentQuestion.type === "qtype-1-mc" && (
          <ListenChooseQuestion question={currentQuestion} onAnswer={handleAnswerListen} isAnswered={isAnswered} selectedAnswer={selectedAnswer} />
        )}

        {currentQuestion.type === "qtype-2-voice" && <VoiceQuestion key={currentQuestion.id} question={currentQuestion} onNext={handleNextVoice} />}

        {currentQuestion.type === "qtype-3-minimal-pairs" && (
          <MinimalPairsQuestion key={currentQuestion.id} question={currentQuestion} onNext={handleNextVoice} />
        )}
```
bằng:
```tsx
        {currentQuestion.type === "qtype-1-mc" && (
          <ListenChooseQuestion question={currentQuestion} onAnswer={handleAnswerListen} isAnswered={isAnswered} selectedAnswer={selectedAnswer} />
        )}

        {currentQuestion.type === "qtype-2-voice" &&
          (parseWordPrompt(currentQuestion.content).word ? (
            <SpeakWordQuestion key={currentQuestion.id} question={currentQuestion} onNext={handleNextVoice} />
          ) : (
            <SpeakSentenceQuestion key={currentQuestion.id} question={currentQuestion} onNext={handleNextVoice} />
          ))}

        {currentQuestion.type === "qtype-3-minimal-pairs" && (
          <SpeakMinimalPairsQuestion key={currentQuestion.id} question={currentQuestion} onNext={handleNextVoice} />
        )}
```

**Lý do phân biệt word vs sentence:** `contentData.word` có cho word mode (seed word có `word` field trong content JSON), không có cho sentence mode (sentence content chỉ có `answer`, không `word`). Verify: word content JSON = `{word, ipa, audioUrl, ...}`, sentence content JSON = `{answer, ...}` không `word`. Nếu phân biệt sai → test thực, có thể thêm `mode` field trong content seed (defer — ghi rủi ro spec section 11).

- [ ] **Step 6: Verify tsc + test**
```bash
npx tsc --noEmit
npm test
```
Expected: tsc 0 error. `npm test`: 55 test cũ + 3 test colorForRms = 58 test pass. Nếu lỗi "VoiceQuestion not defined" → verify Task 5 Step 3-4 xóa sạch + Step 5 không còn reference VoiceQuestion/MinimalPairsQuestion.

- [ ] **Step 7: Smoke test thủ công (optional, gộp Task 6)**

Có thể skip ở Task 5, gộp Task 6 Step 4. Hoặc chạy nhanh:
```bash
npm run dev
```
Mở `/learning_map` → làm 1 bài speak_word (CĐ1/CĐ2) → verify IPA trên + từ ẩn + audio + waveform + hint. Làm 1 bài speak_sentence → verify câu ẩn + speechSynthesis. Làm 1 bài speak_minimal_pairs → verify 2 IPA + 2 từ ẩn + waveform chung. Ctrl+C stop dev.

- [ ] **Step 8: Checkpoint review với user**

Báo user: engine integrate done, xóa ~490 dòng VoiceQuestion/MinimalPairsQuestion, switch render 3 component, tsc + test pass. Review rồi tiếp Task 6 (quality gate + smoke test).

---

## Task 6: Quality gate + smoke test 3 mode

**Files:** None (verification only)

- [ ] **Step 1: tsc full**
```bash
npx tsc --noEmit
```
Expected: 0 error.

- [ ] **Step 2: test full**
```bash
npm test
```
Expected: ALL pass (58 test: 55 cũ + 3 colorForRms). Không regression.

- [ ] **Step 3: build**
```bash
npm run build
```
Expected: Next.js build success. Không lỗi import wavesurfer (lazy trong hook, client-only).

- [ ] **Step 4: Smoke test 3 mode thủ công**
```bash
npm run dev
```
Mở browser `http://localhost:3000/learning_map`:
1. **speak_word**: click 1 bài CĐ1/CĐ2 có mode "Luyện miệng" → verify:
   - IPA trên (hiện luôn, `/.../`)
   - Từ ẩn `••••` dưới IPA, bấm "👁️ Hiện từ" → hiện word, "🙈 Ẩn từ" → ẩn lại
   - Nút "🔊 Nghe mẫu" phát audio local
   - Bấm mic → sóng live hiện + đổi màu theo âm lượng (im xám/nói xanh/to vàng) + hint text
   - Thu xong → kết quả correct/incorrect
2. **speak_sentence**: làm 1 bài "Thực chiến" → verify:
   - Câu ẩn `•••• •••• ••••`, bấm "Hiện câu" → hiện câu
   - Nút "🎧 Nghe mẫu câu" (speechSynthesis) phát
   - Mic + waveform + hint
3. **speak_minimal_pairs**: làm 1 bài "Thử thách kép" → verify:
   - 2 cột: 2 IPA trên + 2 từ ẩn (2 toggle riêng) + 2 audio
   - Thu từ 1 → waveform 1, thu từ 2 → waveform reset + thu lại
   - Check → correct/incorrect
Ctrl+C stop dev.

- [ ] **Step 5: Checkpoint final review với user**

Báo user: SP4a hoàn tất. Quality gate pass (tsc 0 error, 58 test pass, build OK). Smoke test 3 mode verify IPA/ẩn/audio/waveform/hint hoạt động. Tổng kết files tạo/sửa. User review + commit khi convenient.

---

## Self-Review

### 1. Spec coverage
- **Spec mục tiêu 1 (sửa bug giống nhau)**: Task 5 xóa VoiceQuestion/MinimalPairsQuestion + tách 3 component (Task 2-4). ✓
- **Spec mục tiêu 2 (redesign UI luyện miệng)**: Task 2 SpeakWordQuestion IPA trên + từ ẩn toggle + audio dưới. ✓
- **Spec mục tiêu 3 (waveform live)**: Task 1 hook wavesurfer record `scrollingWaveform` + Task 2-4 gắn container. ✓
- **Spec mục tiêu 4 (dynamic feedback)**: Task 1 AnalyserNode RMS + `colorForRms` + Task 2-4 hint text theo `level`. ✓
- **Spec section 1 (hiện trạng)**: Plan ghi VoiceQuestion/MinimalPairsQuestion line ref, wavesurfer record plugin, AudioButton còn dùng ListenChoose. ✓
- **Spec section 2 (hook + dynamic)**: Task 1 đầy đủ + `colorForRms` export + ngưỡng hằng số. ✓
- **Spec section 3 (SpeakWord)**: Task 2 đầy đủ IPA/từ ẩn/audio/waveform/hint/states. ✓
- **Spec section 4 (SpeakSentence)**: Task 3 câu ẩn + speechSynthesis + waveform + word-overlap. ✓
- **Spec section 5 (SpeakMinimalPairs)**: Task 4 2 IPA + 2 từ ẩn + 2 audio + waveform chung reset + checkBothAnswers. ✓
- **Spec section 6 (engine integrate)**: Task 5 xóa + switch render `contentData.word`. ✓
- **Spec section 7 (testing)**: Task 1 TDD colorForRms 3 case + Task 6 smoke test 3 mode. ✓
- **Spec section 8 (file)**: 6 file khớp Task 1-5. ✓
- **Spec section 9-10 (behavior/scope/defer)**: scoring giữ, SP4b defer, edge cases (getUserMedia/AudioContext/SSR) trong hook. ✓
- **Spec section 11 (rủi ro)**: SpeechRecognition+getUserMedia, ngưỡng RMS, perf, autoplay, SSR, phân biệt word/sentence — ghi trong hook note + Task 5 note. ✓

**Gap phát hiện & xử lý:**
- Spec không nói AudioButton có xóa không → Plan Task 5 Step 1 note "GIỮ AudioButton" (ListenChoose còn dùng line 342). ✓
- Spec không nói `parsePairPrompt` chuyển đâu → Plan Task 4 inline vào component + Task 5 Step 2 xóa khỏi engine. ✓
- Spec nói "scoring word-overlap giữ" → Task 3 sentence tự inline word-overlap (không import `calculateWordOverlapAccuracy` từ scoring.ts để component tự chứa — hoặc import? Plan inline cho self-contained, nhưng DRY... → **cải thiện**: Task 3 nên import `calculateWordOverlapAccuracy` từ `@/lib/scoring` thay vì inline. Fix Task 3 Step 1: thay `checkAnswer` inline bằng import.

**Fix Task 3 inline (DRY):** Task 3 Step 1 hiện inline word-overlap. Thay bằng import `calculateWordOverlapAccuracy` từ `@/lib/scoring` (đã có, scoring.ts:51-71). Sửa `checkAnswer`:
```ts
import { calculateWordOverlapAccuracy } from "@/lib/scoring";
// ...
const checkAnswer = (recordedText: string) => {
  setStatus("processing");
  recorder.stop();
  window.setTimeout(() => {
    const acc = calculateWordOverlapAccuracy(question.answer, recordedText);
    setStatus(acc >= 80 ? "correct" : "incorrect");
  }, 400);
};
```
(Engineer: dùng import này thay vì inline word-overlap trong Task 3. Loại bỏ logic `expectedTokens/actualTokens/matches` inline.)

### 2. Placeholder scan
- Không có "TBD"/"TODO"/"implement later"/"similar to Task N".
- Mỗi task có code đầy đủ: Task 1 hook ~110 dòng + test, Task 2 SpeakWord ~200 dòng, Task 3 SpeakSentence ~200 dòng, Task 4 SpeakMinimalPairs ~230 dòng, Task 5 engine edits cụ thể.
- Seed command + verify đầy đủ (Task 6).

### 3. Type consistency
- `RecorderLevel` (Task 1 export) = `"silence" | "normal" | "loud"` → Task 2/3/4 `hintText(level: RecorderLevel)`. ✓
- Hook return `{ containerRef, state, level, start, stop, reset }` (Task 1) → Task 2/3/4 dùng `recorder.containerRef/state/level/start/stop/reset`. ✓
- `ExerciseQuestion` (import từ engine) → Task 2/3/4 props `question: ExerciseQuestion`. ✓
- `parseWordPrompt` (import từ engine) → Task 2/3 dùng. ✓
- `onNext: (correct: boolean, transcript: string) => void` → Task 2/3/4 props + engine `handleNextVoice` (line 1016-1039, signature khớp). ✓
- `colorForRms(rms: number): string` (Task 1) → test 3 case (Task 1 Step 1). ✓
- wavesurfer import `wavesurfer.js/dist/plugins/record.esm.js` (Task 1) → verify path có trong node_modules (đã check). ✓

No type drift. **1 fix DRY**: Task 3 import `calculateWordOverlapAccuracy` thay inline (đã ghi fix).

### Note cho engineer: 1 fix DRY trong Task 3
Khi implement Task 3 (SpeakSentenceQuestion), dùng `import { calculateWordOverlapAccuracy } from "@/lib/scoring"` + `checkAnswer` gọi nó, KHÔNG inline word-overlap logic (expectedTokens/actualTokens/matches). Block code Step 1 ghi version inline — dùng version import fix.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-19-sp4a-voice-redesign-waveform.md`. Two execution options:

**1. Subagent-Driven (recommended)** — Tôi dispatch fresh subagent per task, review giữa task. Phù hợp: 6 task tuần tự (Task 1 hook → Task 2-4 component → Task 5 engine → Task 6 gate), mỗi task self-contained.

**2. Inline Execution** — Execute tasks trong session này bằng executing-plans, batch + checkpoint.

**Git policy:** Engineer không tự commit (user handles). Mỗi task kết thúc checkpoint review với user.

Which approach?
