# SP4a — Redesign luyện miệng + waveform live (3 mode voice) Design

Ngày: 2026-06-19
Trạng thái: design đã được user duyệt (hướng A: tách 3 component + hook waveform + dynamic feedback)
Scope: master SP4 (Exercise Engine v2) — đợt 1. Redesign UI 3 mode voice (speak_word / speak_sentence / speak_minimal_pairs): tách component riêng (sửa bug "luyện miệng ≈ thực chiến giống nhau" do dùng chung VoiceQuestion + heuristic word count), ẩn nội dung + bấm hiện, audio dưới, **waveform live** (wavesurfer record plugin) + **dynamic feedback** (sóng đổi màu theo âm lượng qua AnalyserNode RMS). Defer sang SP4b: 4 UI CĐ4 (tap-stress/weak/linking/assimilation) + Mode B multi-answer + scoring multiplier/retake.

Lưu ý tên: "SP4a" = redesign 3 mode voice (master SP4 đợt 1). KHÁC SP3b (content CD2, plan đã viết).

## Mục tiêu

1. **Sửa bug "luyện miệng ≈ thực chiến giống nhau"**: hiện `speak_word` và `speak_sentence` dùng chung `VoiceQuestion` (engine line 396-684), phân biệt duy nhất = heuristic `isSentenceMode = answerWords.length > 2` (line 411-414). Tách 3 component riêng → mỗi mode UI riêng đúng đặc thù, luyện miệng chỉ luyện 1 từ.
2. **Redesign UI luyện miệng**: IPA (âm vị) trên + từ ẩn dưới IPA (bấm "Hiện từ" mới hiện) + audio phát dưới cùng — đúng yêu cầu user.
3. **Waveform live**: khi bấm thu âm, hiện sóng âm lên/xuống theo mic realtime (wavesurfer record plugin `scrollingWaveform`). Giống ELSA/Duolingo — động lực + user biết mình đang nói.
4. **Dynamic Feedback (nâng cao)**: sóng đổi màu theo âm lượng (im/nhỏ → xám `#94A3B8`, chuẩn → xanh dương `#60A5FA`, quá to → vàng `#FBBF24`) qua Web Audio API AnalyserNode RMS. Sóng thành "biểu đồ hướng dẫn" mic — user biết đứng quá xa mic hay hét quá to.

## 1. Hiện trạng (nền tảng, không xây từ đầu)

- **3 mode voice dùng chung component**: `VoiceQuestion` (engine 396-684) cho `qtype-2-voice` (speak_word + speak_sentence, phân biệt `isSentenceMode`), `MinimalPairsQuestion` (engine 686-881) cho `qtype-3-minimal-pairs`. Cả 2 phình ~490 dòng, engine tổng ~1100 dòng.
- **SpeechRecognition**: `createRecognition` inline (engine 202-223), scoring = word-overlap (`calculateWordOverlapAccuracy` scoring.ts:51-71), không có backend ASR. `useSpeechRecognition.ts` hook có nhưng VoiceQuestion không dùng (inline).
- **wavesurfer.js ^7.12.7 đã cài** (`package.json`) + **record plugin** có (`node_modules/wavesurfer.js/dist/plugins/record.js`). Record plugin expose `startMic`/`stopMic`/`scrollingWaveform` + event `record-progress` (chỉ duration, **KHÔNG expose RMS level**).
- **AudioButton** (engine 225-270) phát `audioUrl` local mp3. ListenFeedbackSheet có `MiniSpeaker` riêng, ExerciseSummaryScreen có `ReplayButton` riêng → AudioButton có thể orphan sau tách.
- **speechSynthesis "Nghe mẫu câu"** (engine 515-534) cho sentence mode — giữ.
- **Pattern tách component đã establish**: `ListenFeedbackSheet.tsx` (SP1) + `ExerciseSummaryScreen.tsx` (SP2) — engine còn ~900 dòng sau tách.

## 2. Hook `useWaveformRecorder` + Dynamic Feedback

**Vai trò**: Hook bao wavesurfer.js v7 + record plugin. Cung cấp container ref, `start()`/`stop()`/`reset()`, state `idle|recording|stopped`, `level: silence|normal|loud`. Tái dụng 3 component voice.

