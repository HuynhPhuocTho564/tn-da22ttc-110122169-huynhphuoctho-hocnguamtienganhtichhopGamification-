# SP1 — Dọn PLAN + xóa orphan code Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Dọn tài liệu PLAN stale vào `_Archive`, xóa 6 file code orphan đã verify, tạo `CURRENT_PROJECT_CONTEXT.md` làm nguồn chân thực — không thay đổi behavior chạy thật (đặc biệt giữ đầy đủ XP/điểm hạng/streak/badge/leaderboard/check-in).

**Architecture:** SP1 là sub-project nền móng. Không đụng logic gamification/scoring. Chỉ di chuyển file PLAN (git mv vào `_Archive`), xóa code orphan không import, ghi 1 file doc mới. Mỗi task kết thúc bằng commit; cuối cùng chạy quality gate 4 lệnh phải pass.

**Tech Stack:** Next.js 16.2.7, Prisma 6.19.3, PostgreSQL, git. File ops via `git mv`/`git rm` để giữ history. Verify via `npx prisma validate`, `npx tsc --noEmit`, `npm test`, `npm run build`.

**Spec:** `docs/superpowers/specs/2026-06-18-sp1-cleanup-plan-and-orphan-code-design.md`

---

### Task 1: Tạo `_Archive` và README giải thích

**Files:**
- Create: `PLAN/_Archive/README.md`

- [ ] **Step 1: Tạo thư mục + README**

Tạo `PLAN/_Archive/README.md` với nội dung:

```markdown
# _Archive — Tài liệu lịch sử (KHÔNG dùng làm quyết định)

Ngày tạo: 18/06/2026 (SP1)

Thư mục này chứa các tài liệu PLAN đã lỗi thời hoặc mâu thuẫn với code thực tế, được di chuyển từ các thư mục PLAN khác để tránh dẫn sai khi code.

## Không dùng làm nguồn quyết định

Các file ở đây hoặc:
- mâu thuẫn với code đang chạy (vd cấm XP/streak trong khi code đã có đầy đủ), hoặc
- mô tả kiến trúc/công nghệ cũ (Next.js 14, Whisper, FastAPI xử lý scoring — đều không đúng hiện tại), hoặc
- chứa hướng dẫn đã bỏ (mock-token admin), hoặc
- rỗng/placeholder.

## Nguồn chân thực hiện tại

Khi code, đọc `PLAN/00_Project_Context/CURRENT_PROJECT_CONTEXT.md` thay vì các file ở đây.

## Lý do giữ (không xóa)

Giữ làm lịch sử đối chiếu cho khóa luận. Git vẫn có full history. Các tài liệu gốc này có giá trị ghi nhận quá trình, nhưng không phản ánh trạng thái hiện tại.

## Danh sách file đã archive (theo SP1)

- `project_spec.md` (từ `00_Project_Context/`) — cấm XP/streak, mâu thuẫn code.
- `CURRENT_SYSTEM_STATUS.md` (từ `00_Project_Context/`) — snapshot 08/06 lỗi thời, sai version.
- `PROJECT_CONTEXT.md` (từ `00_Project_Context/`) — kiến trúc cũ (Whisper, /api/phonemes).
- `COLOR_SYSTEM.md` (từ `03_UI_UX/`) — file rỗng.
- `ADMIN_ACCESS.md` (từ `04_Features/`) — hướng dẫn mock-token đã bỏ.
- `KH_AI_PROMPTS.md` (từ `05_AI_Skills/`) — prompt cũ, Next.js 14.
- `KH_VIBE_CODING.md` (từ `05_AI_Skills/`) — prompt cũ, ghi "DB chưa có xp/level" sai.
```

- [ ] **Step 2: Commit**

```bash
git add PLAN/_Archive/README.md
git commit -m "SP1.1: tao _Archive + README giai thich"
```

---

### Task 2: Archive 3 file `00_Project_Context` stale

**Files:**
- Move: `PLAN/00_Project_Context/project_spec.md` → `PLAN/_Archive/project_spec.md`
- Move: `PLAN/00_Project_Context/CURRENT_SYSTEM_STATUS.md` → `PLAN/_Archive/CURRENT_SYSTEM_STATUS.md`
- Move: `PLAN/00_Project_Context/PROJECT_CONTEXT.md` → `PLAN/_Archive/PROJECT_CONTEXT.md`

