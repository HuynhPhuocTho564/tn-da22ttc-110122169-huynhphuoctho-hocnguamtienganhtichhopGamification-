# SP7 Gamification (adjusted) — 3 yếu tố Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Git policy:** Engineer KHÔNG tự commit. Mỗi task kết thúc checkpoint review với user; user tự commit khi convenient.

**Goal:** Tích hợp 3 yếu tố game (Gem+Shop, Daily Quests, Streak Freeze) vào app phát âm, chuyển gamification thụ động → chủ động (meta loop kinh tế).

**Architecture:** Hướng spec `2026-06-19-sp7-gamification-3-elements-design.md`. Schema migration (User +4 field + DailyQuest model). Server-authoritative gem (submit + shop route). 2 batch: Batch 1 (Gem + Shop + Streak Freeze + migration — foundation), Batch 2 (Daily Quests + UI).

**Tech Stack:** Next.js 16, React 18, TypeScript 6, Prisma 6, Tailwind 4, test runner `tsx --test`.

**Spec reference:** `docs/superpowers/specs/2026-06-19-sp7-gamification-3-elements-design.md`

**Codebase root note:** Source dưới `english_pronunciation_app/frontend/`. Path tương đối từ đây. Chạy `npm`/`npx`/`tsx` từ đây.

**Key context:**
- `User` schema hiện có xp/level/streakCount/longestStreak/totalCheckIns/lastCheckInDate. **+4 field mới**: gems, streakFreezes, unlockedIpaReveal, unlockedSlowAudio.
- Submit route `api/exercises/submit/route.ts:210` `tx.user.update` — hook gem + quest ở đây.
- Checkin route `api/checkin/route.ts:32` `calculateNextStreak(lastCheckInDate, currentStreak, today)` — thêm param `streakFreezes`.
- `useComboStreak.ts` — combo counter, cần track maxCombo ở engine.
- Engine `ExerciseEngineClient.tsx:340` `combo = useComboStreak()`.

---

## Batch 1 — Gem + Shop + Streak Freeze + migration

### Task 1: Schema migration

**Files:**
- Modify: `prisma/schema.prisma`

- [ ] **Step 1: User +4 field**

Trong `prisma/schema.prisma`, model User, sau `lastCheckInDate DateTime?` (line ~38), thêm:
```prisma
  // v2 SP7 Gamification: Gem + Shop + Streak Freeze
  gems              Int       @default(0)    // Tiền tệ ảo
  streakFreezes     Int       @default(0)    // Số bùa đóng băng sở hữu
  unlockedIpaReveal Boolean   @default(false) // Item Kính Lúp IPA unlock
  unlockedSlowAudio Boolean   @default(false) // Item Loa Ma Thuật unlock
```
Và thêm relation `dailyQuests DailyQuest[]` sau `leaderboards Leaderboard[]`.

- [ ] **Step 2: DailyQuest model**

Thêm model mới (sau model User hoặc cuối section User):
```prisma
model DailyQuest {
  id          String   @id @default(uuid())
  userId      String
  date        DateTime               // yyyy-mm-dd (start of day)
  questType   String                 // "PRACTICE_3" | "CD2_3" | "CD4_LINKING_3"
  target      Int                    // 3
  progress    Int       @default(0)
  completed   Boolean   @default(false)
  rewardXp    Int                    // 50
  rewardGems  Int                    // 10
  claimedAt   DateTime?              // khi reward claim (completed + gem/xp awarded)
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([userId, date, questType])
  @@index([userId, date])
}
```

- [ ] **Step 3: Run migration**
```bash
npx prisma migrate dev --name sp7_gamification_3
npx prisma generate
```
Expected: migration tạo SQL (ALTER TABLE User + CREATE TABLE DailyQuest). `prisma generate` regen client.

- [ ] **Step 4: Verify**
```bash
npx prisma validate
npx tsc --noEmit
```
Expected: schema valid, tsc 0 error.

- [ ] **Step 5: Checkpoint review với user**

Báo user: schema migration xong (User +4 field + DailyQuest). Review rồi tiếp Task 2.

