# SP3a-fix — CĐ1 chia 2 subcategory + sửa nút quay về Design

Ngày: 2026-06-18
Trạng thái: design đã được user duyệt (hướng A) + mở rộng scope gán subcategory cho cả CĐ2 (5 tầng)
Scope: fix 2 vấn đề user phát hiện sau khi review SP3a.

## Mục tiêu

1. **Vấn đề 1**: CĐ1 (Nguyên âm) hiện có 10 nhóm phẳng — chưa chia 2 chủ đề con theo syllabus v2: **Nguyên âm đơn** (6 nhóm) + **Nguyên âm đôi** (4 nhóm).
2. **Vấn đề 2**: Thiếu/ không rõ nút quay về — engine bài tập chỉ có "X" (router.back, không rõ ràng), trang `/exercises` (list) không có nút quay về.

## 1. Hướng A — Thêm `subcategory` vào SoundGroup

### Schema
Thêm 1 trường vào `model SoundGroup`:
```prisma
subcategory String? // v2: nhóm con trong topic (vd "Nguyên âm đơn", "Plosives"). null = không phân nhóm.
```
Nullable, không phá v1. Dùng cho CĐ1 (đơn/đôi) + sẵn sàng CĐ2 (5 tầng).

### Catalog gán subcategory

| Topic | subcategory | Nhóm |
|---|---|---|
| topic-1-vowels | "Nguyên âm đơn" | g01 i-ih, g02 e-ae, g03 central, g04 o-oh, g05 u-uh, g06 er (6) |
| topic-1-vowels | "Nguyên âm đôi" | g07 ei-ai, g08 oi-au, g09 ou-ea, g10 ia-ua (4) |
| topic-2-consonants | "Plosives" | g01 p-b, g02 t-d, g03 k-g (3) |
| topic-2-consonants | "Fricatives" | g04 f-v, g05 th-dh, g06 s-z, g07 sh-zh, g08 h (5) |
| topic-2-consonants | "Affricates" | g09 ch-j (1) |
| topic-2-consonants | "Nasals" | g10 nasals (1) |
| topic-2-consonants | "Approximants" | g11 l-r, g12 w-j (2) |
| (CĐ3/4 để sau, null tạm) | null | — |

Catalog `SoundGroupDefinition` thêm field `subcategory?: string`. Seed gán. CĐ2 gán theo 5 tầng đã có sẵn dạng comment trong catalog (`lesson-catalog.ts:177-194`).

### UI Learning Map gom theo subcategory
`LearningMapClient.tsx`: trong view "selectedTopic" (chưa chọn map), gom `maps` theo `subcategory`:
- Nếu có subcategory → render các mục con (vd CĐ1: "Nguyên âm đơn" / "Nguyên âm đôi"; CĐ2: "Plosives" / "Fricatives" / "Affricates" / "Nasals" / "Approximants"), mỗi mục là 1 tiêu đề + grid nhóm âm.
- Nếu null → giữ hiển thị phẳng (cho CĐ3/4 sau).

`TopicUI`/`LearningMapUI` thêm field `subcategory: string | null`. `learning_map/page.tsx` truyền lên từ `map` (cần query subcategory qua SoundGroup — thực tế exercise.map không có subcategory, phải lấy từ SoundGroup của nhóm; xem plan để quyết định join).

**Lưu ý kỹ thuật quan trọng**: hiện `LearningMap` model không có `subcategory` (chỉ SoundGroup có). Có 2 cách:
- **(a)** Thêm `subcategory` vào cả `LearningMap` (vì UI gom theo map). Đơn giản, join 1 cấp.
- **(b)** Giữ chỉ SoundGroup, page query join SoundGroup qua map→exercise→soundGroup. Phức tạp hơn.

Chọn **(a)**: thêm `subcategory` vào cả `SoundGroup` + `LearningMap` (map inherit subcategory của nhóm khi seed). UI gom theo `map.subcategory`. Đơn giản, đúng "dễ bảo trì".

## 2. Sửa nút quay về

### Engine (`/exercises/[id]`)
Hiện dòng 1083: nút "X" gọi `router.back()`. Sửa thành nút "← Lộ trình" trỏ `/learning_map` (rõ ràng hơn, không phụ thuộc history).

### Trang `/exercises` (list)
Hiện không có nút quay về. Thêm nút "← Lộ trình" (`Link href="/learning_map"`) đầu trang.

## 3. Test + quality gate

- Test catalog: thêm check `subcategory` — CĐ1: 6 "Nguyên âm đơn" + 4 "Nguyên âm đôi"; CĐ2: 3 Plosives + 5 Fricatives + 1 Affricates + 1 Nasals + 2 Approximants; CĐ3/4 = null.
- Quality gate: `prisma validate` + `db push` + `tsc --noEmit` + `npm test` + `npm run build` pass.
- Không re-seed content (chỉ thêm subcategory qua upsert, không đổi words/pairs/sentences). Có thể chạy `seed_lessons.ts` lại để upsert subcategory, hoặc script nhỏ update.

## 4. Thay đổi behavior?

- UI Learning Map CĐ1 hiển thị 2 nhóm con thay vì 10 phẳng → đúng syllabus, rõ hơn.
- Nút quay về rõ ràng hơn.
- XP/streak/badge/leaderboard/check-in KHÔNG đụng.
- Audio local (SP3a) KHÔNG đụng.

## 5. File sẽ tạo/sửa

| Hành động | File |
|---|---|
| sửa schema (thêm subcategory vào SoundGroup + LearningMap) | `prisma/schema.prisma` |
| sửa catalog (gán subcategory CĐ1) | `prisma/lesson-catalog.ts` |
| sửa seed (gán subcategory) | `prisma/seed_lessons.ts` |
| sửa Learning Map UI (gom subcategory) | `src/app/learning_map/page.tsx` + `LearningMapClient.tsx` |
| sửa engine (nút Lộ trình) | `src/app/exercises/[id]/ExerciseEngineClient.tsx` |
| sửa trang list (nút Lộ trình) | `src/app/exercises/page.tsx` |
| sửa test catalog (subcategory) | `src/lib/__tests__/lesson-catalog.test.ts` |

## 6. Rủi ro & giải pháp

| Rủi ro | Giải pháp |
|---|---|
| `db push` thêm cột nullable OK, không mất data | Verify DB count sau |
| Re-seed upsert subcategory nhưng quên | Chạy `seed_lessons.ts` lại (idempotent) |
| UI gom subcategory phá vỡ CĐ2/3/4 (null) | Nếu null → hiển thị phẳng như cũ |
