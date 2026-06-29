# HANDOFF — Bàn giao cho AI khác tiếp tục

**Ngày tạo:** 2026-06-19  
**Phiên:** Session SP3d → SP4 → SP7 (gamification)  
**Mục đích:** File này giúp AI khác hiểu toàn bộ project structure, trạng thái hiện tại, và tiếp tục từ đâu.

---

## 1. Cấu trúc thư mục — Cách dùng

### `PLAN/` — Tài liệu kế hoạch đồ án (tĩnh, tham chiếu)
```
PLAN/
├── 00_Project_Context/
│   ├── CURRENT_PROJECT_CONTEXT.md    ← ⭐ FILE QUAN TRỌNG NHẤT — đọc đầu tiên
│   └── DE_CUONG_DO_AN.md             ← Đề cương đồ án
├── 01_Roadmap/
│   ├── ACTION_PLAN_NEXT_STEPS.md     ← Roadmap phase cũ
│   ├── KE_HOACH_THUC_HIEN.md         ← Kế hoạch thực hiện
│   └── DEMO_SCENARIO_PLAN.md         ← Kịch bản demo
├── 02_Database_And_Data/
│   ├── DB_AUDIT_REPORT.md            ← Báo cáo audit DB
│   ├── LESSON_SYLLABUS_STRUCTURE.md  ← Cấu trúc syllabus 30 nhóm
│   └── DATA_SEED_PLAN.md             ← Plan seed data
├── 03_UI_UX/
│   ├── UI_COMPONENTS_GUIDE.md        ← Guide component UI
│   └── COLOR_SYSTEM_GUIDE.md         ← Hệ màu Tailwind
├── 04_Features/
│   ├── BADGE_SYSTEM_PLAN.md          ← Plan badge system
│   ├── DAILY_CHECKIN_FEATURE.md      ← Plan check-in
│   └── SCORING_AND_LEADERBOARD_PLAN.md ← Plan scoring
├── 05_AI_Skills/
│   └── SKILL_USAGE_BY_PHASE.md       ← Hướng dẫn dùng skills
├── PLAN_FILE_AUDIT.md                ← Audit file PLAN
└── README.md                         ← Hướng dẫn dùng thư mục PLAN
```

**Cách dùng `PLAN/`:** Đây là tài liệu **tĩnh** (tham chiếu, không cập nhật liên tục). Đọc `CURRENT_PROJECT_CONTEXT.md` đầu tiên để hiểu toàn cảnh. Các file khác là plan chi tiết cho từng feature/module.

### `docs/superpowers/` — Specs + Plans (theo dõi tiến trình) ⭐
```
docs/superpowers/
├── specs/    ← Design specs (brainstorm → design → duyệt → spec)
│   ├── 2026-06-18-sp1-*.md           ← SP1 cleanup + feedback (xong)
│   ├── 2026-06-18-sp2-*.md           ← SP2 data layer v2 (xong)
│   ├── 2026-06-18-sp3a-*.md          ← SP3a content CD1 (xong)
│   ├── 2026-06-18-listen-choose-*.md ← Listen-choose 3-stage (xong)
│   ├── 2026-06-19-sp2-summary-*.md   ← SP2 summary redesign (xong)
│   ├── 2026-06-19-sp3b-*.md          ← SP3b content CD2 (xong)
│   ├── 2026-06-19-sp3d-*.md          ← SP3d content CD4 (xong)
│   ├── 2026-06-19-sp4a-*.md          ← SP4a voice waveform + feedback (xong)
│   ├── 2026-06-19-sp4-modea-*.md     ← SP4 Mode A UI CĐ4 (xong)
│   ├── 2026-06-19-sp4-modeb-*.md     ← SP4 Mode B acceptedAnswers (xong)
│   └── 2026-06-19-sp7-*.md           ← SP7 gamification (ĐANG DỞ)
└── plans/   ← Implementation plans (task-by-task, TDD)
    ├── (tương ứng với specs, file .md không có "-design")
    └── 2026-06-19-sp7-gamification-3-elements.md ← SP7 plan (ĐANG DỞ Task 2)
```