---

### Task 2: Test TDD Batch 1 — gem + streakFreeze (fail trước)

**Files:**
- Modify: `src/lib/__tests__/gamification.test.ts`

- [ ] **Step 1: Đọc file test hiện tại để hiểu pattern**

Mở `src/lib/__tests__/gamification.test.ts`. Pattern: `node:test` + `node:assert/strict`, helper makeUser/makeQuestion nếu có.

- [ ] **Step 2: Thêm test gem + freeze logic**

Thêm vào cuối file:
```ts
// ===== SP7: Gem + Streak Freeze =====

test("gem reward: rating EXCELLENT → +5 gems", () => {
  // Helper computeGemReward(rating) — sẽ tạo ở Task 3
  assert.equal(computeGemReward("EXCELLENT"), 5);
  assert.equal(computeGemReward("GOOD"), 0);
  assert.equal(computeGemReward("PASS"), 0);
  assert.equal(computeGemReward("NEEDS_PRACTICE"), 0);
});

test("streakFreeze: lỡ 1 ngày + có freeze → giữ streak, dùng 1 freeze", () => {
  // calculateNextStreak(lastCheckInDate, currentStreak, today, streakFreezes)
  const today = new Date("2026-06-19");
  const lastCheckIn = new Date("2026-06-17"); // 2 ngày trước (diffDays = 2 > 1)
  const result = calculateNextStreak(lastCheckIn, 10, today, 2);
  assert.equal(result.streak, 10); // giữ
  assert.equal(result.usedFreeze, true);
});

test("streakFreeze: lỡ 1 ngày + 0 freeze → reset streak = 1", () => {
  const today = new Date("2026-06-19");
  const lastCheckIn = new Date("2026-06-17");
  const result = calculateNextStreak(lastCheckIn, 10, today, 0);
  assert.equal(result.streak, 1);
  assert.equal(result.usedFreeze, false);
});

test("shop validate: gem đủ → OK; gem thiếu → fail", () => {
  // validateShopPurchase(userGems, itemCost)
  assert.deepEqual(validateShopPurchase(50, 50), { ok: true });
  assert.deepEqual(validateShopPurchase(49, 50), { ok: false, reason: "NOT_ENOUGH_GEMS" });
});
```

- [ ] **Step 3: Chạy test verify fail**
```bash
npx tsx --test "src/lib/__tests__/gamification.test.ts"
```
Expected: 4 test mới FAIL (functions `computeGemReward` / `calculateNextStreak` (với param mới) / `validateShopPurchase` chưa export).

- [ ] **Step 4: Checkpoint review với user**

Báo user: 4 test Batch 1 thêm, fail đúng. Review rồi tiếp Task 3.

---

### Task 3: Gem reward + streakFreeze + shop validate helpers (gamification.ts)

**Files:**
- Modify: `src/lib/gamification.ts`, `src/app/api/checkin/route.ts`

- [ ] **Step 1: Export `computeGemReward` + `validateShopPurchase` trong gamification.ts**

Thêm vào `src/lib/gamification.ts`:
```ts
// === SP7: Gem + Shop ===

/** Gem reward theo exercise rating. EXCELLENT → +5,其余 → 0. */
export function computeGemReward(rating: ExerciseRating): number {
  return rating === "EXCELLENT" ? 5 : 0;
}

/** Validate shop purchase: gem đủ → ok; thiếu → fail. */
export function validateShopPurchase(userGems: number, itemCost: number): { ok: true } | { ok: false; reason: "NOT_ENOUGH_GEMS" } {
  if (userGems < itemCost) return { ok: false, reason: "NOT_ENOUGH_GEMS" };
  return { ok: true };
}

/** Shop item definitions (hardcode). */
export const SHOP_ITEMS = [
  { id: "ipa_reveal", name: "📖 Kính Lúp IPA", cost: 50, desc: "Xem IPA câu khó trong Thực chiến" },
  { id: "slow_audio", name: "🐢 Loa Ma Thuật", cost: 20, desc: "Nghe giọng bản xứ chậm x0.5" },
  { id: "streak_freeze", name: "🛡️ Bùa Đóng Băng", cost: 10, desc: "Giữ chuỗi ngày khi lỡ 1 ngày" },
] as const;
```
(Import `ExerciseRating` type từ scoring.ts nếu chưa có.)

