# SP1 — Feedback trong lúc làm bài (In-Exercise Feedback) Design

Ngày: 2026-06-18
Trạng thái: design đã được user duyệt (hướng A: module dùng chung + tách feedback component)
Scope: SP1 của 3 sub-project hệ thống feedback. SP1 = Lớp 1 (giác quan: SFX+shake+color) + Lớp 3 (gamification: combo+praise) cho **tất cả mode**; Lớp 2 (kiến thức: contrast+IPA+meaning) cho **Mode A (listen_choose)**. Defer SP2 (màn hình tổng kết redesin) + SP3 (per-phoneme coloring, WPM).

## Mục tiêu

Hệ thống phản hồi trong lúc làm phải tuân thủ "Tức thì - Chính xác - Không gây áp lực" (Nielsen 0.1s response time + Cambridge SLA corrective feedback + Duolingo combo motivation). 3 lớp:

- **Lớp 1 (giác quan, <0.1s)**: SFX ting/buzz + nút đổi màu + shake animation khi sai.
- **Lớp 2 (kiến thức, Mode A)**: contrast comparison ("/ɪ/ ngắn vs /iː/ dài") + IPA đầy đủ + nghĩa + nghe lại cả 2 âm để so sánh (minimal pairs contrast — British Council/Cambridge).
- **Lớp 3 (gamification)**: combo streak 🔥 (3/5/7 milestone) + lời khen ngẫu nhiên.

## 1. Hiện trạng (nền tảng, không xây từ đầu)

- Bottom sheet feedback Mode A đã có: `ExerciseEngineClient.tsx:1113-1158` (đúng/sai + màu + đáp án đúng + hint + nút "Tiếp theo").
- Voice mode feedback inline: `VoiceQuestion`/`MinimalPairsQuestion` (transcript vs đáp án + thử lại).
- Submit API trả rewards/badges/summary — không liên quan SP1 (SP1 chỉ trong lúc làm, trước submit).
- **Engine đã 1159 dòng** — vấn đề maintainability. SP1 tách feedback sheet + SFX module + combo hook ra file riêng (targeted improvement, đúng hướng brainstorming skill).

## 2. Khoảng trống khả thi (feasibility gaps) xử lý trong SP1

- **SFX**: KHÔNG có infra → xây `lib/sfx.ts` Web Audio oscillator (không cần file mp3). **Xử lý SP1.**
- **Combo streak**: không có → `hooks/useComboStreak.ts`. **Xử lý SP1.**
- **Contrast audio**: `WordItem.audioUrl` có trong DB nhưng chưa có trong content JSON câu hỏi → re-seed nhỏ bake vào. **Xử lý SP1.**

**Defer (ra khỏi SP1):**
- Confetti — SP2.
- Streak 🔥 ngày (consecutive days) + previousBest ("tốt hơn X% lần trước") — SP2 (cần expose từ submit API).
- Per-phoneme coloring (Mode B) + WPM (Mode D) — SP3 (cần engine align mới + timing instrumentation).

## 3. Hướng A — Module dùng chung + tách feedback component

| Đơn vị | File | Trách nhiệm |
|---|---|---|
| SFX module (SP2 tái dùng `playTada`) | `src/lib/sfx.ts` | Web Audio oscillator — `playSfx("correct"\|"wrong"\|"tada")`, mute localStorage, prefers-reduced-motion |
| Combo hook (dùng chung all mode) | `src/hooks/useComboStreak.ts` | combo counter + 🔥 milestone + lời khen ngẫu nhiên popup |
| Feedback sheet Mode A (tách khỏi engine) | `src/app/exercises/[id]/ListenFeedbackSheet.tsx` | Lớp 2 contrast + IPA + nghĩa + 2 loa nghe so sánh |
| Header engine (combo + mute render) | sửa `ExerciseEngineClient.tsx` header (dòng 1079-1094) | 🔥 combo + popup praise + nút 🔊/🔇 + nút "← Lộ trình" |
| Shake animation | `src/app/globals.css` | `@keyframes shake` + `.animate-shake` + prefers-reduced-motion guard |
| Seed contrast audio | `prisma/seed_listen_choose_audio.ts` (mới) | bake option.audioUrl vào content JSON (copy từ WordItem DB, không re-fetch) |

Lý do chọn A: engine đã 1159 dòng → tách ra đơn vị nhỏ có trách nhiệm rõ, mỗi unit hiểu/test độc lập. SFX module thiết kế để SP2 tái dùng (`playTada` cho confetti). Combo hook dùng chung all mode.

## 4. `lib/sfx.ts` — module Web Audio oscillator

```ts
export type SfxName = "correct" | "wrong" | "tada";
export function playSfx(name: SfxName): void;
export function isSfxMuted(): boolean;                 // đọc localStorage "sfx_muted"
export function setSfxMuted(muted: boolean): void;     // toggle, lưu localStorage
export function useSfxMuted(): [boolean, (m: boolean) => void]; // hook cho nút mute header
```

