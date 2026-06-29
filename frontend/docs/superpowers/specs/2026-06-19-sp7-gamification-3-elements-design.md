# SP7 Gamification (adjusted) — 3 yếu tố trò chơi mới (Gem+Shop / Daily Quests / Streak Freeze) Design

Ngày: 2026-06-19
Trạng thái: design đã duyệt qua 3 section (scope / integration / test+risk). Điều chỉnh từ 6 yếu tố gốc → 3 yếu tố (bỏ Hearts + Time Attack + XP Boost) theo phân tích sư phạm người dùng: Hearts độc hại cho app phát âm (muscle memory, trừ mạng = ức chế), Time Attack lỗi Web Speech API + nuốt âm, XP Boost không trong 3 chốt.
Scope: master **SP7** (gamification). 10 tuần đồ án — 3 yếu tố cạnh tranh (Gem+Shop items phát âm, Daily Quests cá nhân hóa lỗi người Việt, Streak Freeze loss aversion).

## Mục tiêu

Tích hợp 3 yếu tố game Duolingo-style vào app phát âm, chuyển từ "gamification thụ động" (XP/level/streak/badges cộng dần tự động) sang "gamification chủ động" (kinh tế vòng lặp — meta loop). Tạo lợi thế cạnh tranh: items shop gắn phát âm (Kính Lúp IPA, Loa Ma Thuật x0.5), quests cá nhân hóa lỗi sai người Việt (/θ/ /ð/, nối âm), streak freeze bảo vệ công sức.

## 1. Hiện trạng (verify explore 19/06)

- **Gamification hiện có (thụ động):** XP (submit `:213` + checkin `:141`), Level (`calculateLevelFromXp`), Streak (checkin `:32` `calculateNextStreak`), Badges (`checkAndAwardBadges`), Leaderboard (tuan/thang), Combo 🔥 (`useComboStreak` — visual only, không persist, không reward), SFX, rating EXCELLENT/GOOD/PASS/NEEDS_PRACTICE.
- **Schema User hiện có:** xp, level, streakCount, longestStreak, totalCheckIns, lastCheckInDate. **KHÔNG có** gems, streakFreezes, unlockedIpaReveal, unlockedSlowAudio.
- **Submit route** (`api/exercises/submit/route.ts`): `tx.user.update` `:210` (xp + level). `rewards` từ `calculateExerciseRewards` `gamification.ts:194`. Rating `getExerciseRating` `scoring.ts:217`.
- **Checkin route** (`api/checkin/route.ts`): `calculateNextStreak` `:32` — diffDays >1 → reset streak = 1. Hook freeze ở đây.
- **Combo** (`useComboStreak.ts`): `combo` counter, `onCorrect`/`onWrong`/`reset`. **Không track maxCombo** — cần thêm state `maxCombo` để quest COMBO + reward.
- **Engine** (`ExerciseEngineClient.tsx`): `combo = useComboStreak()` `:340`. Submit payload hiện: `answers[]` (questionId + selectedOptionId/selectedText/transcript). **Không pass maxCombo + soundGroupId** — cần thêm.
- **Shop**: KHÔNG có. **Daily Quest**: KHÔNG có. **Streak Freeze**: KHÔNG có.

## 2. Scope (3 yếu tố, 10 tuần)

**Trong scope SP7:**
1. 💎 **Gem + Shop** (móng): `User.gems`. Kiếm: +5/bài EXCELLENT (submit), +10/quest complete. Chi: mua 3 items.
2. 🎯 **Daily Quests**: `DailyQuest` model. 3 quest/ngày. Hoàn thành → +50 XP + 10 gems.
3. 🛡️ **Streak Freeze**: `User.streakFreezes`. Checkin lỡ ngày → dùng freeze giữ streak. Mua 10 gem.

**Items Shop (hardcode definitions, unlock flag vĩnh viễn):**
```ts
const SHOP_ITEMS = [
  { id: "ipa_reveal", name: "📖 Kính Lúp IPA", cost: 50, desc: "Xem IPA câu khó trong Thực chiến" },
  { id: "slow_audio", name: "🐢 Loa Ma Thuật", cost: 20, desc: "Nghe giọng bản xứ chậm x0.5" },
  { id: "streak_freeze", name: "🛡️ Bùa Đóng Băng", cost: 10, desc: "Giữ chuỗi ngày khi lỡ 1 ngày" },
];
```

