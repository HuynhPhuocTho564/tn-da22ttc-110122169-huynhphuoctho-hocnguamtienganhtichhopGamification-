# SP2 — Data layer v2 (schema + catalog 30 nhóm) Design

Ngày: 2026-06-18
Trạng thái: design đã được user duyệt (hướng A + unlock tuần tự 80%)
Scope: Sub-project 2 trong 6 sub-project (SP1→SP6). SP1 đã xong (dọn PLAN + orphan + `CURRENT_PROJECT_CONTEXT.md`).

## Mục tiêu

Nâng schema + catalog từ v1 (25 nhóm/100 bài) lên v2 (30 nhóm/112 bài) để sẵn sàng cho SP3 (content từ/câu) + SP4 (exercise engine + unlock runtime). SP2 **không** sinh content từ/câu cho nhóm mới — chỉ cấu trúc + shell. 5 nhóm v1 đã có content được giữ nguyên (không mất).

Nguyên tắc người dùng yêu cầu: **dễ bảo trì và nâng cấp**. Unlock dùng 1 luật generic (1 trường `unlockThresholdPercent`), không hardcode từng topic — đổi ngưỡng/bỏ khóa sau này chỉ sửa data, không đụng code.

## Bảo toàn v1

- 5 nhóm v1 có content đầy đủ (`map-t1-g01-i-ih`, `map-t1-g02-e-ae`, `map-t1-g04-o-oh`, `map-t4-g01-front-vowel-mix`, `map-t4-g03-final-drop`) giữ nguyên, vẫn ACTIVE.
- 14 test hiện có vẫn pass.
- Engine v1 vẫn render 3 question type cũ (`qtype-1-mc`, `qtype-2-voice`, `qtype-3-minimal-pairs`) bình thường — không đụng engine trong SP2.
- XP/điểm hạng/streak/badge/leaderboard/check-in KHÔNG đụng (giữ đầy đủ, bổ sung ở SP6).

## 3 hướng tiếp cận (đã chốt A)

| Hướng | Làm gì | Chốt |
|---|---|---|
| A — Mở rộng + giữ tương thích | Thêm trường nullable/default vào schema hiện có; catalog viết lại 30 nhóm; seed shell. v1 data giữ. | ✅ User duyệt |
| B — Làm lại từ đầu | Xóa schema v1, viết v2 mới, re-seed sạch. | Loại (mất 5 nhóm content) |
| C — Schema song song | Giữ v1, tạo v2 riêng. | Loại (rối) |

## 1. Schema thay đổi (`frontend/prisma/schema.prisma`)

Thêm 7 trường (tất cả nullable/default, không phá v1). Không xóa/sửa trường v1.

| Model | Trường mới | Kiểu | Default | Lý do |
|---|---|---|---|---|
| `Topic` | `orderIndex` | Int | 0 | Sort 4 chủ đề theo syllabus (CĐ1→2→3→4). |
| `Topic` | `unlockThresholdPercent` | Int | 0 | % hoàn thành topic trước cần đạt để mở topic này. 0 = mở tự do (CĐ1). CĐ2/3/4 = 80. 1 luật generic, dễ bảo trì. |
| `Question` | `acceptedAnswers` | Json? | null | Mảng đáp án chấp nhận cho Mode B CĐ4 (vd `["did you eat yet","didju eat yet","dija eat yet"]`). null = dùng `answer` đơn trị (v1 + Mode A). |
| `QuestionBankItem` | `acceptedAnswers` | Json? | null | Như Question (kho nguồn cũng cần). |
| `WordItem` | `syllables` | Json? | null | Mảng âm tiết để UI "Tap the Stress" render khối `[pho][TO][gra][phy]`. |
| `WordItem` | `stressIndex` | Int? | null | Vị trí âm tiết nhấn (0-based) cho Word Stress Mode A. |
| `WordItem` | `wordStressType` | String? | null | Tag cho CĐ4: `WORD_STRESS` / `WEAK_FORM` / `LINKING` / `ASSIMILATION`. null = từ vựng IPA thường (CĐ1–3). |

**Bỏ (so với design nháp trước):** `unlockRequiredCount`, `prerequisiteTopicIds`, `SoundGroup.unlockRequiredCount` — thay bằng 1 trường `unlockThresholdPercent` generic, đúng yêu cầu dễ bảo trì.

**QuestionType mới:** không thêm model (model `QuestionType` đã generic), chỉ seed thêm 4 row:
- `qtype-4-tap-stress` — Word Stress Mode A (nghe → bấm âm tiết nhấn).
- `qtype-5-choose-weak` — Weak Forms Mode A (nghe câu → chọn từ lướt /ə/).
- `qtype-6-choose-linking` — Linking Mode A (nghe cụm → chọn phát âm đúng).
- `qtype-7-choose-assimilation` — Assimilation Mode A (nghe câu → chọn câu vừa nghe).
Mode B CĐ4 tái dùng `qtype-2-voice` + `acceptedAnswers` (so khớp nhiều dạng).