- **Lazy AudioContext**: tạo lần đầu `playSfx` (autoplay policy: click đáp án = user gesture, OK).
- **correct**: sine 880Hz, 0.15s, fade-out (ting thanh thoát).
- **wrong**: sawtooth 180Hz, 0.2s, fade-out (buzz trầm, không chói).
- **tada**: arpeggio C5-E5-G5 quick (SP2 tái dùng lúc tổng kết ≥80%).
- **Mute**: localStorage `sfx_muted` ("1"=muted). Nút 🔊/🔇 header.
- **prefers-reduced-motion**: SFX là sound (không phải motion) → giữ ngay cả khi reduce-motion (ghi note: có thể thêm "reduce sound" preference sau nếu cần — YAGNI SP1).

## 5. `hooks/useComboStreak.ts` — combo + praise (chung all mode)

```ts
export function useComboStreak(): {
  combo: number;
  praise: string | null;      // lời khen hiện 0.6s khi milestone
  onCorrect: () => void;      // combo++, praise nếu milestone
  onWrong: () => void;        // combo=0
  reset: () => void;          // finish exercise
};
```

- **Combo milestone 🔥**: combo≥3 → 🔥 nhỏ (text-warning-600), ≥5 → 🔥 to + class, ≥7 → 🔥 + sparkle effect. Render ở header engine (cạnh điểm).
- **Lời khen ngẫu nhiên**: `["Chính xác!", "Giỏi lắm!", "Rất tốt!", "Đỉnh quá!", "Bạn làm được rồi!"]`, hiện popup 0.6s mỗi milestone (3/5/7...). Popup overlay centered, fade in/out.
- **Reset**: `onWrong` → combo=0; `reset()` → combo=0 (gọi lúc finish).
- **Dùng chung all mode**: header render 🔥 + praise cho cả Mode A (listen_choose) và Mode B/C/D (voice).

## 6. `ListenFeedbackSheet.tsx` — Lớp 2 Mode A (tách khỏi engine)

Tách bottom sheet (`ExerciseEngineClient.tsx:1113-1158`) ra component. Props:
```ts
type ListenFeedbackSheetProps = {
  isCorrect: boolean;
  selectedAnswer: string | null;
  question: ExerciseQuestion;       // chứa content JSON (word, ipa, options[].audioUrl)
  hint: string;
  onAdvance: () => void;            // "Tiếp theo" / "Đã hiểu"
};
```

**Khi ĐÚNG** (xanh lá, `playSfx("correct")`):
- Icon ✓ + lời khen (từ combo hook hoặc "Tuyệt vời!").
- `Word  /IPA/  Nghĩa` (nghĩa = `WordItem.meaningVi` nếu có trong content — best-effort; nếu không có → ẩn).
- Highlight IPA target trong IPA đầy đủ: tô màu (success) segment `targetPhoneme` trong `/ʃiːp/` (vd `/ʃ`**`iː`**`p/`). Deterministic, không cần spelling→phoneme map. (Highlight segment word "ee" trong "sheep" = nice-to-have nhưng cần map spelling→phoneme — defer, YAGNI SP1.)
- Nút "🔊 Phát lại" (audio mục tiêu).
- Nút "Tiếp theo →" (success).

**Khi SAI** (cam san hô, `playSfx("wrong")` + shake):
- Icon ✗ + "Chưa chính xác".
- **Contrast comparison**: "Bạn chọn `{selected}` ({mô tả ngắn}), đáp án `{correct}` ({mô tả ngắn})". Mô tả ngắn = best-effort từ IPA metadata (dài/ngắn/tròn/mũi...) — nếu không có → chỉ hiện IPA.
- **2 nút loa cạnh nhau** "So sánh 2 âm":
  - 🔊 `{selected}` (audio của âm user chọn — từ `option.audioUrl` bake vào content).
  - 🔊 `{correct}` (audio của âm đúng).
- Nút "Đã hiểu →" (advance).

**Graceful**: option không có `audioUrl` (distractor không phải word ACTIVE) → ẩn nút loa cho option đó, vẫn hiện contrast text. Không crash.

## 7. Voice mode (B/C/D) — SFX + combo (không tách inline)

Voice mode giữ inline feedback hiện tại (`VoiceQuestion` transcript vs đáp án + nút thử lại). Thêm:
- `playSfx("correct"|"wrong")` gọi lúc `onNext(correct, transcript)` (đúng → ting, sai → buzz).
- Combo hook dùng chung — 🔥/praise render ở header (cùng như Mode A).
- **KHÔNG thêm Lớp 2 contrast cho voice SP1** (per-phoneme coloring = SP3 defer).

## 8. Shake animation (globals.css)

```css
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  20%, 60% { transform: translateX(-6px); }
  40%, 80% { transform: translateX(6px); }
}
.animate-shake { animation: shake 0.4s ease-in-out; }

@media (prefers-reduced-motion: reduce) {
  .animate-shake { animation: none; }
}
```
Áp dụng `.animate-shake` cho nút đáp án sai lúc `isAnswered && !isCorrect` (Mode A) — hoặc cho feedback sheet (Mode A). Voice mode: shake không áp dụng inline (voice không có "nút chọn" — feedback là transcript). Combo reset trigger shake? Không — shake chỉ cho nút sai.

