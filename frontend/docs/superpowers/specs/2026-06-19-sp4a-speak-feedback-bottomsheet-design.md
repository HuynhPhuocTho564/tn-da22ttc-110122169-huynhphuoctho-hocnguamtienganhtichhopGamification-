# SP4a-followup 2: Speak Feedback — Bottom Sheet (Persistent Contextual Feedback)

**Ngày:** 2026-06-19
**Loại:** Design spec (UX redesign — fix layout shift)
**Scope:** 1 component mới `SpeakFeedbackSheet.tsx` + sửa 3 component speak (`SpeakWordQuestion` / `SpeakSentenceQuestion` / `SpeakMinimalPairsQuestion`)
**Phụ thuộc:** SP4a (3 component voice đã tách + waveform), SP4a-followup (MinimalPairs 2 instance + retake flow)

## 1. Bối cảnh & Vấn đề

3 dạng bài speak (luyện miệng / thực chiến / thử thách kép) hiện dùng **Kiểu 2 — Inline/Centralized feedback**: khi đúng/sai, block kết quả **thay thế** nội dung card (block swap `status === "correct"` / `status === "incorrect"`), đẩy các thành phần khác lên/xuống → **Layout Shift (giật khung hình)**. Người dùng mất dấu vị trí nút bấm, mất ngữ cảnh câu hỏi.