**Cơ chế Dynamic Feedback** (vì record plugin không expose RMS → dùng Web Audio API AnalyserNode song song):
- Tạo `AudioContext` + `AnalyserNode` từ cùng `MediaStream` getUserMedia (2 consumer độc lập, không xung đột).
- `requestAnimationFrame` loop: `getByteTimeDomainData` → tính RMS (0-1).
- 3 ngưỡng → `wavesurfer.setOptions({ waveColor })`:
  - RMS < 0.05 (im/nhỏ) → xám nhạt `#94A3B8`
  - 0.05 ≤ RMS < 0.25 (chuẩn) → xanh dương `#60A5FA`
  - RMS ≥ 0.25 (quá to/vỡ) → vàng `#FBBF24`
- `setLevel` expose ra component → hiển thị hint text.

**Export `colorForRms` pure function** (testable):
```ts
export function colorForRms(rms: number): string {
  if (rms < SILENCE_THRESHOLD) return COLOR_SILENCE;
  if (rms >= LOUD_THRESHOLD) return COLOR_LOUD;
  return COLOR_NORMAL;
}
```

**Ngưỡng hằng số** (dễ tinh chỉnh): `SILENCE_THRESHOLD = 0.05`, `LOUD_THRESHOLD = 0.25`, 3 màu `COLOR_SILENCE/NORMAL/LOUD`. Ghi reviewNote: ngưỡng điểm xuất phát, tinh chỉnh sau test mic thực.

**Edge cases:**
- `AudioContext` không hỗ trợ (browser cũ) → `startLevelMonitor` return, sóng xanh dương cố định (graceful degrade).
- `getUserMedia` từ chối → catch, state idle, component báo "chặn mic".
- Chuyển câu (unmount) → cleanup `cancelAnimationFrame` + `audioCtx.close()` + `ws.destroy()`.

**Rủi ro:**
- Ngưỡng RMS phụ thuộc mic (nhạy vs yếu) → hằng số dễ chỉnh, test thực.
- `setOptions({ waveColor })` mỗi frame (60fps) → perf? Test thực; nếu lag → giảm tần suất (mỗi 100ms thay vì mỗi frame).
- SpeechRecognition + getUserMedia cùng mic → xung đột Chrome? SpeechRecognition API riêng, getUserMedia riêng, Chrome cho phép song song (test thực). Nếu xung đột → fallback sóng tĩnh.

## 3. `SpeakWordQuestion` (luyện miệng 1 từ)

**Props:** `{ question: ExerciseQuestion, onNext: (correct: boolean, transcript: string) => void }`.

**Layout (trên→dưới):**
1. **IPA trên (hiện luôn)** — `font-ipa text-5xl`, màu primary. Vd `/ʃiːp/`.
2. **Từ ẩn dưới IPA** — mặc định `•••••` (che theo độ dài word), nút "👁️ Hiện từ" → hiện `word` (text-3xl). Toggle ẩn lại được.
3. **Audio phát** — nút "🔊 Nghe mẫu" (AudioButton phát `contentData.audioUrl` local mp3).
4. **Nút mic** — bấm → `useWaveformRecorder.start()` + SpeechRecognition.start() song song.
5. **Waveform container** — div gắn `containerRef`, chỉ hiện khi `state !== "idle"`.
6. **Hint dưới sóng** (dynamic feedback) — text theo `level`: `silence` → "🗣️ Nói to hơn" (xám), `normal` → "✅ Âm lượng tốt" (xanh), `loud` → "⚠️ Nói nhỏ lại" (vàng).
7. **Kết quả** — giữ logic VoiceQuestion (correct/incorrect, transcript, "Tiếp theo"/"Thử lại"), hiện SAU sóng.

**Trạng thái:** `idle` (IPA + từ ẩn + audio + mic) → `recording` (sóng live + hint, nút "Dừng") → `processing` (spinner, sóng đóng băng) → `correct`/`incorrect`/`error`.