## 9. Seed: bake contrast audioUrls vào content listen_choose

Script `prisma/seed_listen_choose_audio.ts` (idempotent, copy audioUrl từ WordItem DB hiện có, **KHÔNG re-fetch**):

For mỗi Question listen_choose (qtype-1-mc) ACTIVE:
1. Parse content JSON hiện tại (lấy `options[]`).
2. For mỗi option `{id, text}`: tìm `WordItem` có `word === text && status === "ACTIVE"` → lấy `audioUrl`.
3. Nếu có audioUrl → gán `option.audioUrl`. Nếu không → để `option.audioUrl = undefined` (ListenFeedbackSheet ẩn nút loa).
4. `upsert` Question với content JSON mới (options có audioUrl). KHÔNG đụng audio file, KHÔNG re-fetch API.

**Lưu ý**: nếu spec listen_choose 3-stage (phoneme-ID) đã làm trước SP1 → option là IPA chứ không phải word, audio contrast = audio của **word đại diện** cho mỗi IPA (từ sound group). Script sẽ xử lý cả 2 case (word-option hoặc phoneme-option) — quyết định ở plan dựa thứ tự thực thi. Cả 2 đều hoạt động với ListenFeedbackSheet.

## 10. Scope, edge cases, testing, file

**Scope SP1:**
- Lớp 1 (SFX+shake+color): all mode.
- Lớp 3 (combo+praise): all mode.
- Lớp 2 (contrast+IPA+meaning): Mode A only.
- Defer: confetti (SP2), streak ngày + previousBest (SP2), per-phoneme coloring + WPM (SP3).

**Edge cases:**
- SFX autoplay blocked lần đầu → lazy AudioContext tạo lúc click (user gesture) → OK.
- Option không có audioUrl → ẩn nút loa, vẫn contrast text (graceful).
- Combo reset khi sai hoặc finish.
- prefers-reduced-motion → bỏ shake (SFX giữ).
- Nghĩa (meaningVi) không có trong content → ẩn, không crash.

**Scope KHÔNG đụng:**
- XP/streak/badge/leaderboard/submit (SP1 chỉ trong lúc làm, trước submit).
- Scoring logic (SP1 không đổi scoring — chỉ thêm SFX/visual feedback).
- Audio local SP3a (seed script copy audioUrl hiện có, không re-fetch).
- Mode speak_word/speak_minimal_pair/speak_sentence inline feedback (giữ nguyên, chỉ thêm SFX+combo).

**Testing:**
- `sfx.ts`: test logic mute/preference (localStorage mock); oscillator sound khó unit test → smoke test thủ công.
- `useComboStreak`: unit test combo++/reset/milestone praise (render hook test).
- `ListenFeedbackSheet`: smoke test thủ công (đúng/sai render, contrast, 2 loa, graceful no-audio).
- Seed script: verify option.audioUrl được gán cho option có WordItem ACTIVE (count check).

**Quality gate:** `prisma validate` + `tsc --noEmit` + `npm test` + `npm run build` pass.

## 11. File sẽ tạo/sửa

| Hành động | File |
|---|---|
| tạo SFX module | `src/lib/sfx.ts` |
| tạo combo hook | `src/hooks/useComboStreak.ts` |
| tạo feedback sheet Mode A | `src/app/exercises/[id]/ListenFeedbackSheet.tsx` |
| sửa engine: header (combo+mute render), import feedback sheet thay inline bottom sheet, gọi playSfx+combo ở listen/voice handler | `src/app/exercises/[id]/ExerciseEngineClient.tsx` |
| tạo shake keyframe | `src/app/globals.css` (thêm `@keyframes shake` + `.animate-shake` + reduced-motion) |
| tạo seed contrast audio | `prisma/seed_listen_choose_audio.ts` (mới) |
| test sfx + combo hook | `src/lib/__tests__/sfx.test.ts` + `src/hooks/__tests__/useComboStreak.test.ts` (mới) |

## 12. Rủi ro & giải pháp

| Rủi ro | Giải pháp |
|---|---|
| SFX autoplay blocked (no user gesture) | Lazy AudioContext tạo lúc click đáp án (gesture). Đã verify pattern. |
| Engine 1159 dòng khó edit an toàn | Tách ListenFeedbackSheet + SFX + combo hook ra file riêng trước, engine import lại. Giảm độ phức tạp. |
| Option không có audioUrl (distractor no-audio) | Graceful: ẩn nút loa, vẫn contrast text. Seed chỉ gán audioUrl cho option có WordItem ACTIVE. |
| Seed script đụng audio SP3a | Script chỉ copy `audioUrl` từ WordItem DB hiện có, KHÔNG re-fetch API. Verify audio count không đổi. |
| Dependency thứ tự với listen_choose 3-stage | ListenFeedbackSheet xử lý cả word-option và phoneme-option. Script seed xử lý cả 2 case. Ghi rõ trong plan. |
| Combo popup chạm timing sensitive (0.6s) | Dùng setTimeout + cleanup, test milestone praise. |
