# Phân luyện tai 3-stage (phoneme identification) — Design

Ngày: 2026-06-18
Trạng thái: design đã được user duyệt (hướng A: seed gán stage + fix scoring exact-match)
Scope: redesin mode `listen_choose` ("Luyện tai") thành 3 stage tăng dần độ khó — nhận diện âm mục tiêu (phoneme) thay vì đoán từ.

## Mục tiêu

Mode "Luyện tai" hiện tại (`listen_choose`) hiển thị **word lớn + audio + 4 option là từ** (distractor là từ thật, IPA cố tình ẩn). Trải nghiệm không tối ưu cho luyện tai: học viên đoán từ chứ không phân biệt âm.

Redesin thành **3 stage tăng dần độ khó** trong 1 lần chơi (10 câu), option thành **N nút IPA** (nhận diện âm mục tiêu trong từ nghe được):

- **Stage 1 (câu 1-4, dễ)**: hiện word + audio + N nút IPA. Liên kết spelling ↔ sound.
- **Stage 2 (câu 5-8, khó)**: ẩn word, hiện **IPA skeleton** (IPA khuyết target, vd `/ʃ_p/`) + audio + N nút. Ép nghe thực sự, không lộ đáp án qua IPA đầy đủ.
- **Stage 3 (câu 9-10, thực chiến)**: ẩn word + ẩn IPA, chỉ audio + N nút. Mức cao nhất.

## 1. Phạm vi

- Áp dụng cho **CĐ1-3** (26 nhóm có mode `listen_choose`: 10 vowels + 12 consonants + 4 minimal-pairs-hard).
- **CĐ4 KHÔNG đụng** — CĐ4 dùng `mode_a_listen_choose` riêng (Tap stress / weak form / linking / assimilation).
- Nhóm **N-âm contrast**: N=2 (đa số) → 2 nút; N=3 (g03 `/ɑː/&/ʌ/&/ə/`, g10 nasals `/m/&/n/&/ŋ/`) → 3 nút; **N=1** (g06 `/ɜː/`, g08 `/h/`) → mồi 1 phoneme từ group kế cận → 2 nút (known limitation: recognition, không phải discrimination — ghi rõ section 5).

## 2. Hướng A — Seed gán stage vào question

Lựa chọn kiến trúc: **seed sinh 10 câu/exercise, mỗi câu content JSON có `stage` + `targetPhoneme` + `contrastPhonemes[]` + `skeleton`**. Engine `ListenChooseQuestion` là renderer thuần — đọc `stage` → render 3 kiểu.

Lý do chọn A: khớp kiến trúc hiện tại (`seed_lessons.ts` đã sinh Question + content JSON + AnswerOption; engine render theo content), data-driven, deterministic, test được từ content. User đã chốt "cố định 10 câu 4/4/2" nên bake vào data đúng ý.

Loại B (engine quyết stage runtime): engine mang logic staging + "lặp từ khi pool<10" phức tạp, ít data-driven. Loại C (hybrid): over-engineering, YAGNI.

### Content JSON schema (mỗi câu)

```json
{
  "mode": "listen_choose",
  "answerType": "phoneme",
  "stage": 1,
  "word": "sheep",
  "ipa": "/ʃiːp/",
  "audioUrl": "https://.../sheep.mp3",
  "targetPhoneme": "/iː/",
  "contrastPhonemes": ["/iː/", "/ɪ/"],
  "skeleton": null
}
```

- `stage`: `1 | 2 | 3` (1-4→1, 5-8→2, 9-10→3).
- `answer` (trường `Question.answer`) = `targetPhoneme` (vd `"/iː/"`).
- `AnswerOption` rows = `contrastPhonemes` (2 hoặc 3 rows), `content` = IPA y nguyên (vd `"/iː/"`, `"/ɪ/"`). AnswerOption cho scoring qua `selectedOptionId`.
- `skeleton`: stage 2 = IPA khuyết (vd `"/ʃ_p/"`); stage 1 & 3 = `null` (engine không render skeleton).
- `answerType: "phoneme"`: cờ cho scoring — exact string match, bỏ normalize.

### Seed logic (`seed_lessons.ts`, hàm `generateQuestions` nhánh listen_choose)