- [ ] **Step 2: Export `calculateNextStreak` (với param streakFreezes) từ checkin route → chuyển sang gamification.ts**

Tạo `calculateNextStreak` trong `gamification.ts` (export, pure function — testable):
```ts
/** Tính streak tiếp theo. Nếu lỡ ngày (>1) + có freeze → giữ streak, dùng 1 freeze. */
export function calculateNextStreak(
  lastCheckInDate: Date | null,
  currentStreak: number,
  today: Date,
  streakFreezes: number,
): { alreadyCheckedIn: boolean; streak: number; usedFreeze: boolean } {
  if (!lastCheckInDate) {
    return { alreadyCheckedIn: false, streak: 1, usedFreeze: false };
  }
  const lastDay = startOfLocalDay(lastCheckInDate);
  const diffDays = Math.floor((today.getTime() - lastDay.getTime()) / 86400000);
  if (diffDays === 0) {
    return { alreadyCheckedIn: true, streak: currentStreak, usedFreeze: false };
  }
  if (diffDays === 1) {
    return { alreadyCheckedIn: false, streak: currentStreak + 1, usedFreeze: false };
  }
  // diffDays > 1: lỡ ngày. Nếu có freeze → dùng 1, giữ streak.
  if (streakFreezes > 0) {
    return { alreadyCheckedIn: false, streak: currentStreak, usedFreeze: true };
  }
  return { alreadyCheckedIn: false, streak: 1, usedFreeze: false };
}
```
(Import `startOfLocalDay` từ auth.ts hoặc định nghĩa inline. Verify helper tồn tại.)

- [ ] **Step 3: Update checkin route dùng helper mới**

Sửa `src/app/api/checkin/route.ts`: xóa `calculateNextStreak` inline cũ (`:32-49`), import từ `gamification.ts`. Caller `:144` truyền `user.streakFreezes`, xử lý `usedFreeze`:
```ts
const streakStatus = calculateNextStreak(user.lastCheckInDate, user.streakCount, now, user.streakFreezes);
// ...
data: {
  // ...
  streakCount: streakStatus.streak,
  longestStreak: Math.max(streakStatus.streak, user.longestStreak),
  lastCheckInDate: now,
  ...(streakStatus.usedFreeze ? { streakFreezes: { decrement: 1 } } : {}),
}
```

- [ ] **Step 4: Chạy test verify pass**
```bash
npx tsx --test "src/lib/__tests__/gamification.test.ts"
```
Expected: TẤT CẢ test pass (cũ + 4 mới).

- [ ] **Step 5: Verify tsc**
```bash
npx tsc --noEmit
```

- [ ] **Step 6: Checkpoint review với user**

Báo user: helper gem/freeze/shop tạo, checkin route update, 4 test pass. Review rồi tiếp Task 4.

---

### Task 4: Submit route — gem hook (EXCELLENT +5)

**Files:**
- Modify: `src/app/api/exercises/submit/route.ts`

- [ ] **Step 1: Hook gem reward vào submit**

Sửa `src/app/api/exercises/submit/route.ts` vùng `:207-220`. Sau compute rating:
```ts
const gemReward = computeGemReward(rating); // EXCELLENT → 5
const totalXpEarned = rewards.xpEarned; // (quest +50 sẽ cộng ở Batch 2)

const updatedUser = await tx.user.update({
  where: { id: userId },
  data: {
    xp: { increment: totalXpEarned },
    level: updatedUserLevel,
    ...(gemReward > 0 ? { gems: { increment: gemReward } } : {}),
  },
  select: { xp: true, level: true, gems: true },
});
```
Import `computeGemReward` từ `gamification.ts`.

- [ ] **Step 2: Trả gems trong response**