**Cách dùng `docs/superpowers/`:** Đây là **nơi theo dõi tiến trình code**. Mỗi feature có 2 file:
- `specs/YYYY-MM-DD-<feature>-design.md` — design spec (brainstorm → duyệt)
- `plans/YYYY-MM-DD-<feature>.md` — implementation plan (task-by-task, checkbox `- [ ]`)

**Workflow superpowers (đã dùng toàn session):**
1. `brainstorming` skill → trình design theo section → user duyệt → viết spec
2. `writing-plans` skill → viết implementation plan (task-by-task TDD)
3. `executing-plans` skill → execute từng task (inline, vì subagent read-only)
4. `verification-before-completion` → quality gate (test + tsc + build)

### `english_pronunciation_app/frontend/` — Source code
```
english_pronunciation_app/frontend/
├── prisma/
│   ├── schema.prisma                 ← Prisma schema (26+ bảng)
│   ├── seed_lessons.ts               ← Seed lessons (content-driven)
│   ├── seed_audio_local.ts           ← Rút mp3 local (idempotent)
│   ├── seed_listen_choose_audio.ts   ← Bake contrast audio
│   ├── seed_demo_user.ts             ← ⭐ Tạo demo user (Admin login)
│   ├── seed_learner_profiles.ts             ← ⭐ Tạo 7 learner + gamification data
│   ├── db_cleanup.ts                 ← TRUNCATE tất cả bảng (cẩn thận!)
│   ├── lesson-content.ts             ← Content data (WORDS/PAIRS/SENTENCES)
│   ├── lesson-catalog.ts             ← Catalog 4 topic + 30 nhóm + 6 mode
│   └── listen-choose-builder.ts      ← Builder 3-stage phoneme ID
├── src/
│   ├── app/
│   │   ├── admin/                    ← Admin dashboard (page.tsx)
│   │   ├── exercises/[id]/           ← Exercise engine + question components
│   │   │   ├── ExerciseEngineClient.tsx  ← ⭐ Engine chính (dispatch qtype)
│   │   │   ├── page.tsx              ← Load exercise + questions
│   │   │   ├── TapStressQuestion.tsx     ← SP4 Mode A (CĐ4 tap-stress)
│   │   │   ├── ChooseWeakQuestion.tsx    ← SP4 Mode A (CĐ4 choose-weak)
│   │   │   ├── ChooseLinkingQuestion.tsx ← SP4 Mode A (CĐ4 choose-linking)
│   │   │   ├── ChooseAssimilationQuestion.tsx ← SP4 Mode A (CĐ4 choose-assim)
│   │   │   ├── useSynthesisAudio.ts      ← Helper speechSynthesis
│   │   │   ├── SpeakWordQuestion.tsx     ← Speak word (speech recognition)
│   │   │   ├── SpeakSentenceQuestion.tsx ← Speak sentence (speech recognition)
│   │   │   ├── SpeakMinimalPairsQuestion.tsx ← Speak minimal pairs
│   │   │   ├── ListenFeedbackSheet.tsx   ← Feedback bottom-sheet (listen)
│   │   │   ├── SpeakFeedbackSheet.tsx    ← Feedback bottom-sheet (speak)
│   │   │   └── ExerciseSummaryScreen.tsx ← Summary screen (rating + XP)
│   │   ├── api/
│   │   │   ├── exercises/submit/route.ts ← ⭐ Submit route (scoring + XP + gem)
│   │   │   ├── checkin/route.ts          ← Check-in route (streak + XP)
│   │   │   ├── leaderboard/route.ts      ← Leaderboard (tuan/thang)
│   │   │   ├── auth/register/route.ts    ← Register
│   │   │   └── admin/                    ← Admin CRUD routes
│   │   ├── dashboard/page.tsx            ← User dashboard (XP/level/streak)
│   │   ├── learning_map/                 ← Learning map (topics + groups)
│   │   ├── leaderboard/page.tsx          ← Leaderboard page
│   │   ├── badges/page.tsx               ← Badges gallery
│   │   └── checkin/page.tsx              ← Check-in page
│   ├── lib/
│   │   ├── auth.ts                       ← NextAuth config (Credentials + Google)
│   │   ├── auth.config.ts                ← Auth callbacks
│   │   ├── gamification.ts               ← ⭐ Gamification logic (XP/level/badge/gem/freeze)
│   │   ├── scoring.ts                    ← ⭐ Scoring (scoreQuestion + rating)
│   │   ├── levelSystem.ts                ← ⚠️ DEAD CODE (lesson-based level, không dùng)
│   │   ├── period.ts                     ← Leaderboard period (tuan/thang)
│   │   ├── prisma.ts                     ← Prisma client singleton
│   │   └── sfx.ts                        ← Sound effects (WebAudio)
│   ├── hooks/
│   │   ├── useSpeechRecognition.ts       ← Speech recognition hook (cho IPA chart)
│   │   ├── useWaveformRecorder.ts        ← Waveform recorder (wavesurfer)
│   │   └── useComboStreak.ts             ← Combo 🔥 streak hook
│   ├── components/
│   │   ├── gamification/
│   │   │   ├── LevelDisplay.tsx          ← ⚠️ DEAD CODE (không import đâu)
│   │   │   ├── DailyCheckIn.tsx          ← Check-in widget
│   │   │   └── StreakBadge.tsx           ← ⚠️ DEAD CODE
│   │   ├── admin/                        ← Admin components (dashboard, management)
│   │   └── ui/                           ← UI primitives (Button, Card, ProgressBar, Badge)
│   └── lib/__tests__/                    ← Tests (tsx --test)
│       ├── scoring.test.ts               ← Scoring tests (qtype-1..7)
│       ├── gamification.test.ts          ← Gamification tests (XP/level/badge/gem/freeze)
│       ├── lesson-content.test.ts        ← Content tests (CĐ1/2/4)
│       ├── lesson-catalog.test.ts        ← Catalog tests
│       └── listen-choose-builder.test.ts ← 3-stage builder tests
├── public/audio/                         ← 197 mp3 files (local audio)
├── package.json                          ← Dependencies + scripts
└── .env                                  ← DATABASE_URL (PostgreSQL)
```

