# SP4a-followup: MinimalPairs Waveform + UX Retake Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Fix SpeakMinimalPairsQuestion (thử thách kép) — thêm sóng âm 2 instance + sửa UX retake flow (ẩn transcript cho đến khi nhấn Kiểm tra, cho ghi lại trước).

**Architecture:** 1 component sửa. Dùng 2 instance `useWaveformRecorder()` (mỗi cột 1 waveform riêng, container luôn render + ẩn CSS khi idle). UX: nói xong → "✓ Đã ghi" + nút "Ghi lại" (ẩn transcript) → cả 2 ghi → "Kiểm tra kết quả" → mới hiện transcript + đúng/sai.

**Tech Stack:** Next.js 14 App Router, React 18, TypeScript, wavesurfer.js v7 record plugin, Web Speech API.

**Spec:** `docs/superpowers/specs/2026-06-19-sp4a-minimalpairs-waveform-retake-design.md`

---

## File Structure

| File | Vai trò | Thay đổi |
|---|---|---|
| `frontend/src/app/exercises/[id]/SpeakMinimalPairsQuestion.tsx` | Component thử thách kép | Sửa: 2 instance hook, container luôn render, bỏ block transcript-recorded, thêm checkmark + nút Ghi lại, startRecording dùng recorder[index] + stop cột kia |
| `frontend/src/hooks/useWaveformRecorder.ts` | Hook waveform | KHÔNG sửa (clearWaveform đã có từ fix trước) |

**Context quan trọng cho engineer:**
- Hook `useWaveformRecorder` return: `{ containerRef, state, level, start, stop, reset }`. `level: "silence"|"normal"|"loud"`. `clearWaveform()` đã tích hợp trong `start()` + `reset()` (không cần gọi riêng).
- Pattern container luôn render + ẩn CSS đã verify ở `SpeakWordQuestion.tsx` (line 137-142) — replicate.
- `hintText(level)` helper đã có trong component (line 74-80).
- Không có unit test tự động cho UI voice (mic-dependent). Verify bằng tsc + build + smoke test thủ công.

---

### Task 1: Đổi 1 instance hook → 2 instance + stop cột kia khi chuyển

**Files:**
- Modify: `frontend/src/app/exercises/[id]/SpeakMinimalPairsQuestion.tsx:90` (recorder declaration) + `startRecording` function (line 103-133)

- [ ] **Step 1: Đổi 1 recorder → 2 recorder (recorder0, recorder1)**

Replace line 90 (trong component, sau `recognitionRef`):

```tsx
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const recorder = useWaveformRecorder();
```

bằng:

```tsx
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const recorder0 = useWaveformRecorder();
  const recorder1 = useWaveformRecorder();
```

- [ ] **Step 2: Thêm helper lấy recorder theo index**

Thêm sau `recorder1` declaration (trước `useEffect`):

```tsx
  const getRecorder = (index: number) => (index === 0 ? recorder0 : recorder1);
```

- [ ] **Step 3: Sửa `startRecording` dùng recorder[index] + stop cột kia**

Replace toàn bộ `startRecording` function (line 103-133 hiện tại):

```tsx
  const startRecording = (index: number) => {
    const Ctor = getSpeechCtor();
    if (!Ctor) { setErrorMessage("Trình duyệt không hỗ trợ Web Speech API. Hãy dùng Chrome/Edge."); return; }
    const recorder = getRecorder(index);
    // Stop cột kia nếu đang recording (tránh 2 stream mic song song)
    const otherRecorder = getRecorder(1 - index);
    if (statuses[1 - index] === "recording") {
      otherRecorder.stop();
      setStatuses((cur) => cur.map((item, i) => (i === 1 - index && item === "recording" ? "recorded" : item)));
    }
    const recog = new Ctor();
    recog.continuous = false; recog.lang = "en-US"; recog.interimResults = false; recog.maxAlternatives = 1;
    recog.onresult = (e) => {
      const t = e.results[0][0].transcript;
      setTranscripts((cur) => cur.map((item, i) => (i === index ? t : item)));
      setStatuses((cur) => cur.map((item, i) => (i === index ? "recorded" : item)));
      recorder.stop();
    };
    recog.onerror = () => {
      setStatuses((cur) => cur.map((item, i) => (i === index ? "idle" : item)));
      setErrorMessage("Không nghe thấy giọng nói. Thử lại.");
      recorder.reset();
    };
    recog.onend = () => setStatuses((cur) => cur.map((item, i) => (i === index && item === "recording" ? "idle" : item)));
    recognitionRef.current = recog;
    setErrorMessage(null);
    recorder.reset(); // clearWaveform xóa sóng cũ cột này trước thu mới
    setStatuses((cur) => cur.map((item, i) => (i === index ? "recording" : item)));
    void recorder.start();
    try {
      recog.start();
      window.setTimeout(() => { try { recog.stop(); } catch { /* */ } }, 5000);
    } catch (e) {
      console.error("recognition failed:", e);
      setErrorMessage("Không bắt đầu ghi âm được.");
      setStatuses((cur) => cur.map((item, i) => (i === index ? "idle" : item)));
    }
  };
```