**Migration:** dùng `npx prisma db push` (theo `DATA_SEED_PLAN.md` mục 11) vì đang ở giai đoạn dev. Sau khi ổn định (sau SP4) có thể chuyển `prisma migrate dev` để có audit trail cho khóa luận — ghi vào `CURRENT_PROJECT_CONTEXT.md` mục 8 là việc còn lại.

## 2. Catalog v2 (`frontend/prisma/lesson-catalog.ts`)

Viết lại hoàn toàn. Cấu trúc:

### TOPICS (4, id mới v2)

| id | name | orderIndex | unlockThresholdPercent | Mô tả |
|---|---|---:|---:|---|
| `topic-1-vowels` | Nguyên âm | 1 | 0 | Mở tự do (nền tảng). |
| `topic-2-consonants` | Phụ âm | 2 | 80 | Mở khi CĐ1 ≥80%. |
| `topic-3-minimal-pairs-hard` | Minimal Pairs Khó | 3 | 80 | Mở khi CĐ2 ≥80%. |
| `topic-4-stress-connected` | Trọng âm & Nối âm | 4 | 80 | Mở khi CĐ3 ≥80%. |

### SOUND_GROUPS (30)

| Chủ đề | Nhóm | Nguồn |
|---|---:|---|
| CĐ1 Nguyên âm | 10 | 6 đơn + 4 đôi — gộp từ v1 (đổi topicId từ `topic-1-monophthongs`/`topic-2-diphthongs` sang `topic-1-vowels`). |
| CĐ2 Phụ âm | 12 | 11 cũ + tách `/h/` (nhóm 8 Glottal, không cặp) + tách `/w/ & /j/` (nhóm 12 Glides) khỏi `/h/` = net +1. Sắp lại theo 5 tầng (Plosives/Fricatives/Affricates/Nasals/Approximants). |
| CĐ3 Minimal Pairs Khó | 4 | 4 nhóm v1 (đổi topicId sang `topic-3-minimal-pairs-hard`). |
| CĐ4 Trọng âm & Nối âm | 4 | **MỚI**: Word Stress, Weak Forms, Linking, Assimilation & Elision. |

ID convention (theo `LESSON_CODING_PLAN.md` mục 5 + v2):
- `map-t1-g01-i-ih` ... `map-t1-g10-ia-ua` (CĐ1, 10 nhóm).
- `map-t2-g01-p-b` ... `map-t2-g12-w-j` (CĐ2, 12 nhóm).
- `map-t3-g01-front-vowel-mix` ... `map-t3-g04-dental-sibilant` (CĐ3, 4 nhóm).
- `map-t4-g01-word-stress` ... `map-t4-g04-assimilation` (CĐ4, 4 nhóm).

### EXERCISE_MODES

- 4 mode chuẩn (CĐ1–3, giữ v1): `listen_choose`, `speak_word`, `speak_minimal_pair`, `speak_sentence`.
- 2 mode đặc thù (CĐ4 mới): `mode_a_listen_choose` (trắc nghiệm nghe đặc thù), `mode_b_speak_match` (đọc + so khớp nhiều dạng qua `acceptedAnswers`).

CĐ4 = 4 nhóm × 2 mode = 8 bài. CĐ1–3 = 26 nhóm × 4 mode = 104 bài. **Tổng 112 bài.**

`ExerciseModeDefinition` thêm trường `appliesToTopics?: string[]` — mode đặc thù chỉ áp dụng CĐ4, mode chuẩn áp dụng CĐ1–3. Giúp seed biết nhóm nào sinh mấy mode (dễ bảo trì: thêm topic mới chỉ định trong mảng).

## 3. Seed shell (`frontend/prisma/seed_lessons.ts`)

Cập nhật seed:
- Upsert 4 topic mới (kèm `orderIndex`, `unlockThresholdPercent`).
- Upsert 4 QuestionType mới (giữ 3 cũ).
- Upsert 30 SoundGroup + SoundGroupPhoneme.
- Generate 30 LearningMap.
- Generate 112 Exercise (shell): 26 nhóm × 4 mode + 4 nhóm × 2 mode.
- **Giữ** content 5 nhóm v1 cũ (gọi `seedLessonContent` cho 5 nhóm đó — nhưng cần adjust `soundGroupId` vì topicId đổi; chi tiết trong plan).
- Nhóm mới (25 nhóm): chỉ shell `status: DRAFT`, không sinh WordItem/MinimalPair/SentenceItem/QuestionBankItem/Question (SP3 làm).
- Idempotent (upsert theo id), re-run sạch.

