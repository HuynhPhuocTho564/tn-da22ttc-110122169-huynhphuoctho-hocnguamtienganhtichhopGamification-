# SP1 — Dọn PLAN + xóa orphan code (nền móng tin cậy)

Ngày: 2026-06-18
Trạng thái: design đã được user duyệt (hướng A)
Scope: Sub-project 1 trong 6 sub-project (SP1→SP6) để hiện thực cấu trúc IPA v2 (30 nhóm / 112 bài / 4 chủ đề) trên nền v1 đã dọn sạch.

## Mục tiêu

Loại bỏ tài liệu mâu thuẫn/lỗi thời và code orphan trước khi nâng v2, để các sub-project sau (SP2–SP6) không bị dẫn sai bởi plan cũ. **Không thay đổi behavior chạy thật** — chỉ dọn file + ghi tài liệu nguồn chân thực mới.

Lý do SP1 đi trước: audit phát hiện nhiều file PLAN mâu thuẫn với code (vd `project_spec.md` cấm XP/streak nhưng code đã có đầy đủ; toàn bộ plan ghi Next.js 14 trong khi thực tế 16.2.7). Nếu vào thẳng v2, AI sẽ bị kéo theo tài liệu sai → sai hướng. Dọn trước để có một nguồn chân thực duy nhất.

## Bảo toàn tính năng đang chạy (KHÔNG dọn/xóa)

XP, điểm hạng, streak, badge, leaderboard là tính năng **đang chạy thật** và được người dùng yêu cầu giữ đầy đủ. SP1 tuyệt đối không đụng vào logic này. Các bổ sung/sửa sẽ làm ở SP6.

| Tính năng | Trạng thái | Xử lý trong SP1 |
|---|---|---|
| XP (`User.xp`, `gamification.ts:calculateLevelFromXp`) | chạy thật | GIỮ |
| Điểm hạng / Leaderboard tuần-tháng (`Leaderboard`, `api/leaderboard`) | chạy thật | GIỮ |
| Streak (`User.streakCount/longestStreak/totalCheckIns/lastCheckInDate`, `api/checkin`) | chạy thật | GIỮ |
| Badge (`Badge`, `UserBadge`, `gamification.ts:BADGE_DEFINITIONS`) | chạy thật | GIỮ |
| Daily check-in (`DailyActivity`, `api/checkin`) | chạy thật | GIỮ |
| Level 2 hệ lệch nhau (`levelSystem.ts` lesson-based vs `gamification.ts` XP-based) | bug thật, `LevelDisplay.tsx` đang dùng `levelSystem.ts` | **KHÔNG xóa**, chỉ flag trong `CURRENT_PROJECT_CONTEXT.md`; fix ở SP6 |
| `mockData.ts` (IPAChart dùng cho trang /practice) | chạy thật | GIỮ |

## Phạm vi SP1 (hướng A — archive + xóa có chọn lọc + ghi doc mới)

### 1. Archive tài liệu stale vào `PLAN/_Archive/` (giữ nguyên nội dung, chỉ di chuyển)

Lý do archive chứ không xóa: giữ lịch sử trong git/PLAN để đối chiếu khóa luận; `PLAN_FILE_AUDIT.md` đã khuyến nghị từ trước.

| File | Lý do archive |
|---|---|
| `PLAN/00_Project_Context/project_spec.md` | Cấm "không XP/streak" — mâu thuẫn code đã có đầy đủ. |
| `PLAN/00_Project_Context/CURRENT_SYSTEM_STATUS.md` | Snapshot 08/06 lỗi thời: ghi FastAPI rỗng, auth chưa config, submit chưa có — đều đã xong. Sai version Next 14/Prisma 7. |
| `PLAN/00_Project_Context/PROJECT_CONTEXT.md` | Mô tả kiến trúc cũ: Whisper, openai-whisper, `/api/phonemes`, `/api/practice` — đều không tồn tại. |
| `PLAN/03_UI_UX/COLOR_SYSTEM.md` | File rỗng (placeholder). |
| `PLAN/04_Features/ADMIN_ACCESS.md` | Hướng dẫn bypass bằng mock-token `mock-token-123` + cookie `user-role=Admin` — đã bỏ, chuyển sang next-auth session thật. |
| `PLAN/05_AI_Skills/KH_AI_PROMPTS.md` | Prompt cũ, nhắc đường dẫn `project/PROJECT_CONTEXT.md` không còn, ghi Next.js 14. |
| `PLAN/05_AI_Skills/KH_VIBE_CODING.md` | Prompt cũ, ghi "DB chưa có `xp`, `level`" — sai (schema đã có). |

Tạo `PLAN/_Archive/README.md` giải thích: đây là tài liệu lịch sử, không dùng làm quyết định, nguồn chân thực hiện tại là `PLAN/00_Project_Context/CURRENT_PROJECT_CONTEXT.md`.

### 2. Xóa code orphan đã verify (không file nào import)

Verify bằng `findstr` trên toàn frontend (excl node_modules): không có import nào ngoài chính file đó.

| File xóa | Bằng chứng orphan |
|---|---|
| `frontend/prisma/seed.ts` | `package.json` chỉ cấu hình `seed_lessons.ts`; không import. |
| `frontend/prisma/seed_real.ts` | Không import, không wire. |
| `frontend/src/components/exercises/ExerciseType1.tsx` | Legacy, `ExerciseEngineClient.tsx` không import (engine tự render 3 question type nội bộ). |
| `frontend/src/components/exercises/ExerciseType3.tsx` | Như trên. |
| `frontend/src/components/exercises/ExerciseType4.tsx` | Như trên (refactor type đã làm ở Phase 1, component legacy còn sót). |
| `frontend/src/lib/audioData.ts` | Chỉ được import bởi `ExerciseType1.tsx` (orphan) → theo xóa. |