Response payload thêm `gems: updatedUser.gems`, `gemsEarned: gemReward`.

- [ ] **Step 3: Verify tsc + test**
```bash
npx tsc --noEmit
npx tsx --test "src/lib/__tests__/gamification.test.ts"
```

- [ ] **Step 4: Checkpoint review với user**

Báo user: submit route hook gem (EXCELLENT +5), tsc + test pass. Review rồi tiếp Task 5.

---

### Task 5: Shop route (/api/shop)

**Files:**
- Create: `src/app/api/shop/route.ts`

- [ ] **Step 1: Tạo shop route**

Tạo `src/app/api/shop/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getSessionUserId } from "@/lib/auth";
import { SHOP_ITEMS, validateShopPurchase } from "@/lib/gamification";

const prisma = new PrismaClient();

export async function POST(request: NextRequest) {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

    const { itemId } = await request.json();
    const item = SHOP_ITEMS.find((i) => i.id === itemId);
    if (!item) return NextResponse.json({ error: "ITEM_NOT_FOUND" }, { status: 404 });

    const user = await prisma.user.findUnique({ where: { id: userId }, select: { gems: true, streakFreezes: true, unlockedIpaReveal: true, unlockedSlowAudio: true } });
    if (!user) return NextResponse.json({ error: "USER_NOT_FOUND" }, { status: 404 });

    const validation = validateShopPurchase(user.gems, item.cost);
    if (!validation.ok) return NextResponse.json({ error: validation.reason }, { status: 400 });

    // Apply effect
    const updateData: Record<string, unknown> = { gems: { decrement: item.cost } };
    if (item.id === "streak_freeze") updateData.streakFreezes = { increment: 1 };
    else if (item.id === "ipa_reveal") updateData.unlockedIpaReveal = true;
    else if (item.id === "slow_audio") updateData.unlockedSlowAudio = true;

    const updated = await prisma.user.update({ where: { id: userId }, data: updateData, select: { gems: true, streakFreezes: true, unlockedIpaReveal: true, unlockedSlowAudio: true } });

    return NextResponse.json({ success: true, item: item.id, user: updated });
  } catch (e) {
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}
```
(Verify `getSessionUserId` import path đúng — check auth.ts export.)

- [ ] **Step 2: Verify tsc**
```bash
npx tsc --noEmit
```

- [ ] **Step 3: Checkpoint review với user**

Báo user: shop route tạo (3 items, validate gem, apply effect). Review rồi tiếp Task 6.

---

### Task 6: Seed demo gems + streakFreezes

**Files:**
- Modify: `prisma/seed_demo_data.ts`

- [ ] **Step 1: Thêm gems + streakFreezes vào demo users**

Sửa `prisma/seed_demo_data.ts` DEMO_USERS array — thêm `gems: 20, streakFreezes: 1` mỗi user. Update upsert `update` + `create` data thêm 2 field.

- [ ] **Step 2: Re-seed demo data**
```bash
npx tsx prisma/seed_demo_data.ts
```
Expected: 8 user với gems=20, streakFreezes=1.

- [ ] **Step 3: Verify tsc + test**
```bash
npx tsc --noEmit
npm test
```

- [ ] **Step 4: Checkpoint Batch 1 review với user**

Báo user: **Batch 1 hoàn tất**. Gem + Shop + Streak Freeze + migration done. Demo users có 20 gems + 1 freeze. Quality gate pass. User review + commit khi convenient. Tiếp Batch 2 (Daily Quests + UI).

---

## Batch 2 — Daily Quests + UI

### Task 7: Quest definitions + helper (gamification.ts)

**Files:**
- Modify: `src/lib/gamification.ts`

- [ ] **Step 1: Thêm quest definitions + helper**