**Quest types (cá nhân hóa, đơn giản — không WPM):**
```ts
const QUEST_TYPES = [
  { type: "PRACTICE_3", target: 3, desc: "Luyện 3 bài hôm nay", rewardXp: 50, rewardGems: 10 },
  { type: "CD2_3", target: 3, desc: "Hoàn thành 3 bài CĐ2 Phụ âm", rewardXp: 50, rewardGems: 10 },
  { type: "CD4_LINKING_3", target: 3, desc: "Hoàn thành 3 bài CĐ4 nối âm (g03)", rewardXp: 50, rewardGems: 10 },
];
```
(Refinement: bỏ quest WPM >100 — app chưa track WPM. Bỏ quest /θ//ð/ riêng — thay quest "CĐ2 Phụ âm" tổng quát, dùng topicId. 3 quest/ngày random từ pool.)

**Defer (ra khỏi SP7):**
- ❤️ Hearts (sư phạm độc hại phát âm) — phase 2 sau nếu muốn
- ⏱️ Time Attack (Web Speech API delay + nuốt âm) — bỏ hẳn
- ⚡ XP Boost (không trong 3 chốt)
- Shop skin avatar
- Quest admin config UI (chỉ random/hardcode)
- Quest WPM >100 (app chưa track WPM)
- Item consumable (chỉ unlock vĩnh viễn)

## 3. Schema migration

```prisma
model User {
  // ...existing fields (xp, level, streakCount, longestStreak, totalCheckIns, lastCheckInDate)...
  gems              Int       @default(0)    // MỚI: tiền tệ ảo
  streakFreezes     Int       @default(0)    // MỚI: số freeze sở hữu
  unlockedIpaReveal Boolean   @default(false) // MỚI: item Kính Lúp IPA unlock
  unlockedSlowAudio Boolean   @default(false) // MỚI: item Loa Ma Thuật unlock

  // ...existing relations...
  dailyQuests       DailyQuest[]             // MỚI: relation
}

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
  claimedAt   DateTime?              // khi reward được claim (completed + gem/xp awarded)
  user        User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  @@unique([userId, date, questType])
  @@index([userId, date])
}
```

**Migration**: `npx prisma migrate dev --name sp7_gamification_3` + `npx prisma generate`. Backup: `db_cleanup` mất demo → re-seed `seed_demo_user` + `seed_demo_data` (sửa +gems demo).

## 4. Integration points + data flow

**Submit route** (`api/exercises/submit/route.ts`) — server-authoritative:
1. Compute XP + rating (hiện tại `:207`).
2. **Gem**: if rating === EXCELLENT → `gemDelta += 5`.
3. **Quest**: increment progress 3 quest types (cần `soundGroupId` + `exerciseCompleted` từ payload):
   - PRACTICE_3: +1 nếu exerciseCompleted
   - CD2_3: +1 nếu `topicId === "topic-2-consonants"` (verify topicId chính xác ở plan)
   - CD4_LINKING_3: +1 nếu `soundGroupId === "map-t4-g03-linking"`
   - Nếu quest đủ target + chưa claimed → `completed=true`, `claimedAt=now`, `gemDelta += 10`, `xpDelta += 50`
4. `tx.user.update` `:210` thêm `gems: { increment: gemDelta }` + xp/level (nếu quest +50 XP, cộng vào xpDelta trước).
5. Trả response +gems + quests updated (engine hiển thị).

**Engine** (`ExerciseEngineClient.tsx`):
- Track `maxCombo` (state mới — `Math.max(maxCombo, combo)` trên mỗi onCorrect).
- Pass `maxCombo` + `soundGroupId` (lấy từ exercise data) trong submit payload.
- Hiển thị 🐢 nút "Loa Ma Thuật x0.5" (nếu `user.unlockedSlowAudio`) trong sentence component.
- Hiển thị IPA trong Thực chiến (nếu `user.unlockedIpaReveal`).

**Checkin route** (`api/checkin/route.ts:32` `calculateNextStreak`):
- Thêm param `streakFreezes: number`.
- Nếu `diffDays > 1` (lỡ ngày) → if `streakFreezes > 0` → return `{ streak: currentStreak, usedFreeze: true }` (giữ streak, caller giảm `streakFreezes -= 1`).
- Else → reset 1 (hiện tại).
- Caller `:144`: if `usedFreeze` → `streakFreezes: { decrement: 1 }` + giữ `streakCount`.

**Shop route** (`/api/shop/route.ts` mới):
- POST `{ itemId }` → validate gem đủ → `gems -= cost` → apply effect:
  - `streak_freeze` → `streakFreezes += 1`
  - `ipa_reveal` → `unlockedIpaReveal = true`
  - `slow_audio` → `unlockedSlowAudio = true`
- Trả user updated (gems + unlocks).

**Quest route** (`/api/daily-quests/route.ts` mới):
- GET — lazy generate: nếu hôm nay chưa có 3 quest → generate random 3 từ pool QUEST_TYPES (upsert theo `[userId, date, questType]`). Trả list + progress.

## 5. UI mới

| Component | Vị trí | Chức năng |
|---|---|---|
| `GemsDisplay.tsx` | header/navbar | 💎 số gem + icon → click mở ShopModal |
| `ShopModal.tsx` | modal | 3 items + cost + gems balance + confirm mua → POST /api/shop |
| `DailyQuestsWidget.tsx` | dashboard sidebar | 3 quest + progress bar + reward (50 XP + 10 💎) + claimed badge. Auto-refresh sau submit. |
| Engine 🐢 nút x0.5 | sentence components | nếu `unlockedSlowAudio` — speechSynthesis utter.rate = 0.5 |
| Engine IPA Thực chiến | Thực chiến (speak_sentence) | nếu `unlockedIpaReveal` — hiện IPA thay vì ẩn |

## 6. Test design (TDD, mở rộng gamification.test.ts)

```ts
test("gems: rating EXCELLENT → +5 gems")
test("daily quest PRACTICE_3: exerciseCompleted → progress +1; đủ 3 → completed + 10 gems + 50 xp")
test("daily quest CD2_3: topicId topic-2 → progress +1")
test("daily quest CD4_LINKING_3: soundGroupId map-t4-g03-linking → progress +1")
test("streakFreeze: lỡ 1 ngày + có freeze → giữ streak, freeze -1")
test("streakFreeze: lỡ 1 ngày + 0 freeze → reset streak = 1")
test("shop: mua streak_freeze 10 gem → gems -10, freezes +1")
test("shop: gem không đủ → fail (không trừ gem)")
```

## 7. File sẽ tạo/sửa

| Hành động | File | Chi tiết |
|---|---|---|
| sửa | `prisma/schema.prisma` | User +4 field (gems, streakFreezes, unlockedIpaReveal, unlockedSlowAudio) + DailyQuest model |
| sửa | `prisma/seed_demo_data.ts` | demo users +gems (20) + streakFreezes (1) |
| tạo | `src/app/api/shop/route.ts` | POST mua item (validate gem + apply) |
| tạo | `src/app/api/daily-quests/route.ts` | GET lazy generate 3 quest/ngày |
| sửa | `src/app/api/exercises/submit/route.ts` | gem hook (EXCELLENT +5) + quest progress + maxCombo/soundGroupId payload |
| sửa | `src/app/api/checkin/route.ts` | `calculateNextStreak` +streakFreezes param, dùng freeze giữ streak |
| sửa | `src/lib/gamification.ts` | quest definitions + helper (incrementQuestProgress, claimQuestReward) |
| sửa | `src/lib/__tests__/gamification.test.ts` | +8 test TDD |
| sửa | `src/app/exercises/[id]/ExerciseEngineClient.tsx` | track maxCombo + pass payload + 🐢 nút + IPA reveal |
| tạo | `src/components/gamification/GemsDisplay.tsx` | header gem display |
| tạo | `src/components/gamification/ShopModal.tsx` | modal shop 3 items |
| tạo | `src/components/gamification/DailyQuestsWidget.tsx` | dashboard quest widget |

**KHÔNG sửa:** scoring.ts (rating đã có), leaderboard, badges (giữ), schema fields cũ, seed_lessons (content không đụng).

## 8. Thay đổi behavior?

- User làm bài EXCELLENT → +5 gems (mới). Quest progress tăng. Quest complete → +50 XP + 10 gems.
- User lỡ 1 ngày checkin + có freeze → streak giữ (không reset). Freeze -1.
- User mua item shop → gems giảm, unlock flag bật (vĩnh viễn).
- 🐢 Loa Ma Thuật: user unlock → nút x0.5 trong sentence exercise (phát chậm).
- 📖 Kính Lúp IPA: user unlock → IPA hiện trong Thực chiến (bình thường ẩn).
- XP/level/streak/badges/leaderboard/combo: KHÔNG đụng (giữ + thêm gem/quest/freeze overlay).
- Hearts/TimeAttack/XPBoost: KHÔNG làm (bỏ).

## 9. Rủi ro & giải pháp

| Rủi ro | Giải pháp |
|---|---|
| **Schema migration** (User +4 field + DailyQuest) | `prisma migrate dev --name sp7_gamification_3`. Backup: re-seed demo sau. |
| **Engine pass maxCombo + soundGroupId** | Submit payload +2 field. Submit route đọc. Test. |
| **Quest lazy generate** | Quest route GET upsert theo `[userId, date, questType]` — idempotent. Random 3 từ pool. |
| **Quest topicId match** | Verify topicId CĐ2 = "topic-2-consonants" (check catalog). Nếu sai → quest CD2_3 không trigger. Test bắt. |
| **Item unlock vĩnh viễn** | Flag boolean — đơn giản, không transaction. 2 flag. |
| **Server-authoritative gem** | Submit + shop route validate + update. Client hiển thị. Anti-cheat. |
| **3 yếu tố 1 đợt** | Chia 2 batch: Batch 1 (Gem + Shop + Streak Freeze + migration — foundation), Batch 2 (Daily Quests + UI). Review giữa. |
| **maxCombo state engine** | `useState(0)` + `useEffect` update khi combo change. Pass submit. |
| **Demo data re-seed** | `seed_demo_data.ts` +gems (20) + streakFreezes (1) để test shop. |