Đặc biệt: 5 nhóm v1 cũ có content nhưng `soundGroupId` (trong `lesson-content.ts`) đang là `map-t1-g01-i-ih` v.v. — nếu id nhóm giữ nguyên thì content vẫn map đúng (không cần sửa content). Chỉ đổi `topicId` ở SoundGroup/Exercise. Verify trong plan: id nhóm CĐ1/CĐ3 giữ nguyên, chỉ topicId đổi.

## 4. Unlock logic

SP2 chỉ thêm **trường + seed giá trị**:
- CĐ1: `unlockThresholdPercent = 0`.
- CĐ2/3/4: `unlockThresholdPercent = 80`.

**Logic runtime** (tính % hoàn thành topic + check mở khóa + UI khóa) → **SP4** (learning_map page + engine) + **SP6** (helper gamification). SP2 sẵn sàng data, không wire logic.

Định nghĩa "hoàn thành bài" (chốt cho SP4/SP6 dùng): user có `ExerciseAttempt.score >= 70` (ngưỡng `isExerciseCompleted` trong `scoring.ts:143`). % hoàn thành topic = (số bài ACTIVE của topic mà user đã ≥70) / (tổng bài ACTIVE của topic) × 100. Topic N mở khi topic N-1 (orderIndex trước) ≥ `unlockThresholdPercent`.

## 5. Testing & quality gate

**Test catalog (TDD, tạo `frontend/src/lib/__tests__/lesson-catalog.test.ts`):**
- 4 topic, `orderIndex` 1–4, `unlockThresholdPercent` đúng (0/80/80/80).
- 30 sound group, phân bổ đúng: CĐ1=10, CĐ2=12, CĐ3=4, CĐ4=4.
- 6 exercise mode (4 chuẩn + 2 đặc thù).
- Tổng bài = 112 (26×4 + 4×2).
- Mỗi topic có đúng số nhóm: CĐ1=10, CĐ2=12, CĐ3=4, CĐ4=4.
- ID không trùng, `orderIndex` không trùng trong topic.

**Quality gate (tất cả pass):**
```powershell
npx prisma validate
npx prisma generate
npx prisma db push
npx tsc --noEmit --pretty false
npm test
npm run build
```

**Verify DB sau seed:** 4 topic, 30 sound group, 30 learning map, 112 exercise (5 nhóm cũ ACTIVE, 25 nhóm mới DRAFT), 7 question type (3 cũ + 4 mới).

## 6. Thay đổi behavior?

Không vỡ v1: 5 nhóm content cũ vẫn chạy, 14 test + test catalog mới vẫn pass. Thêm trường nullable + shell mới. Engine v1 vẫn render 3 question type cũ. Unlock chưa wire (SP4/SP6) → hiện tại UI vẫn mở tất cả như v1 (không đổi cho đến SP4).

## 7. File sẽ tạo/sửa

| Hành động | File |
|---|---|
| sửa | `frontend/prisma/schema.prisma` (thêm 7 trường) |
| sửa (viết lại) | `frontend/prisma/lesson-catalog.ts` (4 topic + 30 nhóm + 6 mode) |
| sửa | `frontend/prisma/seed_lessons.ts` (shell 30 nhóm, giữ 5 nhóm content cũ, 4 QuestionType mới, unlock field) |
| tạo | `frontend/src/lib/__tests__/lesson-catalog.test.ts` (TDD catalog) |
| (có thể sửa) | `frontend/prisma/lesson-content.ts` — chỉ nếu id nhóm đổi (verify trong plan; dự kiến không cần) |

## 8. Không nằm trong phạm vi SP2

- Content từ/câu cho 25 nhóm mới → SP3.
- 4 UI mới CĐ4 + Mode B multi-answer + scoring multiplier/retake → SP4.
- Unlock runtime (tính %, UI khóa) → SP4 + SP6.
- Admin CRUD 6 model kho → SP5.
- Migration `prisma migrate` (để có audit trail) → sau SP4.

## 9. Rủi ro & giải pháp

| Rủi ro | Giải pháp |
|---|---|
| Đổi topicId làm đứt content 5 nhóm cũ | Verify id nhóm giữ nguyên, chỉ topicId đổi. Test sau seed: 5 nhóm cũ vẫn có Question ACTIVE. |
| `prisma db push` thêm trường nullable nhưng quên `prisma generate` → client cũ không có trường | Plan bắt buộc chạy `prisma generate` sau `db push`. |
| Catalog 30 nhóm sai số (vd 31 do đếm nhầm) | Test catalog kiểm tra đúng 30/10/12/4/4. |
| Seed shell 112 bài nhưng engine v1 không biết mode đặc thù → render trống | Shell CĐ4 để `DRAFT` (không ACTIVE) → engine v1 không load. UI CĐ4 làm SP4. |