Thêm vào `src/lib/gamification.ts`:
```ts
// === SP7: Daily Quests ===

export const QUEST_TYPES = [
  { type: "PRACTICE_3", target: 3, desc: "Luyện 3 bài hôm nay", rewardXp: 50, rewardGems: 10 },
  { type: "CD2_3", target: 3, desc: "Hoàn thành 3 bài CĐ2 Phụ âm", rewardXp: 50, rewardGems: 10 },
  { type: "CD4_LINKING_3", target: 3, desc: "Hoàn thành 3 bài CĐ4 nối âm (g03)", rewardXp: 50, rewardGems: 10 },
] as const;

export type QuestType = typeof QUEST_TYPES[number]["type"];

/** Random 3 quest/ngày (shuffle pool, take 3). */
export function pickDailyQuests(): { type: string; target: number; rewardXp: number; rewardGems: number }[] {
  const shuffled = [...QUEST_TYPES].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3).map((q) => ({ type: q.type, target: q.target, rewardXp: q.rewardXp, rewardGems: q.rewardGems }));
}

/** Check quest progress increment theo exercise submit payload. */
export function shouldIncrementQuest(
  questType: string,
  payload: { exerciseCompleted: boolean; topicId: string; soundGroupId: string },
): boolean {
  if (questType === "PRACTICE_3") return payload.exerciseCompleted;
  if (questType === "CD2_3") return payload.exerciseCompleted && payload.topicId === "topic-2-consonants";
  if (questType === "CD4_LINKING_3") return payload.exerciseCompleted && payload.soundGroupId === "map-t4-g03-linking";
  return false;
}
```
(Verify topicId CĐ2 = "topic-2-consonants" — check lesson-catalog.ts. Nếu sai → sửa.)

- [ ] **Step 2: Verify tsc**
```bash
npx tsc --noEmit
```

- [ ] **Step 3: Checkpoint review với user**

Báo user: quest definitions + helper tạo. Review rồi tiếp Task 8.

---

### Task 8: Quest route (/api/daily-quests)

**Files:**
- Create: `src/app/api/daily-quests/route.ts`

- [ ] **Step 1: Tạo quest route (lazy generate)**

Tạo `src/app/api/daily-quests/route.ts`:
```ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { getSessionUserId } from "@/lib/auth";
import { pickDailyQuests } from "@/lib/gamification";

const prisma = new PrismaClient();

function startOfToday(): Date {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function GET() {
  try {
    const userId = await getSessionUserId();
    if (!userId) return NextResponse.json({ error: "UNAUTHENTICATED" }, { status: 401 });

    const today = startOfToday();
    // Lazy generate: nếu hôm nay chưa có 3 quest → generate
    const existing = await prisma.dailyQuest.findMany({ where: { userId, date: today } });
    if (existing.length === 0) {
      const picked = pickDailyQuests();
      await prisma.dailyQuest.createMany({
        data: picked.map((q) => ({ userId, date: today, questType: q.type, target: q.target, rewardXp: q.rewardXp, rewardGems: q.rewardGems })),
      });
    }
    const quests = await prisma.dailyQuest.findMany({ where: { userId, date: today }, orderBy: { questType: "asc" } });
    return NextResponse.json({ quests });
  } catch (e) {
    return NextResponse.json({ error: "INTERNAL" }, { status: 500 });
  }
}
```

- [ ] **Step 2: Verify tsc**
```bash
npx tsc --noEmit
```

- [ ] **Step 3: Checkpoint review với user**

Báo user: quest route tạo (lazy generate 3/ngày). Review rồi tiếp Task 9.

---

### Task 9: Submit route — quest progress + claim reward

**Files:**
- Modify: `src/app/api/exercises/submit/route.ts`

- [ ] **Step 1: Hook quest progress vào submit**