**Logic giữ từ VoiceQuestion:** SpeechRecognition (createRecognition inline, scoring word-overlap qua `onNext`), `contentData = parseWordPrompt`, retry, speechUnsupported. **Xóa `isSentenceMode`** (sentence là component riêng).

**Khác VoiceQuestion hiện tại:** IPA lên trên (hiện luôn), word xuống dưới (ẩn toggle), audio tách dưới, thêm waveform + hint. Sửa bug "giống sentence" — chỉ luyện 1 từ.

## 4. `SpeakSentenceQuestion` (thực chiến câu)

**Props:** `{ question: ExerciseQuestion, onNext: (correct, transcript) => void }`.

**Layout:**
1. **Câu ẩn** — mặc định `••••• ••••• •••••` (che theo số từ), nút "👁️ Hiện câu" → hiện `question.answer` (text-xl, 2-3 dòng).
2. **Audio dưới** — nút "🎧 Nghe mẫu câu" (speechSynthesis, giữ logic engine 515-534). KHÔNG mp3.
3. **Mic + waveform + hint** — cùng hook `useWaveformRecorder`.
4. **Scoring** — word-overlap (giữ). Sentence dài → SpeechRecognition timeout 8s (giữ engine 467).
5. Badge "🎯 Thực chiến" (giữ).

## 5. `SpeakMinimalPairsQuestion` (thử thách kép 2 từ)

**Props:** `{ question: ExerciseQuestion, onNext: (correct, transcript) => void }`.

**Layout:**
1. **2 IPA trên** (hiện luôn, 2 cột): `/ʃiːp/` `/ʃɪp/`.
2. **2 từ ẩn dưới** (mỗi cột `•••••`, 2 nút "Hiện từ" riêng).
3. **2 audio dưới** (2 AudioButton phát `pair.audioUrl`).
4. **Mic + waveform** — 1 waveform container chung, thu từ 1 rồi thu từ 2 → sóng reset giữa 2 lần (gọn, tránh 2 hook).
5. **Hint dynamic** chung.
6. **Scoring** — giữ `checkBothAnswers` (word-overlap cả 2).
7. Badge "⚔️ Thử thách kép" (giữ).

**Quyết định waveform minimal_pairs**: 1 container chung, reset giữa 2 lần thu (khuyến nghị — đơn giản, tránh 2 hook). `reset()` hook giữa 2 lần.

## 6. Engine integrate

**`ExerciseEngineClient.tsx`:**
- Import 3 component mới. Hook chỉ dùng trong component, engine không import trực tiếp.
- **Xóa**: `VoiceQuestion` (396-684, ~290 dòng), `MinimalPairsQuestion` (686-881, ~200 dòng), `isSentenceMode` heuristic (411-414). Kiểm tra `AudioButton` (225-270) — nếu orphan (ListenFeedbackSheet có MiniSpeaker riêng, ExerciseSummaryScreen có ReplayButton riêng) → xóa. `parsePairPrompt` (154-186) — SpeakMinimalPairsQuestion cần, chuyển vào component hoặc giữ export.
- **Render switch theo `question.type`** + mode:
  - `qtype-2-voice` + word mode (`contentData.word` có) → `<SpeakWordQuestion>`
  - `qtype-2-voice` + sentence mode (`contentData.word` không có, chỉ `answer`) → `<SpeakSentenceQuestion>`
  - `qtype-3-minimal-pairs` → `<SpeakMinimalPairsQuestion>`
- **Phân biệt word vs sentence**: check `contentData.word` (word mode có `word` field, sentence không) — không cần đổi seed.

**Quy ước:** component `"use client"` (dùng wavesurfer DOM). Engine đã `"use client"`.

## 7. Testing

- **`colorForRms` pure function** (export từ hook): test `tsx --test`, 3 case:
  - `rms = 0.02` (< 0.05) → `#94A3B8` (xám)
  - `rms = 0.15` (0.05-0.25) → `#60A5FA` (xanh)
  - `rms = 0.30` (≥ 0.25) → `#FBBF24` (vàng)