---

## 2. Thư mục theo dõi tiến trình code

### Nơi theo dõi tiến trình chính: `docs/superpowers/plans/`
Mỗi file plan có **checkbox `- [ ]`** theo task. Đọc file plan để biết task nào xong/chưa:
- `- [x]` = xong
- `- [ ]` = chưa

### Nơi theo dõi trạng thái project: `PLAN/00_Project_Context/CURRENT_PROJECT_CONTEXT.md`
File này có:
- Section 3: Gamification đang chạy thật (cập nhật 19/06)
- Section 4: Database hiện tại (catalog v2 đã seed)
- Section 6: Roadmap 6 sub-project (SP1-SP6) + % hoàn thành
- **⚠️ Cần update** sau session này (SP3d/SP4/SP7 + bugs fixed)

### Nơi theo dõi commit: `git log --oneline`
Mỗi spec/plan đều commit. Xem `git log --oneline -20` để biết recent work.

### Nơi theo dõi code chưa commit: `git status --short`
Code implementation (không phải spec/plan) **chưa commit** — user tự commit. Xem `git status --short` để biết file nào đã sửa/tạo.

---

## 3. Trạng thái project hiện tại (snapshot 2026-06-19)

### Tech stack
- Next.js 16.2.7 (App Router, Turbopack) + React 18 + TypeScript 6
- Prisma 6.19.3 + PostgreSQL `english_app`
- NextAuth v5 beta (Credentials + Google)
- wavesurfer.js 7 (waveform), canvas-confetti (summary)
- Tailwind v4 (no config file, @theme in globals.css)
- Test: `tsx --test` (Node built-in)