Lý do: 3 file này mâu thuẫn/lỗi thời (xem spec mục 1).

- [ ] **Step 1: git mv 3 file**

```bash
git mv "PLAN/00_Project_Context/project_spec.md" "PLAN/_Archive/project_spec.md"
git mv "PLAN/00_Project_Context/CURRENT_SYSTEM_STATUS.md" "PLAN/_Archive/CURRENT_SYSTEM_STATUS.md"
git mv "PLAN/00_Project_Context/PROJECT_CONTEXT.md" "PLAN/_Archive/PROJECT_CONTEXT.md"
```

- [ ] **Step 2: Verify đã di chuyển**

```bash
dir /b "PLAN\00_Project_Context"
dir /b "PLAN\_Archive"
```
Expected: `00_Project_Context` còn `DE_CUONG_DO_AN.md` (+ file mới ở Task 5); `_Archive` có 3 file vừa move + `README.md`.

- [ ] **Step 3: Commit**

```bash
git add -A PLAN/00_Project_Context PLAN/_Archive
git commit -m "SP1.2: archive 3 file 00_Project_Context stale (project_spec, CURRENT_SYSTEM_STATUS, PROJECT_CONTEXT)"
```

---

### Task 3: Archive `COLOR_SYSTEM.md` (rỗng) và `ADMIN_ACCESS.md` (mock-token)

**Files:**
- Move: `PLAN/03_UI_UX/COLOR_SYSTEM.md` → `PLAN/_Archive/COLOR_SYSTEM.md`
- Move: `PLAN/04_Features/ADMIN_ACCESS.md` → `PLAN/_Archive/ADMIN_ACCESS.md`

- [ ] **Step 1: git mv 2 file**

```bash
git mv "PLAN/03_UI_UX/COLOR_SYSTEM.md" "PLAN/_Archive/COLOR_SYSTEM.md"
git mv "PLAN/04_Features/ADMIN_ACCESS.md" "PLAN/_Archive/ADMIN_ACCESS.md"
```

- [ ] **Step 2: Verify**

```bash
dir /b "PLAN\03_UI_UX"
dir /b "PLAN\04_Features"
```
Expected: `03_UI_UX` còn `COLOR_SYSTEM_GUIDE.md`, `HCI_ACCESSIBILITY_AUDIT.md`, `HCI_ACCESSIBILITY_AUDIT_UPDATE_2026-06-14.md`, `UI_COMPONENTS_GUIDE.md`. `04_Features` còn các file feature khác (BADGE_SYSTEM_PLAN, DAILY_CHECKIN_*, SCORING_AND_LEADERBOARD_PLAN, STREAK_GAMIFICATION_GUIDE).

- [ ] **Step 3: Commit**

```bash
git add -A PLAN/03_UI_UX PLAN/04_Features PLAN/_Archive
git commit -m "SP1.3: archive COLOR_SYSTEM.md (rong) + ADMIN_ACCESS.md (mock-token da bo)"
```

---

### Task 4: Archive 2 prompt cũ `05_AI_Skills`

**Files:**
- Move: `PLAN/05_AI_Skills/KH_AI_PROMPTS.md` → `PLAN/_Archive/KH_AI_PROMPTS.md`
- Move: `PLAN/05_AI_Skills/KH_VIBE_CODING.md` → `PLAN/_Archive/KH_VIBE_CODING.md`

- [ ] **Step 1: git mv 2 file**

```bash
git mv "PLAN/05_AI_Skills/KH_AI_PROMPTS.md" "PLAN/_Archive/KH_AI_PROMPTS.md"
git mv "PLAN/05_AI_Skills/KH_VIBE_CODING.md" "PLAN/_Archive/KH_VIBE_CODING.md"
```

- [ ] **Step 2: Verify**

```bash
dir /b "PLAN\05_AI_Skills"
dir /b "PLAN\_Archive"
```
Expected: `05_AI_Skills` còn `AI_SKILLS_INVENTORY.md`, `SKILL_USAGE_BY_PHASE.md`. `_Archive` đủ 7 file archived + README.