User yêu cầu chuyển sang **Kiểu 1 — Bottom Sheet (Persistent Contextual Bottom Sheet)** — "tiêu chuẩn vàng" Duolingo/Babbel:
- Phản hồi trồi lên từ đáy, **cố định ở 1 tầng riêng** (overlay), không đẩy nội dung.
- Câu hỏi (IPA / từ ẩn / audio) **giữ nguyên** phía trên → user đối chiếu tại sao sai.
- 2 nút: **Thử lại** (outline, trái) + **Tiếp theo** (đậm, phải) — nằm vùng ngón cái (Fitts's Law).

Luyện tai (`ListenFeedbackSheet`) **đã đúng pattern này** (line 68-148: `fixed bottom-0`, icon ✓/✗, "Bạn chọn X đáp án Y", nút Tiếp theo/Đã hiểu). Spec này áp dụng pattern tương tự cho 3 dạng speak — **không refactor** `ListenFeedbackSheet` (tránh regress luyện tai đang chạy OK).

## 2. Thiết kế — Component `SpeakFeedbackSheet`

### Vai trò
Bottom-sheet slide-up dùng chung cho 3 dạng speak. Cố định đáy, overlay (không đẩy content), border-t + shadow tách layer rõ.

### Props
```tsx
type SpeakFeedbackSheetProps = {
  isCorrect: boolean;
  transcript: string;            // "Bạn nói: ..." — text SpeechRecognition nhận được
  answerText: string;            // "đáp án: ..." — từ/câu đúng (chỉ hiện khi sai)
  retryLabel?: string;           // "Thử lại" (mặc định) | "Làm lại cả 2" (minimal_pairs)
  audioReplay?: React.ReactNode; // nút nghe lại (render prop — chỉ hiện khi sai)
  onRetry: () => void;
  onNext: () => void;
};
```

**Lý do `audioReplay?: React.ReactNode` (render prop):** 3 dạng có audio khác nhau — word = nút 🔊 mp3, sentence = nút 🎧 speechSynthesis, minimal_pairs = 2 nút 🔊. Thay vì nhồi logic audio vào sheet, mỗi component inject node sẵn → sheet chỉ render. DRY sheet + linh hoạt audio.

### Cấu trúc JSX (theo pattern `ListenFeedbackSheet` line 68-148)
```tsx
// Entrance slide-up: mount ở translate-y-full → rAF flip sang translate-y-0
const [entered, setEntered] = useState(false);
useEffect(() => {
  const r = requestAnimationFrame(() => setEntered(true));
  return () => cancelAnimationFrame(r);
}, []);

return (
  <div
    role="status" aria-live="polite"
    className={`fixed bottom-0 left-0 right-0 z-50 border-t-4 p-4 shadow-2xl transition-transform duration-300 sm:p-6 ${
      entered ? "translate-y-0" : "translate-y-full"
    } ${isCorrect ? "border-success-400 bg-success-50" : "border-error-400 bg-error-50"}`}
  >
    <div className="mx-auto flex max-w-4xl flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
      <div className="flex flex-1 items-start gap-4">
        {/* Icon ✓/✗ */}
        <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-white text-xl font-black ${
          isCorrect ? "text-success-600" : "text-error-600"}`} aria-hidden="true">
          {isCorrect ? "✓" : "✗"}
        </div>
        <div className="space-y-3">
          <h2 className={`text-2xl font-bold ${isCorrect ? "text-success-700" : "text-error-700"}`}>
            {isCorrect ? "Xuất sắc!" : "Chưa chính xác"}
          </h2>
          <p className="font-medium text-neutral-800">
            Bạn nói: <span className={`font-bold ${isCorrect ? "text-success-700" : "text-error-700"}`}>"{transcript || "Không rõ"}"</span>
            {!isCorrect && <> — đáp án: <span className="font-bold text-success-700">"{answerText}"</span></>}
          </p>
          {/* Nút nghe lại: chỉ khi sai */}
          {!isCorrect && audioReplay}
        </div>
      </div>
      {/* 2 nút: Thử lại (outline, chỉ khi sai) + Tiếp theo (đậm) */}
      <div className="flex gap-2 sm:mt-2">
        {!isCorrect && (
          <button type="button" onClick={onRetry}
            className="rounded-xl border-2 border-error-300 bg-white px-6 py-4 font-bold text-error-700 hover:bg-error-50 focus:outline-none focus-visible:ring-4 focus-visible:ring-error-300">
            🔄 {retryLabel ?? "Thử lại"}
          </button>
        )}
        <button type="button" onClick={onNext}
          className={`rounded-xl px-8 py-4 text-lg font-bold text-white focus:outline-none focus-visible:ring-4 ${
            isCorrect ? "bg-success-600 hover:bg-success-700 focus-visible:ring-success-300"
                      : "bg-error-600 hover:bg-error-700 focus-visible:ring-error-300"}`}>
          Tiếp theo →
        </button>
      </div>
    </div>
  </div>
);
```

### Quyết định thiết kế
- **Màu sai = `error` (đỏ)** — khác `ListenFeedbackSheet` (dùng `warning`/vàng cho sai). Lý do: speak component hiện tại đã dùng `error` cho sai (line 207-234), và user yêu cầu rõ "Đỏ nhạt (Sai)". Giữ nhất quán speak = đỏ.
- **Dùng raw `<button>`** (không `Button` component) — cần 2 nút outline + filled, raw button cho control đầy đủ. `ListenFeedbackSheet` dùng `Button` vì chỉ 1 nút.
- **Đúng = 1 nút** (Tiếp theo), **sai = 2 nút** (Thử lại + Tiếp theo) — đúng pattern Duolingo (đúng thì chỉ advance, sai mới retry).
- **`z-50`** — đảm bảo overlay trên card shadow.

## 3. Thiết kế — Mockup + Flow

### Khi sai (speak_word ví dụ "sheep" → user nói "Fi")
```
┌─────────────────────────────────────────┐
│  🗣️ Luyện miệng                          │  ← câu hỏi GIỮ NGUYÊN (không đẩy)
│       /ʃiːp/                            │  ← IPA trên (hiện luôn)
│        •••••                            │  ← từ ẩn
│       [🔊 Nghe mẫu]                     │  ← audio card (context, vẫn hiện)
└─────────────────────────────────────────┘
  ↓ (sheet đè lên từ đáy, KHÔNG đẩy content)