1. **Pool từ**: `WordItem` ACTIVE (có audio) của sound group. **Lọc chỉ từ chứa đúng 1 âm** trong `contrastPhonemes` của nhóm — loại từ "nhiễu" chứa ≥2 âm contrast (vd father `/ˈfɑːðə/` chứa cả `/ɑː/` và `/ə/` → loại khỏi luyện tai, vẫn dùng cho mode khác).
2. **contrastPhonemes** = `targetPhonemes` của sound group (N=2 hoặc 3). Nhóm 1-âm (g06, g08): mồi 1 phoneme từ **group kế cận** (`orderIndex±1` trong cùng topic, ưu tiên −1 rồi +1) → N=2.
3. **10 câu cố định 4/4/2**: pool ≥10 → chọn 10 (shuffle deterministic theo soundGroupId). pool <10 → **lặp (cycle)** đến đủ 10 (cùng từ có thể xuất hiện ở 2 stage — tăng hiệu ứng luyện). Index 1-4→S1, 5-8→S2, 9-10→S3.
4. **Skeleton calc**: thay `targetPhoneme` substring trong `word.ipa` bằng `_`. Vd `/ʃiːp/` + target `/iː/` → `/ʃ_p/`. **Fallback**: target không tìm trong ipa → stage 2 dùng render stage 1 (show word), ghi `skeleton: null` + note trong seed log.
5. **Re-generate idempotent**: `upsert` Question + `deleteMany` AnswerOption + recreate. **KHÔNG đụng audio** — `audioUrl` copy từ `WordItem` hiện có, không re-fetch API (tránh regression SP3a local audio).

## 3. UI render 3 stage (`ListenChooseQuestion`)

`ListenChooseQuestion` đọc `contentData.stage` (mở rộng `parseWordPrompt` / `WordPrompt` type) → render 3 kiểu. Option = N nút IPA (2 hoặc 3), layout giữ grid flex hiện tại.

**Stage 1 (câu 1-4) — hiện chữ:**
```
         Sheep            ← word lớn (displayWord)
      [ 🔊 Phát lại ]      ← audio button
   Phân biệt âm mục tiêu:
   ┌──────────┐  ┌──────────┐
   │  /iː/   │  │  /ɪ/    │   ← N nút IPA
   └──────────┘  └──────────┘
```

**Stage 2 (câu 5-8) — ẩn chữ, IPA skeleton:**
```
      [ 🔊 Phát lại ]      ← chỉ audio
      / ʃ _ p /           ← skeleton (target=blank)
   Nghe & điền âm còn thiếu:
   ┌──────────┐  ┌──────────┐
   │  /iː/   │  │  /ɪ/    │
   └──────────┘  └──────────┘
```

**Stage 3 (câu 9-10) — chỉ audio:**
```
      [ 🔊 Phát lại ]      ← chỉ audio
   (không word, không IPA)
   Âm bạn vừa nghe là:
   ┌──────────┐  ┌──────────┐
   │  /iː/   │  │  /ɪ/    │
   └──────────┘  └──────────┘
```

Autoplay audio giữ nguyên (500ms timeout hiện tại). Nút "Phát lại" giữ nguyên. Coloring đáp án đúng/sai giữ nguyên (success/error ring). Stage 2 skeleton render bằng `<span className="font-ipa">` lớn, `_` highlight (vd underline or màu warning).

## 4. Scoring fix (bắt buộc, 2 nơi)

**Vấn đề**: `normalizeAnswer` (engine `ExerciseEngineClient.tsx:118-124`) và `normalizeAnswerText` (server `scoring.ts:39-45`) đều strip ký tự không phải `[a-zA-Z0-9_]` qua regex `/[^\w\s]|_/g`. Hầu hết IPA không thuộc `\w` → bị xóa: `/ɪ/`→`""`, `/ɑː/`→`""`, `/ʃ/`→`""`... Nhóm 3-âm g03 `/ɑː/&/ʌ/&/ə/` → cả 3 option normalize thành `""` → bấm nút nào cũng "đúng". Mode luyện tai phoneme-ID **hỏng hoàn toàn** nếu không fix. Hiện tại listen_choose dùng word (ASCII) nên bug tiềm ẩn chưa lộ.

**Fix** (nhỏ, có mục đích, không phá mode khác): thêm **exact-match branch** trước normalize. Cả engine + server:

```ts
// Engine ExerciseEngineClient.tsx (dùng tại dòng 309, 324)
const isCorrect = option.content === question.answer
  || normalizeAnswer(option.content) === normalizeAnswer(question.answer);

// Server scoring.ts scoreMultipleChoice (dòng 78)
const isCorrect = selectedText === question.answer
  || normalizeAnswerText(selectedText) === normalizeAnswerText(question.answer);
```