- [ ] **Step 3: Commit**

```bash
git add -A PLAN/05_AI_Skills PLAN/_Archive
git commit -m "SP1.4: archive 2 prompt cu (KH_AI_PROMPTS, KH_VIBE_CODING) - Next.js 14, sai xp/level"
```

---

### Task 5: Tạo `CURRENT_PROJECT_CONTEXT.md` (nguồn chân thực mới)

**Files:**
- Create: `PLAN/00_Project_Context/CURRENT_PROJECT_CONTEXT.md`

- [ ] **Step 1: Tạo file với nội dung dưới đây**

`PLAN/00_Project_Context/CURRENT_PROJECT_CONTEXT.md`:

```markdown
# CURRENT_PROJECT_CONTEXT — Nguồn chân thực hiện tại

Ngày lập: 18/06/2026 (SP1)
Thay thế: `PROJECT_CONTEXT.md`, `CURRENT_SYSTEM_STATUS.md`, `project_spec.md` (đã archive vào `PLAN/_Archive/`).

Đây là tài liệu nguồn chân thực về trạng thái dự án. Khi code/AI cần biết "hệ thống hiện có gì", đọc file này trước, rồi mới đến `ACTION_PLAN_NEXT_STEPS.md`, `DB_AUDIT_REPORT.md`, `LESSON_SYLLABUS_STRUCTURE.md`.

## 1. Tech stack thực tế

| Thành phần | Version / trạng thái | Bằng chứng |
|---|---|---|
| Next.js | 16.2.7 (App Router, Turbopack) | `frontend/package.json` |
| React | 18.3.1 | `frontend/package.json` |
| Prisma | 6.19.3 + `@prisma/client` 6.19.3 | `frontend/package.json` |
| Database | PostgreSQL `english_app` (1 DB duy nhất) | `frontend/.env` `DATABASE_URL` |
| Auth | next-auth v5 beta (`next-auth@5.0.0-beta.31`), Credentials + Google | `frontend/src/lib/auth.ts` |
| Audio UI | wavesurfer.js 7.12.7 | `frontend/package.json` |
| CSS | Tailwind v4 (`@theme` trong `src/app/globals.css`, không có tailwind.config) | `frontend/src/app/globals.css` |
| Speech | Web Speech API (browser), KHÔNG có Whisper/ASR backend | `frontend/src/hooks/useSpeechRecognition.ts` |
| Backend Python | FastAPI 0.136.3 TỐI THIỂU — chỉ `/` và `/health`, KHÔNG có model/scoring/Whisper | `backend/app/main.py`, `backend/app/core/database.py` |
| Node | v24.x | `npx prisma --version` |

## 2. Kiến trúc thực tế

- **Scoring nằm ở frontend**: `frontend/src/lib/scoring.ts` + `frontend/src/app/api/exercises/submit/route.ts` (transaction Prisma). KHÔNG có ASR backend.
- **Gamification nằm ở frontend**: `frontend/src/lib/gamification.ts` (XP, level, badge, leaderboard, daily bonus).
- **Backend FastAPI**: giữ tối thiểu cho `/health` (mục đích: đáp ứng đề cương có backend, mở rộng sau). Hiện là dead code tối thiểu, không xung đột DB (không có model SQLAlchemy).
- **1 database PostgreSQL** duy nhất — Prisma (frontend) là chủ. Backend chỉ `SELECT 1` check kết nối.

## 3. Gamification đang chạy thật (NGƯỜI DÙNG YÊU CẦU GIỮ ĐẦY ĐỦ)

| Tính năng | Vị trí | Trạng thái |
|---|---|---|
| XP | `User.xp`, `gamification.ts:calculateLevelFromXp` | chạy thật |
| Điểm hạng / Leaderboard tuần-tháng | `Leaderboard` (type `tuan`/`thang`), `api/leaderboard/route.ts` | chạy thật |
| Streak | `User.streakCount/longestStreak/totalCheckIns/lastCheckInDate`, `api/checkin/route.ts` | chạy thật |
| Badge | `Badge`/`UserBadge`, `gamification.ts:BADGE_DEFINITIONS` (11 badge) | chạy thật |
| Daily check-in | `DailyActivity`, `api/checkin/route.ts` (+10 XP / +2 ranking) | chạy thật |
| Daily bonus | `gamification.ts:DAILY_BONUS_TABLE` (2/3/5/8 bài) | chạy thật |
| Level | 2 hệ lệch nhau — flag bug, fix ở SP6 | `gamification.ts:calculateLevelFromXp` (XP-based, API dùng) vs `levelSystem.ts` (lesson-based, `LevelDisplay.tsx` dùng) |

Bug đã biết (xử lý SP6, KHÔNG xóa `levelSystem.ts`/`mockData.ts` trong SP1):
- `levelSystem.ts` lesson-based lệch `gamification.ts` XP-based → UI hiển thị level sai so API.
- All-time leaderboard thiếu; badge `leaderboard_update` chưa auto; check-in chưa tự động khi submit; multiplier XP theo loại bài thiếu; giới hạn retake/ngày thiếu.

## 4. Database hiện tại (đã dọn + seed lại v1 sạch 18/06)

26 bảng, schema khớp `DATA_SEED_PLAN.md` mục 4. Chi tiết:
- Audit + sửa: `PLAN/02_Database_And_Data/DB_AUDIT_REPORT.md`.
- Cấu trúc v2 mục tiêu: `PLAN/02_Database_And_Data/LESSON_SYLLABUS_STRUCTURE.md` (30 nhóm/112 bài, 4 chủ đề).

Trạng thái v1 đang chạy: 4 topic, 25 sound group, 44 phoneme, 100 exercise, 25 learning map, 94 QuestionBankItem, 120 question. 5/25 nhóm có content đầy đủ, 20 nhóm shell DRAFT. Seed chính: `frontend/prisma/seed_lessons.ts` (idempotent, fetch audio thật từ Free Dictionary API).

## 5. Cấu trúc IPA v2 (mục tiêu, thực hiện SP2–SP4)

| Chủ đề | Nhóm | Bài | Chế độ |
|---|---:|---:|---|
| 1. Nguyên âm (đơn 6 + đôi 4) | 10 | 40 | 4 chế độ chuẩn |
| 2. Phụ âm (5 tầng) | 12 | 48 | 4 chế độ chuẩn |
| 3. Minimal Pairs Khó (mở khóa sau CĐ1+2) | 4 | 16 | 4 chế độ chuẩn, 10 câu/bài |
| 4. Trọng âm & Nối âm | 4 | 8 | 2 mode đặc thù (A nghe/chọn + B đọc/so khớp nhiều dạng) |
| **Tổng** | **30** | **112** | |

## 6. Roadmap thực tế — 6 sub-project (SP1–SP6)

| SP | Nội dung | Trạng thái |
|---|---|---|
| SP1 | Dọn PLAN stale + xóa orphan + tạo file này | đang thực hiện |
| SP2 | Data layer v2: schema thêm trường CĐ4 + unlock + `Topic.orderIndex`; catalog 30 nhóm | chờ |
| SP3 | Content + seed v2: 20 nhóm DRAFT + 4 nhóm CĐ4; re-seed | chờ |
| SP4 | Exercise Engine v2: 4 UI mới (tap-stress/weak/linking/assimilation) + Mode B multi-answer + scoring multiplier/retake | chờ |
| SP5 | Admin CRUD QuestionBank/Phoneme/WordItem/SoundGroup/MinimalPair/SentenceItem | chờ |
| SP6 | Gamification补全: fix level 2 hệ, all-time leaderboard, auto badge, check-in auto, unlock CĐ3, mailer (tùy chọn) | chờ |

Đối chiếu `PLAN/01_Roadmap/ACTION_PLAN_NEXT_STEPS.md` (roadmap phase cũ): Phase 1–5 + 7-read đã có code; Phase 6, 8 đang dở — SP2–SP6 là kế hoạch nâng v2 đè lên các phase còn dở.

## 7. Nguồn ưu tiên đọc khi code

1. `PLAN/00_Project_Context/CURRENT_PROJECT_CONTEXT.md` (file này)
2. `PLAN/01_Roadmap/ACTION_PLAN_NEXT_STEPS.md`
3. `PLAN/02_Database_And_Data/DB_AUDIT_REPORT.md`
4. `PLAN/02_Database_And_Data/LESSON_SYLLABUS_STRUCTURE.md`
5. `PLAN/02_Database_And_Data/LESSON_CODING_PLAN.md` (v1, còn dùng cho seed hiện tại)
6. `english_pronunciation_app/.agents/skills/<skill>/SKILL.md` (theo `PLAN/05_AI_Skills/SKILL_USAGE_BY_PHASE.md`)

## 8. Quy ước

- Prisma, không raw SQL; transaction cho thao tác phức tạp.
- TDD cho logic mới (scoring, gamification, generation). Dọn file/doc không cần TDD.
- Quality gate trước khi khai báo xong: `npx prisma validate` + `npx tsc --noEmit --pretty false` + `npm test` + `npm run build` — tất cả pass.
- Seed idempotent (upsert theo id), fetch audio thật cho `sourceType: FREE_API`.
```

