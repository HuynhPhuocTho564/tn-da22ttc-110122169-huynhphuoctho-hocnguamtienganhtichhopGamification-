# SP2 — Màn hình tổng kết redesin (End-of-Lesson Summary) Design

Ngày: 2026-06-19
Trạng thái: design đã được user duyệt (hướng A: tách ExerciseSummaryScreen + expose API nhỏ + confetti)
Scope: SP2 của hệ thống feedback. Redesin màn hình tổng kết sau bài tập thành layout 3-tier (Peak-End Rule) + confetti ≥80% + progress bias + expose streak/previousBest. Defer metric mode-specific (WPM, per-phoneme coloring) = SP3.

Lưu ý tên: SP2 này = "summary redesin" (feedback hệ thống), **KHÁC** hoàn toàn với `sp2-data-layer-v2` (roadmap gốc schema v2, chưa làm).

## Mục tiêu

Màn hình tổng kết là "điểm chạm" cuối cùng, cực kỳ quan trọng giữ chân user (Retention). Dựa trên Peak-End Rule (Kahneman) + Nielsen Norman + Duolingo/ELSA. 3 tầng:
- **Tầng 1 (top)**: khen ngẫu nhiên theo rating + vòng tròn % lớn + confetti + tada (≥80%).
- **Tầng 2 (middle)**: 3 card XP / Streak 🔥 / Badges + progress bias "tốt hơn X%".
- **Tầng 3 (bottom)**: "Cần chú ý" list lỗi + nghe lại + 2 nút [Làm lại][Về lộ trình].

## 1. Hiện trạng (nền tảng, không xây từ đầu)

Màn hình tổng kết hiện tại: `ExerciseEngineClient.tsx:982-1067` (khi `isFinished`) — icon OK/!, h1 "Hoàn thành/Cần luyện thêm", % + ProgressBar, box "Đang lưu/Kết quả đã lưu" (XP + điểm hạng + level), list "Câu cần luyện lại" (incorrectQuestions: question + selected + correct), nút "Quay về lộ trình".

Submit API response (`api/exercises/submit/route.ts:262-305`): `exerciseScore, rating, summary{timeSpent}, rewards{xpEarned,dailyBonusXp,retakeXp,totalXpEarned,rankingDelta,...}, progress{level,currentXp,nextLevelXp}, dailyActivity, badgesAwarded[], questionResults[{questionId,isCorrect,score,accuracyScore,feedback}]`.

**Thiếu (cần expose):**
- `previousBestScore`: `ExerciseAttempt` prior best đã query nội bộ (`route.ts:132-144`) để tính reward, nhưng **không trả về**. Cần expose cho progress bias.
- `streak`: `User.streakCount/longestStreak` có trong schema nhưng submit route **không select** (`route.ts:91-98` chỉ `{id,xp,level}`). Cần expose để UI render 🔥 ngày.

**Engine đã ~1300 dòng** sau SP1 → SP2 tách `ExerciseSummaryScreen` ra component riêng (targeted improvement, đúng hướng maintainability, nhất quán với ListenFeedbackSheet đã tách ở SP1).

## 2. Khoảng trống khả thi (feasibility gaps) xử lý trong SP2

- **Confetti**: KHÔNG có lib → thêm `canvas-confetti` (~6KB) qua `lib/confetti.ts` wrapper. **Xử lý SP2.**
- **previousBestScore expose**: đã query nội bộ, chỉ thêm vào response. **Xử lý SP2.**
- **streak expose**: thêm select `streakCount/longestStreak` trong submit route + thêm vào response. **Xử lý SP2.** (KHÔNG update streak ở submit — streak chỉ update ở check-in, giữ nguyên.)
- **tada**: đã có từ SP1 (`sfx.ts` `playSfx("tada")`) → tái dụng. **Xử lý SP2.**