Sửa submit route — sau user update (Task 4), thêm quest logic:
```ts
// Quest progress
const today = new Date(); today.setHours(0, 0, 0, 0);
const questPayload = { exerciseCompleted, topicId: exercise.topicId, soundGroupId: exercise.map?.soundGroupId ?? "" };
const activeQuests = await tx.dailyQuest.findMany({ where: { userId, date: today, completed: false } });
let questGemDelta = 0;
let questXpDelta = 0;
const questUpdates: { id: string; progress: number; completed: boolean; claimedAt: Date | null }[] = [];
for (const quest of activeQuests) {
  if (shouldIncrementQuest(quest.questType, questPayload)) {
    const newProgress = quest.progress + 1;
    const completed = newProgress >= quest.target;
    if (completed) {
      questGemDelta += quest.rewardGems;
      questXpDelta += quest.rewardXp;
    }
    questUpdates.push({ id: quest.id, progress: newProgress, completed, claimedAt: completed ? new Date() : null });
  }
}
// Apply quest updates
for (const qu of questUpdates) {
  await tx.dailyQuest.update({ where: { id: qu.id }, data: { progress: qu.progress, completed: qu.completed, claimedAt: qu.claimedAt } });
}
// Add quest reward to user (gem + xp)
if (questGemDelta > 0 || questXpDelta > 0) {
  await tx.user.update({ where: { id: userId }, data: { gems: { increment: questGemDelta }, xp: { increment: questXpDelta } } });
}
```
(Verify `exercise.topicId` + `exercise.map.soundGroupId` accessible — include trong query. Import `shouldIncrementQuest`.)

- [ ] **Step 2: Trả quest updates trong response**

Response payload thêm `quests: questUpdates` (hoặc refetch client).

- [ ] **Step 3: Verify tsc + test**
```bash
npx tsc --noEmit
npm test
```

- [ ] **Step 4: Checkpoint review với user**

Báo user: submit route hook quest (progress + claim gem/xp). Review rồi tiếp Task 10.

---

### Task 10: Engine — maxCombo + soundGroupId payload

**Files:**
- Modify: `src/app/exercises/[id]/ExerciseEngineClient.tsx`

- [ ] **Step 1: Track maxCombo state**

Thêm `const [maxCombo, setMaxCombo] = useState(0)`. Trong `combo.onCorrect` callback, update `setMaxCombo((m) => Math.max(m, combo + 1))`. Reset `setMaxCombo(0)` trong `combo.reset`/`finishExercise`.

- [ ] **Step 2: Pass maxCombo + soundGroupId trong submit payload**

Submit call (find `fetch("/api/exercises/submit"...)`) thêm vào body:
```ts
{ answers, maxCombo, soundGroupId: exercise.soundGroupId ?? null }
```
(Verify `exercise.soundGroupId` accessible — có thể lấy qua exercise.map.soundGroupId hoặc parse.)

- [ ] **Step 3: Submit route đọc maxCombo + soundGroupId (nếu chưa ở Task 9)**

Verify submit route payload schema đọc `maxCombo` + `soundGroupId`.

- [ ] **Step 4: Verify tsc**
```bash
npx tsc --noEmit
```

- [ ] **Step 5: Checkpoint review với user**

Báo user: engine track maxCombo + pass payload. Review rồi tiếp Task 11.

---

### Task 11: UI — GemsDisplay + ShopModal

**Files:**
- Create: `src/components/gamification/GemsDisplay.tsx`, `src/components/gamification/ShopModal.tsx`

- [ ] **Step 1: GemsDisplay component**

Tạo `src/components/gamification/GemsDisplay.tsx` — hiển thị 💎 + số gem, click → mở ShopModal:
```tsx
"use client";
import { useState } from "react";
import ShopModal from "./ShopModal";

export function GemsDisplay({ gems }: { gems: number }) {
  const [shopOpen, setShopOpen] = useState(false);
  return (
    <>
      <button onClick={() => setShopOpen(true)} className="inline-flex items-center gap-1 rounded-lg bg-primary-50 px-3 py-1.5 text-sm font-bold text-primary-700 hover:bg-primary-100">
        💎 {gems}
      </button>
      {shopOpen && <ShopModal gems={gems} onClose={() => setShopOpen(false)} />}
    </>
  );
}
```

- [ ] **Step 2: ShopModal component**