- [ ] **Step 2: Verify file tạo**

```bash
dir /b "PLAN\00_Project_Context"
```
Expected: `CURRENT_PROJECT_CONTEXT.md`, `DE_CUONG_DO_AN.md`.

- [ ] **Step 3: Commit**

```bash
git add PLAN/00_Project_Context/CURRENT_PROJECT_CONTEXT.md
git commit -m "SP1.5: tao CURRENT_PROJECT_CONTEXT.md - nguon chan thuc moi"
```

---

### Task 6: Xóa 6 file code orphan đã verify

**Files:**
- Delete: `english_pronunciation_app/frontend/prisma/seed.ts`
- Delete: `english_pronunciation_app/frontend/prisma/seed_real.ts`
- Delete: `english_pronunciation_app/frontend/src/components/exercises/ExerciseType1.tsx`
- Delete: `english_pronunciation_app/frontend/src/components/exercises/ExerciseType3.tsx`
- Delete: `english_pronunciation_app/frontend/src/components/exercises/ExerciseType4.tsx`
- Delete: `english_pronunciation_app/frontend/src/lib/audioData.ts`

Verify orphan: `findstr /s /i /m` trên toàn frontend (excl node_modules) — không có import nào ngoài chính file đó (đã kiểm tra trong brainstorm). `audioData.ts` chỉ được import bởi `ExerciseType1.tsx` (cũng xóa).