### Database
- 26+ bảng (User, Role, Topic, SoundGroup, Exercise, Question, WordItem, MinimalPair, SentenceItem, QuestionBankItem, ExerciseAttempt, Leaderboard, DailyActivity, Badge, UserBadge, Progress, DailyQuest [MỚI SP7], ...)
- 30 sound groups (10 CD1 vowels + 12 CD2 consonants + 4 CD3 minimal-pairs-hard + 4 CD4 stress-connected)
- 112 exercises (4 mode CĐ1-3 + 2 mode CĐ4)
- 216 WordItems (208 có audio local, 8 NEEDS_REVIEW)

### Roadmap (SP1-SP7) — % hoàn thành

| SP | Nội dung | Trạng thái |
|---|---|---|
| SP1 | Dọn PLAN stale + orphan + feedback | ✅ 100% |
| SP2 | Data layer v2 (schema + catalog + seed) | ✅ 100% |
| SP3a | Content CD1 (10 nhóm) + audio local | ✅ 100% |
| SP3b | Content CD2 (12 nhóm Phụ âm) | ✅ 100% |
| SP3d | Content CD4 (4 nhóm Trọng âm & Nối âm) | ✅ Code xong, chưa commit |
| SP4 Mode A | UI 4 dạng CĐ4 listen-style | ✅ Code xong, chưa commit |
| SP4 Mode B | acceptedAnswers multi-answer (g02) | ✅ Code xong, chưa commit |
| SP4a | Voice waveform + speak feedback bottom-sheet | ✅ 100% (committed trước) |
| SP5 | Admin CRUD (6 pool models + users + badges) | ⏸ Chưa làm |
| SP6 | Gamification補全 (gating CĐ3/CĐ4 + level fix + leaderboard all-time + checkin auto) | ⏸ Chưa làm (explore xong) |
| SP7 | Gamification 3 yếu tố (Gem+Shop / Daily Quests / Streak Freeze) | 🟠 ĐANG DỞ — Task 1 xong (schema migration), Task 2 đang dở (test TDD) |

### SP7 tiến trình chi tiết (đang dở)
- **Task 1 ✅**: Schema migration (User +4 field: gems, streakFreezes, unlockedIpaReveal, unlockedSlowAudio + DailyQuest model). DB push sync. Prisma client regenerated. Schema valid + tsc clean.
- **Task 2 🟠 (dở)**: Test TDD Batch 1 — đã thêm import `computeGemReward, validateShopPurchase, calculateNextStreak` vào `gamification.test.ts`, nhưng **chưa thêm 4 test body** + **chưa run test fail**. Cần hoàn thành.
- **Task 3-13 ⏸**: Chưa bắt đầu.

**Đọc file plan để tiếp tục:** `docs/superpowers/plans/2026-06-19-sp7-gamification-3-elements.md` (13 task, checkbox `- [ ]`).

---

## 4. Code chưa commit (working tree)

### Đã sửa (modified)
```
M english_pronunciation_app/frontend/prisma/lesson-content.ts          ← SP3d content CD4 + type extension
M english_pronunciation_app/frontend/prisma/schema.prisma             ← SP7 +4 field User + DailyQuest
M english_pronunciation_app/frontend/prisma/seed_audio_local.ts       ← SP3d fix flip NEEDS_REVIEW→ACTIVE
M english_pronunciation_app/frontend/prisma/seed_lessons.ts           ← SP3d seed branch mode A/B + idempotent audio
M english_pronunciation_app/frontend/src/app/api/exercises/submit/route.ts ← SP4 Mode B + SP7 gem hook (Task 4 chưa làm)
M english_pronunciation_app/frontend/src/app/exercises/[id]/ExerciseEngineClient.tsx ← SP4 Mode A dispatch + parseWordPrompt fix + Mode B ExerciseQuestion +field
M english_pronunciation_app/frontend/src/app/exercises/[id]/SpeakMinimalPairsQuestion.tsx ← speak mic-denied UX fix
M english_pronunciation_app/frontend/src/app/exercises/[id]/SpeakSentenceQuestion.tsx ← SP4 Mode B checkAnswer multi-match + mic-denied UX
M english_pronunciation_app/frontend/src/app/exercises/[id]/SpeakWordQuestion.tsx ← mic-denied UX fix
M english_pronunciation_app/frontend/src/app/exercises/[id]/page.tsx  ← SP4 Mode B map acceptedAnswers
M english_pronunciation_app/frontend/src/lib/__tests__/gamification.test.ts ← SP7 Task 2 import (dở)
M english_pronunciation_app/frontend/src/lib/__tests__/lesson-content.test.ts ← SP3d +5 test CĐ4
M english_pronunciation_app/frontend/src/lib/__tests__/scoring.test.ts ← SP4 Mode A +4 test + Mode B +2 test
M english_pronunciation_app/frontend/src/lib/scoring.ts               ← SP4 Mode A +4 branch + Mode B scoreVoice max-match
```