- [ ] **Step 4: Sửa useEffect reset dùng cả 2 recorder**

Replace useEffect (line 92-97 hiện tại):

```tsx
  useEffect(() => {
    setStatuses(["idle", "idle"]); setTranscripts(["", ""]); setOverallStatus("idle");
    setShowWords([false, false]); setErrorMessage(null);
    recorder.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);
```

bằng:

```tsx
  useEffect(() => {
    setStatuses(["idle", "idle"]); setTranscripts(["", ""]); setOverallStatus("idle");
    setShowWords([false, false]); setErrorMessage(null);
    recorder0.reset();
    recorder1.reset();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [question.id]);
```

- [ ] **Step 5: Sửa `hint` dùng recorder của cột đang recording**

Replace line 99 (`const hint = hintText(recorder.level);`):

```tsx
  const activeRecorder = statuses[0] === "recording" ? recorder0 : statuses[1] === "recording" ? recorder1 : recorder0;
  const hint = hintText(activeRecorder.level);
```

- [ ] **Step 6: Verify tsc**

Run: `cd frontend && npx tsc --noEmit`
Expected: 0 error (nếu error `recorder` còn tham chiếu đâu đó → tiếp tục Task 2 sửa UI).

- [ ] **Step 7: KHÔNG commit riêng Task 1** (gộp commit cuối Task 2 sau khi UI xong)

---

### Task 2: Sửa UI — container luôn render mỗi cột + bỏ transcript-recorded + thêm checkmark + nút Ghi lại

**Files:**
- Modify: `frontend/src/app/exercises/[id]/SpeakMinimalPairsQuestion.tsx:159-199` (2 cột + waveform section)

- [ ] **Step 1: Sửa block 2 cột — waveform trong cột + bỏ transcript-recorded + thêm checkmark + Ghi lại**

Replace toàn bộ block 2 cột (line 159-191 hiện tại, từ `{/* 2 cột: IPA trên + từ ẩn + audio */}` đến đóng `</div>` của grid):

```tsx
        {/* 2 cột: IPA trên + từ ẩn + audio + waveform + nút thu */}
        <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-2">
          {pairs.map((pair, index) => {
            const recorder = getRecorder(index);
            return (
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
              {/* Waveform container luôn render (để hook useEffect khởi tạo wavesurfer lúc mount).
                  Ẩn CSS khi không recording để không chiếm chỗ. */}
              <div
                ref={recorder.containerRef}
                className={`mb-4 rounded-lg bg-neutral-50 p-2 transition-all ${
                  statuses[index] === "recording" ? "opacity-100" : "h-0 overflow-hidden opacity-0 py-0"
                }`}
              />
              {/* Hint text khi cột này đang recording */}
              {statuses[index] === "recording" && (
                <p className={`mb-3 text-center text-sm font-bold ${hintText(recorder.level).color}`}>
                  {hintText(recorder.level).text}
                </p>
              )}
              {/* Nút thu / trạng thái thu */}
              <button type="button" onClick={() => startRecording(index)} disabled={statuses[index] === "recording"}
                className={`w-full rounded-xl border-2 px-6 py-4 font-bold uppercase tracking-wider transition-all focus:outline-none focus-visible:ring-4 focus-visible:ring-warning-500 disabled:cursor-wait disabled:opacity-70 ${
                  statuses[index] === "recorded" ? "border-success-500 bg-success-500 text-white hover:bg-success-600"
                  : statuses[index] === "recording" ? "animate-pulse border-error-500 bg-error-500 text-white"
                  : "border-warning-300 bg-warning-100 text-warning-800 hover:border-warning-500 hover:bg-warning-200"}`}>
                {statuses[index] === "recording" ? "🎤 Đang nghe..." : statuses[index] === "recorded" ? "✓ Đã ghi" : "🎤 Bấm để nói"}
              </button>
              {/* Nút Ghi lại khi đã ghi (retake trước khi kiểm tra) */}
              {statuses[index] === "recorded" && (
                <button type="button" onClick={() => startRecording(index)}
                  className="mt-2 w-full rounded-lg border-2 border-warning-300 bg-white px-4 py-2 text-sm font-bold text-warning-700 transition-colors hover:bg-warning-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-warning-300">
                  🎤 Ghi lại
                </button>
              )}
            </div>
            );
          })}
        </div>
```