- [ ] **Step 1: git rm 6 file**

```bash
cd english_pronunciation_app\frontend
git rm prisma/seed.ts prisma/seed_real.ts
git rm src/components/exercises/ExerciseType1.tsx src/components/exercises/ExerciseType3.tsx src/components/exercises/ExerciseType4.tsx
git rm src/lib/audioData.ts
cd ..\..
```

- [ ] **Step 2: Verify không còn import tới file đã xóa**

```bash
cd english_pronunciation_app\frontend
findstr /s /i /m "audioData ExerciseType1 ExerciseType3 ExerciseType4" src 2>nul
findstr /s /i /m "from.*\./seed\b\|from.*\./seed_real" src prisma\seed_lessons.ts 2>nul
cd ..\..
```
Expected: không có kết quả (rỗng). Nếu có → file còn import → KHÔNG commit, báo lại.

- [ ] **Step 3: Commit**

```bash
git add -A english_pronunciation_app/frontend
git commit -m "SP1.6: xoa 6 file orphan (seed.ts, seed_real.ts, ExerciseType1/3/4.tsx, audioData.ts) - da verify khong import"
```

---

### Task 7: Cập nhật tham chiếu chéo trong PLAN

Audit phát hiện `ACTION_PLAN_NEXT_STEPS.md:367` và `PLAN/README.md` tham chiếu file đã archive, và `PLAN_FILE_AUDIT.md` đã khuyến nghị đúng archive. Cập nhật để tham chiếu không đứt.