### 3. GIỮ code đang chạy (KHÔNG xóa dù audit ban đầu nghi ngờ)

Đây là kết quả verify quan trọng: audit ban đầu (agent) cho rằng `levelSystem.ts` và `mockData.ts` là dead code, nhưng `findstr` chứng minh **chúng đang được dùng**:

| File giữ | Ai dùng |
|---|---|
| `frontend/src/lib/levelSystem.ts` | `src/components/gamification/LevelDisplay.tsx` |
| `frontend/src/lib/mockData.ts` | `src/components/ipa/IPAChart.tsx` (trang `/practice`) |

`levelSystem.ts` có bug thật (hệ level lesson-based lệch hệ level XP-based của API) → chỉ flag, fix ở SP6.

### 4. Tạo `PLAN/00_Project_Context/CURRENT_PROJECT_CONTEXT.md` (nguồn chân thực mới)

Nội dung ghi đúng thực tế (kèm file:line bằng chứng), thay thế vai trò của các file đã archive:

- **Tech stack thực tế**: Next.js 16.2.7 (App Router, Turbopack), React 18.3.1, Prisma 6.19.3 + PostgreSQL `english_app`, next-auth v5 beta (Credentials + Google), wavesurfer 7.12.7, Tailwind v4 (`@theme` trong globals.css, không có tailwind.config), FastAPI 0.136.3 tối thiểu (chỉ `/` + `/health`, không có model/scoring).
- **Kiến trúc**: scoring nằm ở `frontend/src/lib/scoring.ts` + `api/exercises/submit` (KHÔNG có Whisper/ASR; dùng Web Speech API browser). Gamification ở `frontend/src/lib/gamification.ts`.
- **Gamification đang chạy**: XP (`User.xp`), level (2 hệ — flag bug SP6), streak (`User.streakCount`...), badge (`Badge`/`UserBadge`/`BADGE_DEFINITIONS`), leaderboard tuần-tháng (`Leaderboard` type `tuan`/`thang`), daily check-in (`DailyActivity`). Người dùng yêu cầu **giữ đầy đủ**.
- **Database**: 26 bảng (xem `PLAN/02_Database_And_Data/DB_AUDIT_REPORT.md` và `LESSON_SYLLABUS_STRUCTURE.md`), 1 PostgreSQL duy nhất (backend không có model SQLAlchemy → không xung đột 2 DB). Đã dọn + seed lại v1 sạch ngày 18/06 (4 topic, 25 nhóm, 100 bài, 94 QuestionBankItem).
- **Roadmap thực tế**: 6 sub-project SP1–SP6 (liệt kê ngắn + trạng thái), đối chiếu `ACTION_PLAN_NEXT_STEPS.md` (Phase 1–5 + 7-read đã có code; 6, 8 dở).
- **Nguồn ưu tiên đọc khi code**: `CURRENT_PROJECT_CONTEXT.md` (file này), `ACTION_PLAN_NEXT_STEPS.md`, `DB_AUDIT_REPORT.md`, `LESSON_SYLLABUS_STRUCTURE.md`, `.agents/skills/*`.

### 5. Quality gate (chứng minh không vỡ)

Sau khi thực hiện, chạy đủ 4 lệnh (theo `LESSON_CODING_PLAN.md` mục 5), tất cả phải pass như hiện tại:

```powershell
npx prisma validate
npx tsc --noEmit --pretty false
npm test
npm run build
```

## Không nằm trong phạm vi SP1 (để các SP sau)

- Sửa bug level 2 hệ → SP6.
- Bổ sung all-time leaderboard / auto badge `leaderboard_update` / check-in auto khi submit → SP6.
- Schema thay đổi cho v2 (trường CĐ4, unlock, `Topic.orderIndex`) → SP2.
- Catalog 30 nhóm + content 20 nhóm + 4 nhóm CĐ4 → SP3.
- Exercise engine 4 UI mới + Mode B multi-answer → SP4.
- Admin CRUD QuestionBank/Phoneme/WordItem → SP5.

## Thay đổi behavior?

Không. Chỉ di chuyển file PLAN vào `_Archive`, xóa code orphan không import, tạo 1 file doc mới. Build/test/validate phải pass y hệt trước và sau.

## File sẽ tạo/sửa/xóa

| Hành động | File |
|---|---|
| tạo | `PLAN/_Archive/README.md` |
| di chuyển (archive) | 7 file PLAN liệt kê mục 1 |
| xóa | 6 file code orphan liệt kê mục 2 |
| tạo | `PLAN/00_Project_Context/CURRENT_PROJECT_CONTEXT.md` |
| commit | git add + commit "SP1: dọn PLAN stale + xóa orphan code + tạo CURRENT_PROJECT_CONTEXT" |

## Rủi ro & giải pháp

| Rủi ro | Giải pháp |
|---|---|
| Xóa nhầm code đang chạy | Đã verify `findstr` + chỉ xóa file không import. `levelSystem.ts`/`mockData.ts` được GIỮ dù bị nghi. |
| Archive làm đứt tham chiếu trong tài liệu khác | Kiểm tra tham chiếu chéo trước khi archive; `_Archive/README.md` ghi rõ nguồn thay thế. |
| Quality gate fail sau xóa | Nếu fail, khôi phục từ git (commit trước khi xóa); chỉ SP1 xong khi 4 lệnh pass. |