**Defer (ra khỏi SP2) — NOTE sửa 19/06: mô tả gốc dưới đây SAI thực tế, giữ để audit:**
- ~~"Metric mode-specific WPM (Mode D) + per-phoneme coloring (Mode B) — SP3"~~ → **SAI**: Mode D KHÔNG tồn tại (chỉ 6 mode: listen_choose/speak_word/speak_minimal_pair/speak_sentence/mode_a_listen_choose/mode_b_speak_match). Mode B là CĐ4 read&match `acceptedAnswers`, không per-phoneme. Per-phoneme coloring **đã có** trong listen_choose (`ListenFeedbackSheet.tsx:55-66`). WPM = tính năng mới phải xây từ đầu (timing instrumentation + `fluencyScore` scoring), không phải "metric mode-specific".
- "Luyện âm /θ/ cụ thể" (actionable advice theo phoneme sai nhiều nhất) — cần route bài tập theo phoneme, chưa có. **ĐÚNG** — feature thực sự (B). SP2 dùng [Làm lại bài này] thay thế (YAGNI).

SP3 thực sự = 2-3 sub-project độc lập (mỗi cái 1 spec riêng): A WPM/fluency mode mới, B route theo phoneme (khuyến nghị), C coloring polish. Chi tiết: `PLAN/00_Project_Context/CURRENT_PROJECT_CONTEXT.md` mục 11.

## 3. Hướng A — Tách component + expose API nhỏ + confetti

| Đơn vị | File | Trách nhiệm |
|---|---|---|
| Confetti wrapper | `src/lib/confetti.ts` | `celebrate()` wrapper canvas-confetti, reduced-motion skip |
| Summary screen component (tách khỏi engine) | `src/app/exercises/[id]/ExerciseSummaryScreen.tsx` | Layout 3-tier, đọc submitResult + incorrectQuestions, gọi confetti/tada |
| Submit API expose | sửa `src/app/api/exercises/submit/route.ts` | Thêm `previousBestScore` + `streak{count,longest}` vào response |
| SubmitResult type mở rộng | sửa `src/app/exercises/[id]/ExerciseEngineClient.tsx` | Thêm field type + render `<ExerciseSummaryScreen>` thay inline block |
| Confetti test | `src/lib/__tests__/confetti.test.ts` | test reduced-motion skip logic |

Lý do chọn A: engine đã ~1300 dòng → tách summary screen ra đơn vị nhỏ có trách nhiệm rõ. Expose API nhỏ (2 field) không phá v1. Confetti wrapper cô lập lib → dễ swap. Progress bias client-side (không thêm API).

## 4. Submit API expose (nhỏ)

Thêm vào submit response (`api/exercises/submit/route.ts`, sau `badgesAwarded` ~line 297):

```ts
previousBestScore: previousBestAttempt?.score ?? null,  // previousBestAttempt đã query line 132-144, select {score}, findFirst orderBy score desc → đó là best trước đó
streak: {
  count: result.updatedUser.streakCount,   // cần thêm streakCount/longestStreak vào user select (line 91-98)
  longest: result.updatedUser.longestStreak,
},
```

Yêu cầu:
- `previousBestAttempt` đã query (`route.ts:132-144`, `findFirst orderBy score desc select {score}`) → dùng `previousBestAttempt?.score ?? null`. Đây là best **trước** attempt hiện tại (query trước khi tạo attempt mới).
- `user` select (`route.ts:91-98`) hiện chỉ `{id, xp, level}` → thêm `streakCount: true, longestStreak: true`. Verify `result.updatedUser` (sau transaction) cũng trả 2 field này — nếu `updatedUser` là re-fetch thì đảm bảo select đầy đủ.
- **KHÔNG update streak** ở submit (chỉ read để expose). Streak update vẫn ở `api/checkin`.

## 5. `lib/confetti.ts` — wrapper canvas-confetti