**Files:**
- Modify: `PLAN/01_Roadmap/ACTION_PLAN_NEXT_STEPS.md` (dòng tham chiếu CURRENT_SYSTEM_STATUS)
- Modify: `PLAN/README.md` (nếu có tham chiếu file archived)
- Modify: `PLAN/PLAN_FILE_AUDIT.md` (ghi nhận đã thực hiện khuyến nghị)

- [ ] **Step 1: Đọc dòng tham chiếu trong ACTION_PLAN_NEXT_STEPS.md quanh dòng 367**

```bash
cd /d D:\01_Company_Work\Projects\Web_HoTroPhatAmEN
```
Đọc `PLAN/01_Roadmap/ACTION_PLAN_NEXT_STEPS.md` offset 360 limit 15 để xem tham chiếu `CURRENT_SYSTEM_STATUS.md`, sửa thành `CURRENT_PROJECT_CONTEXT.md` (nếu ngữ cảnh là "đọc trạng thái hiện tại"). Nếu chỉ là "lịch sử", đổi đường dẫn sang `PLAN/_Archive/CURRENT_SYSTEM_STATUS.md`.

- [ ] **Step 2: Đọc PLAN/README.md và PLAN_FILE_AUDIT.md**

Xem `PLAN/README.md` có liệt kê file archived không; nếu có, thêm ghi chú "đã archive vào `_Archive/`, nguồn thay thế: `CURRENT_PROJECT_CONTEXT.md`". Trong `PLAN_FILE_AUDIT.md` thêm 1 đoạn ngắn cuối file: "18/06/2026: Đã thực hiện khuyến nghị archive + tạo `CURRENT_PROJECT_CONTEXT.md` (SP1)."

- [ ] **Step 3: Commit**

```bash
git add PLAN/01_Roadmap/ACTION_PLAN_NEXT_STEPS.md PLAN/README.md PLAN/PLAN_FILE_AUDIT.md
git commit -m "SP1.7: cap nhat tham chieu cheo sau archive (ACTION_PLAN, README, PLAN_FILE_AUDIT)"
```

---

### Task 8: Quality gate — chứng minh không vỡ

**Files:** không sửa code, chỉ chạy verify.

- [ ] **Step 1: prisma validate**

```bash
cd english_pronunciation_app\frontend
npx prisma validate
cd ..\..
```
Expected: `The schema at prisma\schema.prisma is valid` (có thể kèm warn về prisma config deprecated — OK).

- [ ] **Step 2: tsc --noEmit**

```bash
cd english_pronunciation_app\frontend
npx tsc --noEmit --pretty false
cd ..\..
```
Expected: không output (pass). Nếu có lỗi → file còn import orphan chưa xóa hết → quay Task 6 Step 2.

- [ ] **Step 3: npm test**

```bash
cd english_pronunciation_app\frontend
npm test
cd ..\..
```
Expected: `pass 17` (hoặc hơn), `fail 0`.

- [ ] **Step 4: npm run build**

```bash
cd english_pronunciation_app\frontend
npm run build
cd ..\..
```
Expected: `✓ Compiled successfully`, `✓ Generating static pages ... (24/24)`, không error.

- [ ] **Step 5: Commit note chất lượng (tuỳ chọn)**

```bash
git commit --allow-empty -m "SP1.8: quality gate pass (prisma validate + tsc + 17 test + build) - khong vo"
```

---

## Tiêu chí hoàn thành SP1

- [ ] `PLAN/_Archive/` có README + 7 file archived.
- [ ] `PLAN/00_Project_Context/` có `CURRENT_PROJECT_CONTEXT.md` + `DE_CUONG_DO_AN.md` (file đề cương giữ).
- [ ] 6 file orphan đã xóa, không còn import.
- [ ] Tham chiếu chéo trong PLAN cập nhật.
- [ ] Quality gate 4 lệnh pass.
- [ ] XP/điểm hạng/streak/badge/leaderboard/check-in KHÔNG bị đụng (verify bằng `npm test` + build).

## Sau SP1

Chuyển sang brainstorm SP2 (Data layer v2: schema + catalog 30 nhóm). SP1 xong cung cấp nền móng tài liệu tin cậy để SP2 không bị kéo theo plan sai.
