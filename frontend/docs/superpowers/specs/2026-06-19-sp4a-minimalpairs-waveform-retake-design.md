# SP4a-followup: SpeakMinimalPairsQuestion — Waveform + UX Retake Flow

**Ngày:** 2026-06-19
**Loại:** Design spec (fix + UX polish)
**Scope:** 1 component `SpeakMinimalPairsQuestion.tsx`
**Phụ thuộc:** SP4a (hook `useWaveformRecorder` đã có + dynamic feedback), fix `clearWaveform` vừa thêm (empty + dataWindow reset)

## 1. Bối cảnh & Vấn đề

SP4a đã tách 3 component voice + thêm waveform live. Nhưng `SpeakMinimalPairsQuestion` (thử thách kép) còn 2 vấn đề user report:

1. **Không có sóng âm** — waveform container chỉ render khi `statuses[0/1] === "recording"` (line 194 hiện tại), nên `containerRef.current = null` lúc mount → `useEffect` khởi tạo wavesurfer return sớm (cùng bug đã fix ở SpeakWordQuestion/SpeakSentenceQuestion, nhưng MinimalPairs chưa được fix).
2. **UX flow sai** — nói xong hiện transcript ngay ("Bạn đã đọc: ...", line 183-188). User muốn:
   - Ẩn kết quả ghi âm cho đến khi nhấn "Kiểm tra"
   - Trước khi kiểm tra, cho ghi âm lại (retake) nếu muốn
   - Chỉ hiện transcript + đúng/sai khi nhấn "Kiểm tra kết quả"

## 2. Thiết kế — Sóng âm: 2 instance hook

### Quyết định
2 từ ghi độc lập → 2 waveform riêng. Dùng **2 instance `useWaveformRecorder()`**:

```tsx
const recorder0 = useWaveformRecorder();  // cột trái
const recorder1 = useWaveformRecorder();  // cột phải
```

### Lý do 2 instance (không 1 chung)
- 2 từ ghi riêng (SpeechRecognition 1 lúc 1 từ), sóng phải gắn cột đúng.
- 1 instance + move container wavesurfer không hỗ trợ tốt (API cần container cố định lúc init).
- 2 instance là pattern tự nhiên, mỗi instance lifecycle độc lập.

### Container luôn render (replicate pattern SpeakWordQuestion line 137-142)
Mỗi cột render `containerRef` riêng, **luôn render**, ẩn CSS khi idle:

```tsx
{pairs.map((pair, index) => {
  const recorder = index === 0 ? recorder0 : recorder1;
  // ... nội dung cột ...
  <div
    ref={recorder.containerRef}
    className={`rounded-lg bg-neutral-50 p-2 transition-all ${
      statuses[index] === "recording" ? "opacity-100" : "h-0 overflow-hidden opacity-0 py-0"
    }`}
  />
  // hint text theo recorder.level (chỉ hiện khi cột đó recording)
})}
```

### Hành vi sóng
- User bấm "🎤 Bấm để nói" cột 0 → `recorder0.start()` → sóng cột 0 hiện (scrolling + dynamic color), cột 1 ẩn (idle).
- User bấm cột 1 → `recorder1.start()` → sóng cột 1 hiện, cột 0 đã dừng.
- "Ghi lại" (retake) → `recorder[index].start()` → `clearWaveform()` (đã có trong hook) xóa sóng cũ cột đó → thu mới.

### Dynamic feedback
Mỗi recorder có `level` riêng (`"silence" | "normal" | "loud"`). Hint text hiện theo cột đang thu, chỉ khi `statuses[index] === "recording"`:

```tsx
{statuses[index] === "recording" && (
  <p className={`text-sm font-bold ${hintText(recorder.level).color}`}>
    {hintText(recorder.level).text}
  </p>
)}
```

## 3. Thiết kế — UX Retake Flow (hướng A)

### State hiện tại
```tsx
statuses: Array<"idle" | "recording" | "recorded">  // giữ nguyên
transcripts: string[]  // giữ (ẩn UI, vẫn lưu state)
overallStatus: "idle" | "processing" | "correct" | "incorrect"  // giữ
```

### Thay đổi UI

**Bỏ:** Block hiện transcript ngay khi recorded (line 183-188 hiện tại — xóa).

**Thêm/đổi trong mỗi cột (khi `statuses[index] === "recorded"`):**
1. **Checkmark indicator** "✓ Đã ghi" (nhỏ, neutral) — chỉ báo đã ghi xong, **không** hiện transcript. Giúp user phân biệt 2 cột đã ghi chưa (2 cột dễ nhầm).
2. **Nút "🎤 Ghi lại"** — cho retake trước khi kiểm tra. Click → `startRecording(index)` → status về "recording" → thu mới (clearWaveform xóa sóng cũ).

```tsx
{statuses[index] === "recorded" && (
  <div className="mt-3 space-y-2 text-center">
    <p className="text-sm font-bold text-neutral-500">✓ Đã ghi</p>
    <button type="button" onClick={() => startRecording(index)}
      className="w-full rounded-lg border-2 border-warning-300 bg-white px-4 py-2 text-sm font-bold text-warning-700 hover:bg-warning-50">
      🎤 Ghi lại
    </button>
  </div>
)}
```