═══════════════════════════════════════════  ← border-t-4 + shadow-2xl (tách layer)
┌─────────────────────────────────────────┐
│ ✗  Chưa chính xác                        │  ← bottom-sheet (z-50, slide-up)
│    Bạn nói: "Fi" — đáp án: "Sheep"       │
│    [🔊 Nghe lại mẫu]                     │  ← audioReplay (chỉ khi sai)
│              [🔄 Thử lại] [Tiếp theo →]  │
└─────────────────────────────────────────┘
```

### Khi đúng
```
═══════════════════════════════════════════
┌─────────────────────────────────────────┐
│ ✓  Xuất sắc!                             │  ← không nút nghe lại
│    Bạn nói: "Sheep"                      │
│                         [Tiếp theo →]    │  ← chỉ 1 nút
└─────────────────────────────────────────┘
```

### Flow
1. User nói → `checkAnswer` → status `correct`/`incorrect`.
2. Card giữ nguyên IPA/word/audio (không swap). Mic + waveform ẩn (recording đã xong).
3. `<SpeakFeedbackSheet>` mount → slide-up từ đáy → overlay.
4. Sai → user nghe lại (audioReplay) + Thử lại (`onRetry` → `startRecording` reset thu mới) hoặc Tiếp theo (`onNext` → advance).
5. Đúng → chỉ Tiếp theo.
6. Chuyển câu → sheet unmount (component reset qua `useEffect [question.id]`).

## 4. Thiết kế — Integrate 3 component

Nguyên tắc chung: **xóa block inline correct/incorrect, giữ nguyên tầng IPA/word/audio (unconditional), render sheet khi status đúng/sai.**

### `SpeakWordQuestion.tsx`
- **Xóa:** block `status === "correct"` (line 190-205) + `status === "incorrect"` (line 207-234).
- **Giữ:** IPA (114-116) + từ ẩn (118-127) + audio (129-132) — đã unconditional, không đổi.
- **Thêm** (cuối card, sau tất cả block status): khi `status === "correct" || status === "incorrect"` → render:
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
- `AudioButton` đã có (line 33-45) — tái dùng inject vào `audioReplay`.

### `SpeakSentenceQuestion.tsx`
- **Xóa:** block `status === "correct"` (177-190) + `status === "incorrect"` (192-213).
- **Giữ:** câu ẩn (103-112) + audio speechSynthesis (114-120).
- **Thêm:** render sheet khi correct/incorrect:
```tsx
audioReplay={
  <button type="button" onClick={() => playSentence(question.answer)} ...>🎧 Nghe lại câu mẫu</button>
}
answerText={question.answer}
```
- `playSentence` đã có (line 28-37) — tái dùng.

### `SpeakMinimalPairsQuestion.tsx`
- **Xóa:** nhánh `overallStatus === "correct"` (line 226-235) + nhánh `incorrect` (236-254) trong block check/results.
- **Giữ:** 2 cột (168-218) + nút check (221-225, chỉ hiện khi `idle`/`processing`).
- **Đổi** cấu trúc check/results: nhánh `correct`/`incorrect` → render sheet (thay vì inline block). 2 cột vẫn hiện (context: user thấy 2 từ + IPA đối chiếu).
```tsx
{(overallStatus === "correct" || overallStatus === "incorrect") && (
  <SpeakFeedbackSheet
    isCorrect={overallStatus === "correct"}
    transcript={combinedTranscript}
    answerText={`${pairs[0].word} & ${pairs[1].word}`}
    retryLabel="Làm lại cả 2"
    audioReplay={
      <div className="flex flex-wrap gap-2">
        <AudioButton audioUrl={pairs[0].audioUrl} label={`🔊 ${pairs[0].word}`} />
        <AudioButton audioUrl={pairs[1].audioUrl} label={`🔊 ${pairs[1].word}`} />
      </div>
    }
    onRetry={() => {
      setOverallStatus("idle"); setStatuses(["idle", "idle"]); setTranscripts(["", ""]);
      recorder0.reset(); recorder1.reset();
    }}
    onNext={() => onNext(overallStatus === "correct", combinedTranscript)}
  />
)}
```
- `onRetry` = logic reset "Làm lại" hiện tại (line 245) — giữ nguyên, chỉ chuyển sang sheet.
- `retryLabel="Làm lại cả 2"` (thay "Thử lại") — rõ nghĩa 2 từ.

## 5. Animation + Edge cases

### Entrance slide-up
- Mount ở `translate-y-full` → `requestAnimationFrame` flip sang `translate-y-0` → CSS `transition-transform duration-300` chạy slide-up.
- **Exit:** sheet unmount ngay khi status đổi (next/retry) — không exit animation (chấp nhận, match Duolingo exit nhanh). Ghi note: exit anim = future polish (cần unmount delay + state exit, phức tạp hơn, YAGNI).

### Edge cases
- **`transcript` rỗng** (SpeechRecognition không bắt được) → sheet hiện `"Không rõ"` (đã handle trong JSX: `transcript || "Không rõ"`).
- **`audioReplay` undefined** (không có audioUrl) → sheet chỉ hiện text, không nút nghe. `AudioButton` đã return `null` khi không audioUrl.
- **Mic button khi sheet hiện** — mic ở trong block `status === "idle"`, khi correct/incorrect block đó ẩn → không xung đột với sheet.
- **Sheet che audio card?** — sheet `fixed bottom-0` cao ~40vh. Card audio ở giữa. Nếu card dài, sheet có thể che phần dưới. Mitigate: sheet `max-h-[40vh] overflow-y-auto`, card content quan trọng (IPA/word) ở trên luôn nhìn thấy. Audio card cũng có trong sheet (audioReplay) khi sai → không mất khả năng nghe.

## 6. Test Design

Smoke test thủ công (mic + browser thật — ngoài scope unit test UI):
- [ ] speak_word: nói sai → sheet slide-up đỏ từ đáy, "Bạn nói: X — đáp án: Y", nút Thử lại + Tiếp theo. Card IPA/word KHÔNG dịch chuyển.
- [ ] speak_word: nói đúng → sheet xanh, chỉ nút Tiếp theo. Không nút nghe lại.
- [ ] speak_word: nhấn Thử lại → sheet unmount → mic hiện lại → thu mới (sóng cũ clear).
- [ ] speak_sentence: sai → sheet, audioReplay = 🎧 speechSynthesis. Card câu ẩn giữ nguyên.
- [ ] speak_minimal_pairs: check → sai → sheet, 2 nút 🔊 nghe 2 từ, retryLabel "Làm lại cả 2". 2 cột giữ nguyên phía trên.
- [ ] speak_minimal_pairs: nhấn "Làm lại cả 2" → sheet unmount → 2 cột reset idle → thu lại.
- [ ] Chuyển câu (Tiếp theo) → sheet unmount sạch, câu mới mount idle.

Không thêm unit test (UI overlay + mic-dependent — ngoài scope test tự động hiện có). Giữ 62 test pass.

## 7. Files

| File | Thay đổi |
|---|---|
| `frontend/src/app/exercises/[id]/SpeakFeedbackSheet.tsx` | **MỚI** — component bottom-sheet (props + JSX section 2). |
| `frontend/src/app/exercises/[id]/SpeakWordQuestion.tsx` | Sửa: xóa block correct/incorrect inline, render `<SpeakFeedbackSheet>`. |
| `frontend/src/app/exercises/[id]/SpeakSentenceQuestion.tsx` | Sửa: tương tự word, audioReplay = speechSynthesis. |
| `frontend/src/app/exercises/[id]/SpeakMinimalPairsQuestion.tsx` | Sửa: xóa nhánh correct/incorrect inline, render sheet với retryLabel "Làm lại cả 2" + 2 audioReplay. |
| `frontend/src/app/exercises/[id]/ListenFeedbackSheet.tsx` | KHÔNG sửa (luyện tai đã đúng pattern, tránh regress). |
| `frontend/src/hooks/useWaveformRecorder.ts` | KHÔNG sửa. |

## 8. Rủi ro

1. **Sheet che content card** — nếu card dài (đặc biệt minimal_pairs 2 cột), sheet 40vh có thể che nút audio card. Mitigate: audioReplay có trong sheet khi sai; content quan trọng (IPA/word) ở trên. Test thực, nếu che nhiều → giảm `max-h` hoặc thêm `scroll-padding-bottom`.
2. **Màu sai khác luyện tai** — speak = `error` (đỏ), listen = `warning` (vàng). Đây là quyết định có chủ đích (user yêu cầu đỏ + nhất quán speak hiện tại), nhưng tạo slight inconsistency giữa 2 loại feedback. Ghi note: nếu muốn uniform sau, refactor chung (SP sau, ngoài scope).
3. **Exit animation thiếu** — sheet biến mất đột ngột khi next/retry (không slide-down). Chấp nhận (Duolingo cũng exit nhanh). Future polish nếu user report.
4. **z-50 conflict** — nếu có modal/toast khác z-index cao hơn. Hiện không có → OK. Ghi note.

## 9. Defer (ngoài scope)

- Refactor `ListenFeedbackSheet` + `SpeakFeedbackSheet` thành `FeedbackSheet` chung (DRY tối đa) — ngoài scope, rủi ro regress luyện tai.
- Exit animation (slide-down) — future polish.
- Per-phoneme coloring (SP3 defer C) — không đụng.
- Scoring multiplier/retake penalty + Mode B multi-answer + 4 UI CĐ4 (SP4b) — không đụng.

## 10. Self-review (pre-commit)

- [ ] Không placeholder/TBD.
- [ ] Không contradiction (Section 2 nói màu error cho sai, Section 8 ghi note consistency — nhất quán).
- [ ] Scope focused (1 component mới + 3 sửa, không refactor listen).
- [ ] Không ambiguity (props ghi rõ, line reference cụ thể, retryLabel default + override minimal_pairs).
- [ ] Spec coverage: Section 1 vấn đề → 2 component → 3 mockup → 4 integrate → 5 animation/edge → 6 test → 7 files → 8 rủi ro → 9 defer.