- [ ] **Step 2: Xóa waveform section chung cũ (line 193-199 hiện tại)**

Xóa block này (đã thay bằng waveform trong cột ở Step 1):

```tsx
        {/* Waveform chung (hiện khi đang thu 1 trong 2) */}
        {(statuses[0] === "recording" || statuses[1] === "recording") && (
          <div className="mb-6 space-y-2 text-center">
            <div ref={recorder.containerRef} className="rounded-lg bg-neutral-50 p-2" />
            <p className={`text-sm font-bold ${hint.color}`}>{hint.text}</p>
          </div>
        )}
```

- [ ] **Step 3: Sửa nút "Làm lại" trong block incorrect dùng cả 2 recorder reset**

Replace block incorrect (line 217-235 hiện tại, tìm nút "Làm lại"):

```tsx
              <button type="button" onClick={() => { setOverallStatus("idle"); setStatuses(["idle", "idle"]); setTranscripts(["", ""]); recorder0.reset(); recorder1.reset(); }}
                className="rounded-xl border-2 border-primary-400 bg-primary-500 px-8 py-4 font-bold text-white hover:bg-primary-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-300">
                🔄 Làm lại
              </button>
```

- [ ] **Step 4: Verify tsc**

Run: `cd frontend && npx tsc --noEmit`
Expected: 0 error.

- [ ] **Step 5: Verify build**

Run: `cd frontend && npm run build`
Expected: `✓ Compiled successfully` (24/24 static pages).

- [ ] **Step 6: Verify test suite không regress**

Run: `cd frontend && npm test`
Expected: 62/62 pass (không thêm test tự động — UI voice mic-dependent).

- [ ] **Step 7: Commit**

```bash
cd ..
git add english_pronunciation_app/frontend/src/app/exercises/[id]/SpeakMinimalPairsQuestion.tsx
git commit -m "SP4a-followup: minimalpairs 2 waveform instance + UX retake flow (ẩn transcript, checkmark, Ghi lại)"
```

---

### Task 3: Smoke test thủ công + verify final

**Files:** Không sửa code — verify bằng browser.

- [ ] **Step 1: Chạy dev server**

Run: `cd frontend && npm run dev`
Expected: server chạy tại localhost:3000.

- [ ] **Step 2: Đăng nhập + vào bài speak_minimal_pairs**

Smoke test 7 bước (theo spec Section 5):
- [ ] Vào bài speak_minimal_pairs → 2 cột, sóng không hiện lúc idle (ẩn CSS OK).
- [ ] Bấm cột 0 → sóng hiện + dynamic color (xám/xanh/vàng) + hint text.
- [ ] Nói xong → "✓ Đã ghi" + nút "Ghi lại", KHÔNG hiện transcript.
- [ ] Bấm cột 1 → sóng cột 1 hiện, cột 0 đã dừng.
- [ ] Nhấn "Ghi lại" cột 0 → sóng cũ cột 0 biến mất → thu mới (không còn sóng cũ).
- [ ] Cả 2 ghi → "Kiểm tra kết quả" enabled → nhấn → hiện transcript + đúng/sai.
- [ ] Chuyển câu (next) → 2 waveform reset sạch.

- [ ] **Step 3: Báo kết quả smoke test**

Nếu tất cả pass → task hoàn tất. Nếu bug → báo chính xác hiện tượng để debug tiếp.

---

## Self-Review (sau khi viết)

**1. Spec coverage:**
- Section 2 (2 instance hook + container luôn render) → Task 1 Step 1-2 + Task 2 Step 1 ✓
- Section 3 (UX retake: ẩn transcript, checkmark, Ghi lại, Kiểm tra) → Task 2 Step 1 ✓
- Section 4 (startRecording cleanup: stop cột kia, reset recorder[index]) → Task 1 Step 3 ✓
- Section 5 (smoke test 7 bước) → Task 3 ✓
- Section 7 rủi ro 2 stream mic → Task 1 Step 3 mitigate (stop cột kia) ✓

**2. Placeholder scan:** Không có TBD/TODO/"add error handling". Mọi step có code đầy đủ.

**3. Type consistency:**
- `getRecorder(index)` trả `recorder0`/`recorder1` (cùng type return của `useWaveformRecorder`) ✓
- `statuses[index]` dùng `"idle"|"recording"|"recorded"` nhất quán ✓
- `hintText(recorder.level)` — `level: "silence"|"normal"|"loud"` khớp hook return ✓
- `recorder.containerRef` — ref HTMLDivElement, khớp div ref ✓