Exact match thắng cho IPA (`/iː/` vs `/ɪ/` khác nhau nguyên văn). Normalized match vẫn thắng cho word (mode speak_word, speak_minimal_pair, speak_sentence dùng word/sentence → không vỡ). `AnswerOption.content` giữ IPA y nguyên (seed ghi nguyên).

## 5. Edge cases, limitations, testing

**Edge cases:**
- pool <10 → lặp (cycle) đến đủ 10. Cùng từ có thể ở 2 stage.
- skeleton target-not-in-ipa → fallback: stage 2 render stage 1 (show word), `skeleton: null` + note log.
- nhóm 1-âm (g06 `/ɜː/`, g08 `/h/`) → mồi 1 phoneme từ group kế cận. **Known limitation**: recognition (âm này có trong từ không), không phải discrimination (phân biệt 2 âm). Ghi rõ trong spec + seed log.
- nhóm 3-âm lọc từ "nhiễu" (father) → pool có thể giảm. Nếu pool sau lọc = 0 → exercise `listen_choose` chuyển DRAFT (xử lý hiện có ở `generateQuestions` cuối: `createdForThisExercise === 0 → DRAFT`).

**Scope KHÔNG đụng:**
- XP/streak/badge/leaderboard/check-in (scoring logic tổng không đổi, chỉ thêm exact-match branch).
- Audio local SP3a (không re-fetch).
- CĐ4 modes.
- Mode speak_word / speak_minimal_pair / speak_sentence.

**Testing:**
- Unit test helper `buildListenChooseQuestions` (tách ra testable): skeleton calc (`/ʃiːp/`+`/iː/`→`/ʃ_p/`), lọc 1-âm (father loại khỏi g03), mồi 1-âm (g06 mồi từ g03/g05), split 4/4/2 (index→stage), pool<10 lặp (cycle đủ 10).
- Unit test scoring exact-match: `/iː/` exact correct, `/ɪ/` exact wrong cho answer `/iː/`; word mode vẫn normalized.
- Engine render: smoke test thủ công (không unit test UI).

**Quality gate:** `prisma validate` + `tsc --noEmit` + `npm test` + `npm run build` pass.

## 6. File sẽ tạo/sửa

| Hành động | File |
|---|---|
| sửa seed `generateQuestions` nhánh listen_choose (phoneme-ID 3-stage + skeleton + lọc 1-âm + mồi + split 4/4/2) | `prisma/seed_lessons.ts` |
| tách helper `buildListenChooseQuestions` (testable) | `prisma/seed_lessons.ts` (hoặc file mới `prisma/listen-choose-builder.ts` — quyết định ở plan) |
| sửa `ListenChooseQuestion` render 3 stage + mở rộng `WordPrompt` type | `src/app/exercises/[id]/ExerciseEngineClient.tsx` |
| sửa scoring exact-match (engine + server) | `ExerciseEngineClient.tsx` + `src/lib/scoring.ts` |
| test helper + scoring | `src/lib/__tests__/` (file mới + `scoring.test.ts`) |
| (tùy chọn) re-generate câu listen_choose | script nhỏ `prisma/seed_listen_choose.ts` — chỉ re-generate Question + AnswerOption cho mode listen_choose (copy `audioUrl` từ WordItem DB hiện có, KHÔNG re-fetch). An toàn cho SP3a local audio. |

## 7. Rủi ro & giải pháp

| Rủi ro | Giải pháp |
|---|---|
| Re-run seed đầy đủ re-fetch audio (regression SP3a) | Dùng script nhỏ `seed_listen_choose.ts` chỉ re-generate listen_choose questions (copy `audioUrl` từ WordItem DB hiện có, không re-fetch). KHÔNG re-run seed đầy đủ. |
| Scoring exact-match phá mode word | Exact-match OR normalized — normalized vẫn thắng cho word (word ≠ exact IPA). Test cả 2 nhánh. |
| pool sau lọc 1-âm = 0 (nhóm 3-âm toàn từ nhiễu) → exercise rỗng | `createdForThisExercise === 0 → DRAFT` (xử lý hiện có). Verify pool từng nhóm khi seed. |
| Skeleton target không khớp ipa (IPA variant) | Fallback render stage 1 + note log. |
| Nhóm 1-âm mồi không phải "discrimination" thật | Known limitation, ghi rõ. Nhận diện âm vẫn có giá trị luyện tai. |