```ts
import confetti from "canvas-confetti";

function prefersReducedMotion(): boolean {
  if (typeof window === "undefined") return true;
  return window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
}

// Pháo hoa nhẹ, 3 burst. Chỉ gọi khi exerciseScore >= 80.
export function celebrate(): void {
  if (prefersReducedMotion()) return; // tôn trọng reduce-motion
  confetti({ particleCount: 80, spread: 70, origin: { y: 0.6 }, colors: ["#10b981", "#3b82f6", "#f59e0b"] });
  setTimeout(() => confetti({ particleCount: 50, angle: 60, spread: 55, origin: { x: 0, y: 0.7 } }), 200);
  setTimeout(() => confetti({ particleCount: 50, angle: 120, spread: 55, origin: { x: 1, y: 0.7 } }), 400);
}
```

- Cô lập lib → dễ swap/thay particle sau.
- `prefers-reduced-motion` → skip (không confetti cho người nhạy motion).
- Chỉ gọi khi `exerciseScore >= 80` (gọi trong `ExerciseSummaryScreen` useEffect).

## 6. `ExerciseSummaryScreen.tsx` — layout 3-tier

Props:
```ts
type ExerciseSummaryScreenProps = {
  exercise: ExerciseData;
  submitResult: SubmitResult;           // mở rộng: + previousBestScore + streak
  incorrectQuestions: IncorrectQuestion[];
  submitStatus: "idle" | "submitting" | "success" | "error";
  submitError: string | null;
  onRetry: () => void;                  // "Làm lại bài này" (router.reload)
  onExit: () => void;                   // "Về lộ trình" (router.push /learning_map)
};
```

Import `ExerciseData`, `SubmitResult`, `IncorrectQuestion` từ engine (export 3 type này — đã export `ExerciseQuestion`, thêm 2 còn lại).

**Tầng 1 (top) — khen + % + confetti:**
- Khen ngẫu nhiên theo `submitResult.rating`:
  - `EXCELLENT` → "Tuyệt đỉnh!", `GOOD` → "Hoàn thành xuất sắc!", `PASS` → "Bạn đang tiến bộ!", `NEEDS_PRACTICE` → "Cần luyện thêm!".
- Vòng tròn % lớn: CSS `conic-gradient` div hiển thị `exerciseScore%` (vd `background: conic-gradient(#10b981 ${score}%, #e5e7eb 0)`). Tự viết CSS nhỏ (không cần lib), dễ tùy biến màu theo rating.
- useEffect: nếu `exerciseScore >= 80` → `celebrate()` + `playSfx("tada")`. Nếu <80 → chỉ icon, không confetti/tada.

**Tầng 2 (middle) — XP + streak + badges + progress bias:**
- 3 card grid:
  - **XP**: `+{submitResult.rewards.totalXpEarned}` ⭐.
  - **Streak**: `🔥 {submitResult.streak.count} ngày` (chỉ hiện card nếu `count > 0`; nếu 0 → ẩn card hoặc hiện "Chưa có streak").
  - **Badges**: list `submitResult.badgesAwarded` (🏅 + `name`), hoặc "Chưa có badge mới" nếu rỗng.
- **Progress bias** (dưới 3 card, nếu `previousBestScore !== null`):
  - `delta = exerciseScore - previousBestScore`.
  - `delta > 0` → "Tốt hơn {delta}% so với lần trước!" (text-success).
  - `delta === 0` → "Cùng điểm lần trước." (text-neutral).
  - `delta < 0` → "Thấp hơn {-delta}% so với lần trước — cố gắng nhé!" (text-warning, nhẹ nhàng không mắng).
- Box "Đang lưu" / "Lỗi lưu" giữ logic hiện tại (submitStatus === submitting/error).

**Tầng 3 (bottom) — lỗi + nghe lại + 2 nút:**
- "Cần chú ý" heading + list `incorrectQuestions` (format hiện tại: `"word" — bạn chọn {selected}, đáp án đúng {correct}`).
- Mỗi item có nút 🔊 nghe lại audio nếu `parseWordPrompt(question.content).audioUrl` có (tái dụng MiniSpeaker pattern từ ListenFeedbackSheet — hoặc đơn giản inline Audio button).
- 2 nút: [Làm lại bài này] (`onRetry`, variant primary) + [Về lộ trình] (`onExit`, variant ghost).