**Nút "Kiểm tra kết quả" (giữ, đã có line 202-206):** `canCheck = statuses[0] === "recorded" && statuses[1] === "recorded"`. Nhấn → `checkBothAnswers()` → `overallStatus` = correct/incorrect → hiện transcript + đúng/sai (giữ block kết quả line 207-235).

**Lý do checkmark (không ẩn hoàn toàn):** Ẩn transcript đúng yêu cầu, nhưng cần indicator trạng thái để user biết cột nào đã ghi — không phải "kết quả" mà chỉ là "đã ghi xong". Tránh nhầm 2 cột.

### Flow đầy đủ
1. Mount → 2 cột idle, nút "🎤 Bấm để nói" mỗi cột.
2. Bấm cột 0 → recording (sóng hiện) → nói xong → "recorded" → hiện "✓ Đã ghi" + nút "🎤 Ghi lại" (transcript ẩn).
3. Bấm cột 1 → recording → "recorded" → "✓ Đã ghi" + "Ghi lại".
4. (Tùy chọn) Nhấn "Ghi lại" cột 0/1 → thu lại → clearWaveform → sóng mới.
5. Cả 2 recorded → nút "✓ Kiểm tra kết quả" enabled.
6. Nhấn kiểm tra → processing → correct/incorrect → hiện transcript + đúng/sai cả 2.
7. "Tiếp theo" hoặc "Làm lại" (giữ).

## 4. startRecording cleanup

Khi retake (`startRecording(index)` trên cột đã recorded), cần reset đúng:
- `recorder[index].reset()` hoặc `clearWaveform()` trước `start()` — sóng cũ xóa.
- `setTranscripts` clear cột đó (nếu đã có transcript cũ).
- `statuses[index]` → "recording".

Logic hiện tại `startRecording` đã có `recorder.reset()` (line 122) + `setStatuses` → giữ, nhưng cần đảm bảo dùng đúng recorder index (`recorder0`/`recorder1` thay vì 1 `recorder` chung).

## 5. Test Design

Smoke test thủ công (mic + getUserMedia cần browser thật — test tự động chưa cover UI DOM):
- [ ] Vào bài speak_minimal_pairs → 2 cột, sóng không hiện lúc idle (ẩn CSS OK).
- [ ] Bấm cột 0 → sóng hiện + dynamic color (xám/xanh/vàng) + hint text.
- [ ] Nói xong → "✓ Đã ghi" + nút "Ghi lại", **không** hiện transcript.
- [ ] Bấm cột 1 → sóng cột 1 hiện, cột 0 đã dừng.
- [ ] Nhấn "Ghi lại" cột 0 → sóng cũ cột 0 biến mất → thu mới (không còn sóng cũ).
- [ ] Cả 2 ghi → "Kiểm tra kết quả" enabled → nhấn → hiện transcript + đúng/sai.
- [ ] Chuyển câu (next) → 2 waveform reset sạch.

Không thêm test tự động (component UI voice, mic-dependent — nằm ngoài scope unit test hiện có). Giữ 62 test hiện tại pass.

## 6. Files

| File | Thay đổi |
|---|---|
| `frontend/src/app/exercises/[id]/SpeakMinimalPairsQuestion.tsx` | Sửa: 2 instance hook, container luôn render mỗi cột, bỏ block transcript-recorded, thêm checkmark + nút Ghi lại, startRecording dùng recorder[index]. |
| `frontend/src/hooks/useWaveformRecorder.ts` | KHÔNG sửa (clearWaveform đã có từ fix trước). |

## 7. Rủi ro

1. **2 AudioContext song song** — mỗi `useWaveformRecorder` tạo AudioContext riêng khi start. Nếu user chuyển nhanh giữa 2 cột, có thể có 2 AudioContext tồn tại ngắn. Cleanup `audioCtx.close()` trong stop/reset đã handle. Rủi ro thấp (browser cho phép nhiều AudioContext).
2. **SpeechRecognition + getUserMedia 2 instance** — chỉ 1 recorder active lúc nào (user nói 1 từ), nhưng 2 instance đều register plugin wavesurfer. Khi `recorder0.start()` rồi `recorder1.start()` mà recorder0 chưa stop → 2 stream mic. **Mitigate:** `startRecording(index)` gọi `recorder[1-index].stop()` nếu đang recording (dừng cột kia khi chuyển cột).
3. **Checkmark vs transcript** — user có thể nhầm "✓ Đã ghi" là kết quả. Mitigate: text rõ "Đã ghi" (không "Đúng"), màu neutral (không success xanh). Transcript chỉ hiện sau check.

## 8. Defer (ngoài scope)

- Per-phoneme coloring (SP3 defer C) — không đụng.
- Scoring multiplier/retake penalty (SP4b) — không đụng.
- Mode B multi-answer (SP4b) — không đụng.
- 4 UI CĐ4 (SP4b) — không đụng.

## 9. Self-review (pre-commit)

- [ ] Không placeholder/TBD.
- [ ] Không contradiction (Section 2 nói 2 instance, Section 4/5 nhất quán).
- [ ] Scope focused (1 component + 1 hook đã có, không creep).
- [ ] Không ambiguity (field name, state, button text ghi rõ).