### Đã tạo (untracked)
```
?? english_pronunciation_app/frontend/prisma/seed_learner_profiles.ts        ← 7 learner + gamification data
?? english_pronunciation_app/frontend/prisma/seed_demo_user.ts        ← Admin demo user login
?? english_pronunciation_app/frontend/src/app/exercises/[id]/ChooseAssimilationQuestion.tsx ← SP4 Mode A
?? english_pronunciation_app/frontend/src/app/exercises/[id]/ChooseLinkingQuestion.tsx      ← SP4 Mode A
?? english_pronunciation_app/frontend/src/app/exercises/[id]/ChooseWeakQuestion.tsx         ← SP4 Mode A
?? english_pronunciation_app/frontend/src/app/exercises/[id]/TapStressQuestion.tsx          ← SP4 Mode A
?? english_pronunciation_app/frontend/src/app/exercises/[id]/useSynthesisAudio.ts           ← SP4 Mode A helper
```

### Pre-existing (không liên quan session này)
```
M english_pronunciation_app/frontend/src/hooks/useWaveformRecorder.ts  ← Trước session
M english_pronunciation_app/frontend/tsconfig.tsbuildinfo              ← Auto-generated
M english_pronunciation_app/frontend/next-env.d.ts                     ← Auto-generated
?? WORD/                                                               ← Artifact cũ (07:11 AM trước session)
```

---

## 5. Demo credentials + pipeline

### Demo users
| Email | Password | Role | Ghi chú |
|---|---|---|---|
| `demo@pronunciation.app` | `abc@123456` | Admin | Truy cập /admin |
| `duc@gmail.com` | `abc@123456` | User | XP 4100, level 5 |
| `hoang@gmail.com` | `abc@123456` | User | XP 3200, level 4 |
| `minh@gmail.com` | `abc@123456` | User | XP 2450, level 3 |
| `lan@gmail.com` | `abc@123456` | User | XP 1820, level 2 |
| `mai@gmail.com` | `abc@123456` | User | XP 980, level 2 |
| `anh@gmail.com` | `abc@123456` | User | XP 560, level 1 |

### Pipeline re-seed chuẩn (sau db_cleanup)
```bash
cd english_pronunciation_app/frontend
npx tsx prisma/db_cleanup.ts          # TRUNCATE tất cả (mất data!)
npm run db:seed:lessons               # Seed lessons (content-driven)
npx tsx prisma/seed_audio_local.ts    # Rút mp3 local (idempotent)
npx tsx prisma/seed_listen_choose_audio.ts  # Bake contrast audio
npx tsx prisma/seed_demo_user.ts      # Tạo Admin demo user
npx tsx prisma/seed_learner_profiles.ts      # Tạo 7 learner + gamification data
```

### Quality gate (chạy trước khi khai báo xong)
```bash
npx prisma validate    # Schema valid
npx tsc --noEmit       # 0 error
npm test               # All pass (74+ test)
npm run build          # Next.js build success
```

---

## 6. Bugs đã fix session này