## 7. Engine integrate (nhỏ)

Engine (`ExerciseEngineClient.tsx`):
- Mở rộng `SubmitResult` type thêm:
  ```ts
  previousBestScore: number | null;
  streak: { count: number; longest: number };
  ```
- Export `ExerciseData`, `IncorrectQuestion` (đã export `ExerciseQuestion`).
- Thay block `if (isFinished) {...}` (~90 dòng, line 982-1067) bằng:
  ```tsx
  if (isFinished) {
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
- Xóa code inline cũ (icon/h1/box/list) — chuyển hết vào component.

## 8. Scope, edge cases, testing, file

**Scope SP2:**
- Layout 3-tier + confetti ≥80% + tada + expose previousBest/streak + progress bias + 2 nút.
- Defer: metric mode-specific WPM/per-phoneme (SP3), "luyện âm cụ thể" (route phoneme).

**Edge cases:**
- `previousBestScore === null` (lần đầu) → ẩn progress bias.
- `streak.count === 0` → ẩn card streak hoặc hiện "Chưa có streak".
- `badgesAwarded` rỗng → "Chưa có badge mới".
- `submitStatus === "error"` → giữ box lỗi hiện tại (không confetti).
- `incorrectQuestions` rỗng (100% đúng) → ẩn tầng 3 list, vẫn hiện 2 nút.
- prefers-reduced-motion → skip confetti (tada sound vẫn phát).

**Scope KHÔNG đụng:**
- Scoring logic (SP2 chỉ đọc submitResult, không đổi scoring).
- Gamification computation (XP/badge/streak update) — chỉ expose streak read, không update.
- SP1 feedback trong lúc làm (đã xong, SP2 chỉ màn hình cuối).
- Audio local SP3a (không đụng).

**Testing:**
- `confetti.test.ts`: test `prefersReducedMotion` skip (mock matchMedia).
- Submit API expose: verify response shape có `previousBestScore` + `streak` (integration — khó unit test, smoke test qua dev).
- Summary screen render: smoke test thủ công.

**Quality gate:** `prisma validate` + `tsc --noEmit` + `npm test` + `npm run build` pass.

## 9. File sẽ tạo/sửa

| Hành động | File |
|---|---|
| tạo confetti wrapper | `src/lib/confetti.ts` |
| tạo summary screen component | `src/app/exercises/[id]/ExerciseSummaryScreen.tsx` |
| sửa submit API expose previousBest + streak | `src/app/api/exercises/submit/route.ts` |
| sửa engine: mở rộng SubmitResult type + export types + render component thay inline | `src/app/exercises/[id]/ExerciseEngineClient.tsx` |
| cài canvas-confetti dep | `npm install canvas-confetti` + `@types/canvas-confetti` |
| test confetti reduced-motion | `src/lib/__tests__/confetti.test.ts` |

## 10. Rủi ro & giải pháp

| Rủi ro | Giải pháp |
|---|---|
| canvas-confetti thêm dep + bundle size | ~6KB gzip, lazy import nếu cần. Wrapper cô lập → dễ swap. |
| previousBestAttempt biến tên không khớp | Verify tên biến chính xác ở `route.ts:132-144` khi implement. |
| streak expose nhưng client render sai nếu 0 | Graceful: ẩn card hoặc "Chưa có streak". |
| Engine 1300 dòng khó edit an toàn | Tách `ExerciseSummaryScreen` trước, engine chỉ render component. Giảm ~90 dòng inline. |
| confetti autoplay/animation chạm perf | 3 burst nhẹ, particleCount thấp (80/50/50). Reduced-motion skip. |
| router.reload() mất state combo/score | OK — summary screen đã lưu kết quả qua submit, reload chỉ làm lại bài (state mới). |