- **Hook `useWaveformRecorder`**: khó unit test (DOM + getUserMedia + AudioContext). Test thủ công: dev, thu mic, verify sóng live + đổi màu.
- **3 component UI**: smoke test thủ công (dev, làm bài mỗi mode, verify IPA/ẩn từ/audio/waveform/hint).
- **Không regression**: `npm test` (55 test cũ + 3 test colorForRms = 58) + `tsc` + `build` pass.

**Quality gate:** `npx tsc --noEmit` + `npm test` + `npm run build` pass.

## 8. File sẽ tạo/sửa

| Hành động | File |
|---|---|
| tạo | `src/hooks/useWaveformRecorder.ts` (hook wavesurfer record + AnalyserNode dynamic color + `colorForRms` export) |
| tạo test | `src/hooks/__tests__/useWaveformRecorder.test.ts` (test `colorForRms` 3 case) |
| tạo | `src/app/exercises/[id]/SpeakWordQuestion.tsx` |
| tạo | `src/app/exercises/[id]/SpeakSentenceQuestion.tsx` |
| tạo | `src/app/exercises/[id]/SpeakMinimalPairsQuestion.tsx` |
| sửa | `src/app/exercises/[id]/ExerciseEngineClient.tsx` (xóa VoiceQuestion/MinimalPairsQuestion/AudioButton nếu orphan + import 3 comp + switch render theo mode) |

**KHÔNG sửa:** scoring logic, gamification, content (SP3b riêng), listen_choose mode, schema, seed.

## 9. Thay đổi behavior?

- Luyện miệng (speak_word) UI riêng: IPA trên + từ ẩn + audio dưới + waveform + hint. Không còn "giống sentence".
- Thực chiến (speak_sentence) UI riêng: câu ẩn + audio speechSynthesis + waveform.
- Thử thách kép (speak_minimal_pairs) UI riêng: 2 IPA + 2 từ ẩn + 2 audio + waveform chung.
- Waveform live khi thu (sóng lên/xuống theo mic) + đổi màu theo âm lượng (dynamic feedback).
- Scoring KHÔNG đổi (word-overlap giữ). Gamification KHÔNG đụng. Content KHÔNG đụng.

## 10. Scope, edge cases, defer

**Scope SP4a:** 3 component voice redesign + hook waveform + dynamic feedback + engine integrate.

**Defer (ra khỏi SP4a):**
- 4 UI CĐ4 (tap-stress/weak/linking/assimilation) + Mode B multi-answer + scoring multiplier/retake → SP4b.
- Unlock runtime gating → SP6.
- Playback waveform sau thu (scope = live only).
- Voice activity detection (VAD) chính xác — dynamic feedback dùng RMS ngưỡng thô, đủ MVP.

**Edge cases:**
- `getUserMedia` từ chối → component báo "chặn mic", fallback thu chỉ SpeechRecognition (không waveform).
- `AudioContext` không hỗ trợ → sóng xanh cố định, không dynamic color.
- wavesurfer v7 SSR → hook `"use client"` + `useEffect` guard.
- Chuyển câu → cleanup dọn AudioContext + wavesurfer + raf.

## 11. Rủi ro & giải pháp

| Rủi ro | Giải pháp |
|---|---|
| SpeechRecognition + getUserMedia cùng mic xung đột Chrome | Test thực. Chrome cho phép song song (2 API riêng). Nếu xung đột → fallback sóng tĩnh. |
| Ngưỡng RMS phụ thuộc mic | Hằng số dễ chỉnh, test mic thực, ghi reviewNote. |
| `setOptions` mỗi frame → perf | Test thực; nếu lag → giảm tần suất (mỗi 100ms). |
| AudioContext autoplay policy | `getUserMedia` = user gesture (bấm mic) → AudioContext resume OK. |
| wavesurfer v7 + Next 16 SSR | `"use client"` + `useEffect` guard `containerRef.current`. |
| 3 component + engine sửa lớn | Tách component nhỏ, mỗi mode 1 file, test thủ công từng mode. |
| Phân biệt word/sentence qua `contentData.word` có thể sai | Verify content seed: word mode có `word` field, sentence không. Nếu lỗi → thêm `mode` field trong content (cần re-seed, defer). |
| `parsePairPrompt` di chuyển | Chuyển vào SpeakMinimalPairsQuestion hoặc export từ engine. |