| Bug | Root cause | Fix | File |
|---|---|---|---|
| "Không tìm thấy user" (submit) | `db_cleanup` truncate User, không có user seed | `seed_demo_user.ts` (Role + demo user) | `prisma/seed_demo_user.ts` (mới) |
| 3-stage listen_choose không render | `parseWordPrompt` không gán stage/answerType/skeleton/contrastPhonemes (type có nhưng parser quên) | Parser +5 field | `ExerciseEngineClient.tsx:111` |
| speak "Không nghe thấy giọng nói" mơ hồ | `recog.onerror` bỏ qua `e.error` code — mic-denied vs no-speech cùng message | `onerror` phân biệt `not-allowed` → "🔒 Microphone bị chặn" | `SpeakWord/SpeakSentence/SpeakMinimalPairs` |
| /admin redirect → /dashboard | `.next/` build cache cũ (middleware build trước) | Xóa `.next/` + rebuild | (manual) |
| /admin Internal Server Error | Prisma client cũ (chưa regenerate sau schema change) | `npx prisma generate` + restart dev server | (manual) |
| g01 mode_a = 0 câu (audio API flaky) | `seedWordItems` re-fetch API ghi đè ACTIVE→NEEDS_REVIEW dù local audio có | Idempotent: preserve ACTIVE+local audioUrl khi re-seed | `seed_lessons.ts:292` |
| seed_audio_local không flip NEEDS_REVIEW→ACTIVE | Skip-path chỉ update audioUrl, không set status | Skip-path + `status: "ACTIVE"` | `seed_audio_local.ts:87` |

---

## 7. Hướng dẫn cho AI tiếp theo

### Đọc theo thứ tự:
1. **File này** (handoff) — hiểu toàn cảnh
2. `PLAN/00_Project_Context/CURRENT_PROJECT_CONTEXT.md` — context chi tiết
3. `docs/superpowers/plans/2026-06-19-sp7-gamification-3-elements.md` — plan SP7 đang dở (tiếp từ Task 2)
4. `docs/superpowers/specs/2026-06-19-sp7-gamification-3-elements-design.md` — design SP7

### Tiếp tục SP7 từ đâu:
- **Task 2 đang dở**: `gamification.test.ts` đã thêm import (`computeGemReward, validateShopPurchase, calculateNextStreak`) nhưng **chưa thêm 4 test body** + **chưa run test fail**. Hoàn thành Task 2 (thêm 4 test + run fail), rồi Task 3-13 theo plan.
- **Spec**: `docs/superpowers/specs/2026-06-19-sp7-gamification-3-elements-design.md`
- **Plan**: `docs/superpowers/plans/2026-06-19-sp7-gamification-3-elements.md` (13 task, checkbox)

### Workflow superpowers (đã dùng toàn session):
1. `brainstorming` skill → design → spec → commit
2. `writing-plans` skill → plan → commit
3. `executing-plans` skill → execute task-by-task (inline)
4. Quality gate: `prisma validate + tsc + test + build`

### Git policy:
- **Engineer KHÔNG tự commit** code implementation (user handles)
- Spec + plan commit được (AI có thể commit doc)
- Branch: `main` (project dùng main cho SP work)

### Lưu ý quan trọng:
- **Dev server**: nếu `prisma generate` fail (EPERM) → kill dev server (node.exe PID lớn nhất) → retry
- **db_cleanup**: TRUNCATE tất cả → mất demo users → re-seed `seed_demo_user` + `seed_learner_profiles`
- **Demo login**: `demo@pronunciation.app` / `abc@123456` (Admin)
- **Audio local**: 197 mp3 trong `public/audio/` — không re-fetch API (idempotent `seed_audio_local`)
- **Dead code**: `levelSystem.ts` + `LevelDisplay.tsx` + `StreakBadge.tsx` — KHÔNG xóa (CURRENT_PROJECT_CONTEXT nói giữ)
- **Subagent**: Explore agent read-only (không Write/Edit) → inline execution cho implement
- **Word Stress data** (g01): syllables + stressIndex **gõ tay** (không tool/library) — 8 từ pilot, chưa verify Cambridge

### Còn pending (sau SP7):
- SP5: Admin CRUD (6 pool models + users + badges-config)
- SP6: Gating CĐ3/CĐ4 80% + level fix (dead code) + leaderboard all-time + checkin auto
- SP7 Batch 2: Daily Quests + UI (Task 7-13)
- Commit code implementation (user tự làm)
- Push commits lên GitHub (user tự làm)