Tạo `src/components/gamification/ShopModal.tsx` — modal 3 items + cost + confirm → POST /api/shop:
```tsx
"use client";
import { useState } from "react";
import { SHOP_ITEMS } from "@/lib/gamification";

export default function ShopModal({ gems, onClose }: { gems: number; onClose: () => void }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  const buy = async (itemId: string, cost: number) => {
    if (gems < cost) { setMsg("💎 Không đủ gem!"); return; }
    setBusy(itemId);
    const res = await fetch("/api/shop", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ itemId }) });
    const data = await res.json();
    setBusy(null);
    if (data.success) { setMsg(`✅ Đã mua! Còn ${data.user.gems} 💎`); setTimeout(onClose, 1500); }
    else setMsg(`❌ ${data.error}`);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold">🛒 Cửa hàng</h2>
          <div className="text-sm font-bold text-primary-700">💎 {gems}</div>
        </div>
        <div className="space-y-3">
          {SHOP_ITEMS.map((item) => (
            <div key={item.id} className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <p className="font-bold">{item.name}</p>
                <p className="text-xs text-neutral-600">{item.desc}</p>
              </div>
              <button onClick={() => buy(item.id, item.cost)} disabled={busy === item.id || gems < item.cost}
                className="rounded-lg bg-primary-600 px-3 py-2 text-sm font-bold text-white disabled:opacity-50">
                💎 {item.cost}
              </button>
            </div>
          ))}
        </div>
        {msg && <p className="mt-3 text-center text-sm font-medium">{msg}</p>}
        <button onClick={onClose} className="mt-4 w-full rounded-lg border py-2 text-sm font-bold">Đóng</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: Wire GemsDisplay vào navbar**

Tìm navbar (NavbarClient.tsx hoặc header) — thêm `<GemsDisplay gems={user.gems} />` (cần user.gems prop, fetch từ session/api).

- [ ] **Step 4: Verify tsc + build**
```bash
npx tsc --noEmit
npm run build
```

- [ ] **Step 5: Checkpoint review với user**

Báo user: GemsDisplay + ShopModal tạo, wire navbar. Review rồi tiếp Task 12.

---

### Task 12: UI — DailyQuestsWidget

**Files:**
- Create: `src/components/gamification/DailyQuestsWidget.tsx`

- [ ] **Step 1: DailyQuestsWidget component**

Tạo `src/components/gamification/DailyQuestsWidget.tsx` — fetch /api/daily-quests, hiển thị 3 quest + progress + reward:
```tsx
"use client";
import { useEffect, useState } from "react";

type Quest = { id: string; questType: string; target: number; progress: number; completed: boolean; rewardXp: number; rewardGems: number };

const QUEST_DESC: Record<string, string> = {
  PRACTICE_3: "Luyện 3 bài hôm nay",
  CD2_3: "Hoàn thành 3 bài CĐ2 Phụ âm",
  CD4_LINKING_3: "Hoàn thành 3 bài CĐ4 nối âm (g03)",
};

export default function DailyQuestsWidget() {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/daily-quests").then((r) => r.json()).then((d) => { setQuests(d.quests ?? []); setLoading(false); });
  }, []);

  if (loading) return <div className="animate-pulse text-sm text-neutral-400">Đ tải nhiệm vụ...</div>;

  return (
    <div className="rounded-xl border bg-white p-4">
      <h3 className="mb-3 text-sm font-bold text-neutral-700">🎯 Nhiệm vụ hôm nay</h3>
      <div className="space-y-3">
        {quests.map((q) => (
          <div key={q.id} className={q.completed ? "opacity-60" : ""}>
            <div className="flex justify-between text-xs">
              <span>{QUEST_DESC[q.questType] ?? q.questType}</span>
              <span className="font-bold">{q.completed ? "✅" : `${q.progress}/${q.target}`}</span>
            </div>
            <div className="mt-1 h-2 rounded-full bg-neutral-200">
              <div className="h-2 rounded-full bg-primary-500" style={{ width: `${Math.min(100, (q.progress / q.target) * 100)}%` }} />
            </div>
            <p className="mt-0.5 text-[10px] text-neutral-500">Thưởng: +{q.rewardXp} XP +{q.rewardGems} 💎</p>
          </div>
        ))}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Wire vào dashboard sidebar**

Tìm `src/app/dashboard/page.tsx` sidebar — thêm `<DailyQuestsWidget />`.

- [ ] **Step 3: Verify tsc + build**
```bash
npx tsc --noEmit
npm run build
```

- [ ] **Step 4: Checkpoint review với user**

Báo user: DailyQuestsWidget tạo, wire dashboard. Review rồi tiếp Task 13.

---

### Task 13: Engine — 🐢 Loa Ma Thuật + 📖 Kính Lúp IPA unlock

**Files:**
- Modify: `src/app/exercises/[id]/ExerciseEngineClient.tsx`, sentence components

- [ ] **Step 1: Pass user unlock flags vào engine**

Engine nhận `unlockedSlowAudio` + `unlockedIpaReveal` (qua props từ page.tsx, fetch user). Pass xuống sentence components.

- [ ] **Step 2: 🐢 Loa Ma Thuật nút x0.5**

Trong sentence component (SpeakSentenceQuestion / ChooseWeak/Linking/Assimilation dùng useSynthesisAudio) — thêm nút "🐢 x0.5" nếu `unlockedSlowAudio`. Click → play với `utter.rate = 0.5` (thay 0.9).

- [ ] **Step 3: 📖 Kính Lúp IPA — hiện IPA Thực chiến**

Trong Thực chiến (speak_sentence) — hiện IPA thay vì ẩn nếu `unlockedIpaReveal`.

- [ ] **Step 4: Verify tsc + build**
```bash
npx tsc --noEmit
npm run build
```

- [ ] **Step 5: Checkpoint final review với user**

Báo user: **SP7 hoàn tất**. 3 yếu tố (Gem+Shop, Daily Quests, Streak Freeze) + 2 item unlock (Loa Ma Thuật, Kính Lúp IPA) done. Quality gate pass. User review + commit.

---

## Self-Review

### 1. Spec coverage
- Spec "Mục tiêu" (3 yếu tố meta loop): Task 1-13 cover Gem (3-4) + Shop (5) + Quests (7-9) + Freeze (3) + UI (11-12) + items (13). ✓
- Spec section 2 (scope 3 yếu tố, defer Hearts/TimeAttack/XPBoost): plan đúng scope. ✓
- Spec section 3 (schema migration): Task 1. ✓
- Spec section 4 (integration): Task 3-4-9 (submit) + Task 3 (checkin) + Task 5 (shop) + Task 8 (quest). ✓
- Spec section 5 (UI): Task 11-12-13. ✓
- Spec section 6 (test): Task 2 + mở rộng Task 3. ✓
- Spec section 7 (file): plan đúng. ✓

### 2. Placeholder scan
- Không có TBD/TODO. Mỗi task code đầy đủ (schema, helpers, routes, components).

### 3. Type consistency
- `User.gems/streakFreezes/unlockedIpaReveal/unlockedSlowAudio` (Task 1) — dùng ở Task 3-4-5-6-13. ✓
- `DailyQuest` model (Task 1) — dùng ở Task 8-9-12. ✓
- `computeGemReward`/`validateShopPurchase`/`calculateNextStreak`/`shouldIncrementQuest` (Task 3-7) — dùng route. ✓
- `SHOP_ITEMS`/`QUEST_TYPES` (Task 3-7) — dùng UI. ✓

No type drift.

### Note cho engineer
- **topicId CĐ2** = verify "topic-2-consonants" (check lesson-catalog.ts). Nếu sai → quest CD2_3 không trigger.
- **soundGroupId g03** = "map-t4-g03-linking" (verify seed).
- **`getSessionUserId` import path** = check auth.ts export.
- **Batch 1 review trước Batch 2** — 2 commit.
- **Demo re-seed** sau migration: `db_cleanup → seed_lessons → seed_audio_local → seed_listen_choose_audio → seed_demo_user → seed_demo_data`.

---

## Execution Handoff

Plan complete. 13 task, 2 batch. Git policy: engineer không commit. Inline execution (subagent read-only).
