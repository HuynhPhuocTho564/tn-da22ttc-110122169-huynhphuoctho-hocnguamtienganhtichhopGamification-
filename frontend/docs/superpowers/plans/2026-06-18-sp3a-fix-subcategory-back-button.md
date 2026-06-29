# SP3a-fix — CĐ1+CĐ2 subcategory + sửa nút quay về Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Chia CĐ1 (Nguyên âm đơn/đôi) và CĐ2 (5 tầng Plosives/Fricatives/Affricates/Nasals/Approximants) theo subcategory trong data + UI Learning Map gom nhóm theo subcategory; đồng thời sửa nút quay về ở engine (`/exercises/[id]`) và trang list `/exercises`.

**Architecture:** Thêm trường `subcategory: string | null` đã có sẵn trong schema (SoundGroup + LearningMap, chưa commit). Catalog trở thành nguồn sự thật duy nhất gán subcategory cho 22 nhóm (10 CĐ1 + 12 CĐ2); 8 nhóm CĐ3/4 = null. Seed canonical ghi subcategory; một script migration nhỏ cập nhật DB hiện tại mà KHÔNG re-fetch audio/content (tránh regression SP3a local audio). UI Learning Map gom `maps` theo `subcategory`, null → hiển thị phẳng như cũ.

**Tech Stack:** Next.js 16 (App Router), Prisma 6 (PostgreSQL), TypeScript 6, Tailwind 4, node:test qua `tsx`. Runner TS: `tsx`. Test: `npm test` = `tsx --test "src/**/*.test.ts"`.

**Working directory:** Mọi lệnh chạy từ `english_pronunciation_app/frontend/` (repo root là `D:\01_Company_Work\Projects\Web_HoTroPhatAmEN`).

**Spec:** `docs/superpowers/specs/2026-06-18-sp3a-fix-subcategory-back-button-design.md`

---

## File Structure

| Hành động | File | Trách nhiệm |
|---|---|---|
| Modify | `prisma/lesson-catalog.ts` | Thêm `subcategory: string \| null` vào type + gán giá trị 30 nhóm (nguồn sự thật) |
| Apply+commit | `prisma/schema.prisma` | `subcategory` đã thêm (uncommitted) → validate + db push + commit |
| Modify | `prisma/seed_lessons.ts` | `seedSoundGroups()` + `generateLearningMaps()` ghi subcategory (canonical) |
| Create | `prisma/seed_subcategory.ts` | Script migration nhỏ: upsert subcategory lên DB hiện tại, không đụng content/audio |
| Modify | `src/lib/__tests__/lesson-catalog.test.ts` | Test subcategory CĐ1/CĐ2/CĐ3-4 (TDD) |
| Modify | `src/app/learning_map/page.tsx` | Query `map.subcategory` + truyền vào `LearningMapUI` |
| Modify | `src/app/learning_map/LearningMapClient.tsx` | Thêm `subcategory` vào type + gom maps theo subcategory trong view topic |
| Modify | `src/app/exercises/[id]/ExerciseEngineClient.tsx` | Nút "X" (router.back) → "← Lộ trình" (router.push /learning_map) |
| Modify | `src/app/exercises/page.tsx` | Thêm nút "← Lộ trình" (Link /learning_map) đầu trang |

---

## Task 1: Catalog — thêm subcategory (TDD)

**Files:**
- Modify: `prisma/lesson-catalog.ts` (type `SoundGroupDefinition` line 32-41 + array `SOUND_GROUPS` line 164-207)
- Test: `src/lib/__tests__/lesson-catalog.test.ts`

- [ ] **Step 1: Viết test thất bại**

Thêm vào cuối `src/lib/__tests__/lesson-catalog.test.ts`:

```ts
test("CĐ1 chia 2 subcategory: 6 Nguyên âm đơn + 4 Nguyên âm đôi (không null)", () => {
  const vowels = getSoundGroupsByTopic("topic-1-vowels");
  const don = vowels.filter((sg) => sg.subcategory === "Nguyên âm đơn");
  const doi = vowels.filter((sg) => sg.subcategory === "Nguyên âm đôi");
  assert.equal(don.length, 6);
  assert.equal(doi.length, 4);
  for (const sg of vowels) {
    assert.ok(sg.subcategory, `${sg.id} thiếu subcategory`);
  }
});

test("CĐ2 chia 5 tầng subcategory: Plosives(3)/Fricatives(5)/Affricates(1)/Nasals(1)/Approximants(2)", () => {
  const cons = getSoundGroupsByTopic("topic-2-consonants");
  const bySub = (name: string) => cons.filter((sg) => sg.subcategory === name);
  assert.equal(bySub("Plosives").length, 3);
  assert.equal(bySub("Fricatives").length, 5);
  assert.equal(bySub("Affricates").length, 1);
  assert.equal(bySub("Nasals").length, 1);
  assert.equal(bySub("Approximants").length, 2);
  for (const sg of cons) {
    assert.ok(sg.subcategory, `${sg.id} thiếu subcategory`);
  }
});

test("CĐ3/4 subcategory null (chưa phân tầng)", () => {
  const cd3 = getSoundGroupsByTopic("topic-3-minimal-pairs-hard");
  const cd4 = getSoundGroupsByTopic("topic-4-stress-connected");
  for (const sg of cd3) assert.equal(sg.subcategory, null, `${sg.id} phải null`);
  for (const sg of cd4) assert.equal(sg.subcategory, null, `${sg.id} phải null`);
});
```

- [ ] **Step 2: Chạy test → xác nhận fail**

Run: `npm test`
Expected: FAIL — 3 test mới lỗi vì `sg.subcategory` là `undefined` (field chưa có trong type/data). CĐ3/4 test fail vì `undefined !== null`.

- [ ] **Step 3: Thêm field vào type**

Trong `prisma/lesson-catalog.ts`, sửa `SoundGroupDefinition` (line 32-41) thành:

```ts
export type SoundGroupDefinition = {
  id: string;
  topicId: string;
  name: string;
  description: string;
  orderIndex: number;
  targetPhonemes: string[];
  difficulty: number;
  notes: string;
  subcategory: string | null; // v2: nhóm con trong topic (vd "Nguyên âm đơn", "Plosives"). null = không phân nhóm.
};
```

- [ ] **Step 4: Gán subcategory cho 30 nhóm**

Thay toàn bộ nội dung mảng `SOUND_GROUPS` (từ dòng `// --- CĐ1 NGUYÊN ÂM ...` đến hết CĐ4 block, trước dòng `];` kết thúc mảng) bằng:

```ts
  // --- CĐ1 NGUYÊN ÂM (10 nhóm: 6 đơn + 4 đôi) ---
  { id: "map-t1-g01-i-ih", topicId: "topic-1-vowels", name: "/iː/ & /ɪ/", description: "Dài & ngắn phía trước (ship/sheep)", orderIndex: 1, targetPhonemes: ["/iː/", "/ɪ/"], difficulty: 3, notes: "Cặp cơ bản nhất", subcategory: "Nguyên âm đơn" },
  { id: "map-t1-g02-e-ae", topicId: "topic-1-vowels", name: "/e/ & /æ/", description: "Hẹp & mở phía trước (bed/bad)", orderIndex: 2, targetPhonemes: ["/e/", "/æ/"], difficulty: 4, notes: "Người Việt hay gộp /æ/ thành /e/", subcategory: "Nguyên âm đơn" },
  { id: "map-t1-g03-central", topicId: "topic-1-vowels", name: "/ɑː/ & /ʌ/ & /ə/", description: "Nhóm trung tâm (father/fun/about)", orderIndex: 3, targetPhonemes: ["/ɑː/", "/ʌ/", "/ə/"], difficulty: 5, notes: "Ba âm trung tâm", subcategory: "Nguyên âm đơn" },
  { id: "map-t1-g04-o-oh", topicId: "topic-1-vowels", name: "/ɒ/ & /ɔː/", description: "Tròn ngắn & tròn dài (hot/horse)", orderIndex: 4, targetPhonemes: ["/ɒ/", "/ɔː/"], difficulty: 4, notes: "Âm tròn môi", subcategory: "Nguyên âm đơn" },
  { id: "map-t1-g05-u-uh", topicId: "topic-1-vowels", name: "/ʊ/ & /uː/", description: "Sau ngắn & sau dài (full/fool)", orderIndex: 5, targetPhonemes: ["/ʊ/", "/uː/"], difficulty: 3, notes: "Cặp âm sau", subcategory: "Nguyên âm đơn" },
  { id: "map-t1-g06-er", topicId: "topic-1-vowels", name: "/ɜː/", description: "Âm giữa đặc biệt (bird/word)", orderIndex: 6, targetPhonemes: ["/ɜː/"], difficulty: 6, notes: "Không có trong tiếng Việt", subcategory: "Nguyên âm đơn" },
  { id: "map-t1-g07-ei-ai", topicId: "topic-1-vowels", name: "/eɪ/ & /aɪ/", description: "Kết thúc bằng /ɪ/ (day/die)", orderIndex: 7, targetPhonemes: ["/eɪ/", "/aɪ/"], difficulty: 4, notes: "Âm trượt phổ biến", subcategory: "Nguyên âm đôi" },
  { id: "map-t1-g08-oi-au", topicId: "topic-1-vowels", name: "/ɔɪ/ & /aʊ/", description: "/ɔɪ/ lên, /aʊ/ xuống-lên (boy/now)", orderIndex: 8, targetPhonemes: ["/ɔɪ/", "/aʊ/"], difficulty: 5, notes: "Hướng di chuyển âm", subcategory: "Nguyên âm đôi" },
  { id: "map-t1-g09-ou-ea", topicId: "topic-1-vowels", name: "/əʊ/ & /eə/", description: "Nhóm trung tâm (go/air)", orderIndex: 9, targetPhonemes: ["/əʊ/", "/eə/"], difficulty: 6, notes: "Âm trượt từ/tới schwa", subcategory: "Nguyên âm đôi" },
  { id: "map-t1-g10-ia-ua", topicId: "topic-1-vowels", name: "/ɪə/ & /ʊə/", description: "Kết thúc bằng schwa (ear/tour)", orderIndex: 10, targetPhonemes: ["/ɪə/", "/ʊə/"], difficulty: 7, notes: "Âm khó, ít gặp", subcategory: "Nguyên âm đôi" },

  // --- CĐ2 PHỤ ÂM (12 nhóm theo 5 tầng) ---
  // Tầng 1 Plosives
  { id: "map-t2-g01-p-b", topicId: "topic-2-consonants", name: "/p/ & /b/", description: "Bilabial - hai môi (pen/ben)", orderIndex: 1, targetPhonemes: ["/p/", "/b/"], difficulty: 2, notes: "Cặp vô thanh/hữu thanh cơ bản", subcategory: "Plosives" },
  { id: "map-t2-g02-t-d", topicId: "topic-2-consonants", name: "/t/ & /d/", description: "Alveolar tắc (tea/day)", orderIndex: 2, targetPhonemes: ["/t/", "/d/"], difficulty: 3, notes: "Người Việt hay nuốt /t/ /d/ cuối", subcategory: "Plosives" },
  { id: "map-t2-g03-k-g", topicId: "topic-2-consonants", name: "/k/ & /g/", description: "Velar (cat/got)", orderIndex: 3, targetPhonemes: ["/k/", "/g/"], difficulty: 3, notes: "Âm từ vòm mềm", subcategory: "Plosives" },
  // Tầng 2 Fricatives
  { id: "map-t2-g04-f-v", topicId: "topic-2-consonants", name: "/f/ & /v/", description: "Labiodental (fan/van)", orderIndex: 4, targetPhonemes: ["/f/", "/v/"], difficulty: 4, notes: "Người Việt nhầm /v/ thành /w/", subcategory: "Fricatives" },
  { id: "map-t2-g05-th-dh", topicId: "topic-2-consonants", name: "/θ/ & /ð/", description: "Dental - đặt lưỡi giữa răng (think/this)", orderIndex: 5, targetPhonemes: ["/θ/", "/ð/"], difficulty: 8, notes: "Khó nhất người Việt, không có âm răng", subcategory: "Fricatives" },
  { id: "map-t2-g06-s-z", topicId: "topic-2-consonants", name: "/s/ & /z/", description: "Alveolar xát (see/zoo)", orderIndex: 6, targetPhonemes: ["/s/", "/z/"], difficulty: 3, notes: "/z/ ít gặp trong tiếng Việt", subcategory: "Fricatives" },
  { id: "map-t2-g07-sh-zh", topicId: "topic-2-consonants", name: "/ʃ/ & /ʒ/", description: "Post-alveolar (ship/measure)", orderIndex: 7, targetPhonemes: ["/ʃ/", "/ʒ/"], difficulty: 5, notes: "/ʒ/ rất hiếm", subcategory: "Fricatives" },
  { id: "map-t2-g08-h", topicId: "topic-2-consonants", name: "/h/", description: "Glottal - thanh hầu (he/hot)", orderIndex: 8, targetPhonemes: ["/h/"], difficulty: 3, notes: "Không có cặp vô thanh/hữu thanh", subcategory: "Fricatives" },
  // Tầng 3 Affricates
  { id: "map-t2-g09-ch-j", topicId: "topic-2-consonants", name: "/tʃ/ & /dʒ/", description: "Affricate post-alveolar (chair/job)", orderIndex: 9, targetPhonemes: ["/tʃ/", "/dʒ/"], difficulty: 4, notes: "Âm kép", subcategory: "Affricates" },
  // Tầng 4 Nasals
  { id: "map-t2-g10-nasals", topicId: "topic-2-consonants", name: "/m/ & /n/ & /ŋ/", description: "Âm mũi (man/now/sing)", orderIndex: 10, targetPhonemes: ["/m/", "/n/", "/ŋ/"], difficulty: 3, notes: "/ŋ/ cuối từ không thêm /g/", subcategory: "Nasals" },
  // Tầng 5 Approximants
  { id: "map-t2-g11-l-r", topicId: "topic-2-consonants", name: "/l/ & /r/", description: "Liquids (light/right)", orderIndex: 11, targetPhonemes: ["/l/", "/r/"], difficulty: 7, notes: "Khó nhất người Việt, /r/ cần uốn lưỡi", subcategory: "Approximants" },
  { id: "map-t2-g12-w-j", topicId: "topic-2-consonants", name: "/w/ & /j/", description: "Glides - bán nguyên âm (we/yes)", orderIndex: 12, targetPhonemes: ["/w/", "/j/"], difficulty: 4, notes: "Người Việt nhầm /w/ với /v/, /j/ với /dʒ/", subcategory: "Approximants" },

  // --- CĐ3 MINIMAL PAIRS KHÓ (4 nhóm) ---
  { id: "map-t3-g01-front-vowel-mix", topicId: "topic-3-minimal-pairs-hard", name: "Nguyên âm phía trước dễ nhầm", description: "/iː/ vs /ɪ/ vs /e/ vs /æ/ (sheep/ship/shape/sharp)", orderIndex: 1, targetPhonemes: ["/iː/", "/ɪ/", "/e/", "/æ/"], difficulty: 9, notes: "Tổng hợp 4 nguyên âm phía trước", subcategory: null },
  { id: "map-t3-g02-initial-confuse", topicId: "topic-3-minimal-pairs-hard", name: "Phụ âm đầu từ dễ nhầm", description: "/l/ vs /r/ vs /n/ (light/right/night)", orderIndex: 2, targetPhonemes: ["/l/", "/r/", "/n/"], difficulty: 9, notes: "Lỗi l/n và /r/", subcategory: null },
  { id: "map-t3-g03-final-drop", topicId: "topic-3-minimal-pairs-hard", name: "Phụ âm cuối từ dễ bỏ", description: "final /p/ vs /b/, /t/ vs /d/, /k/ vs /g/ (cap/cab, cat/cad)", orderIndex: 3, targetPhonemes: ["/p/", "/b/", "/t/", "/d/", "/k/", "/g/"], difficulty: 8, notes: "Người Việt hay nuốt phụ âm cuối", subcategory: null },
  { id: "map-t3-g04-dental-sibilant", topicId: "topic-3-minimal-pairs-hard", name: "Âm răng & âm xát", description: "/θ/ vs /s/ vs /t/, /ð/ vs /z/ vs /d/ (think/sink, this/diss)", orderIndex: 4, targetPhonemes: ["/θ/", "/s/", "/t/", "/ð/", "/z/", "/d/"], difficulty: 10, notes: "Khó nhất - không có âm răng trong tiếng Việt", subcategory: null },

  // --- CĐ4 TRỌNG ÂM & NỐI ÂM (4 nhóm mới) ---
  { id: "map-t4-g01-word-stress", topicId: "topic-4-stress-connected", name: "Word Stress", description: "Trọng âm từ - nghe & bấm âm tiết nhấn, đọc đúng trọng âm", orderIndex: 1, targetPhonemes: [], difficulty: 6, notes: "Mode A: Tap the Stress. Mode B: đọc từ đúng trọng âm.", subcategory: null },
  { id: "map-t4-g02-weak-forms", topicId: "topic-4-stress-connected", name: "Weak Forms", description: "Âm lướt / từ chức năng - chọn từ đọc lướt /ə/, đọc cả câu", orderIndex: 2, targetPhonemes: ["/ə/"], difficulty: 7, notes: "can/to/for/and/at → /kən/ /tə/ /fə/ /ən/ /ət/", subcategory: null },
  { id: "map-t4-g03-linking", topicId: "topic-4-stress-connected", name: "Linking", description: "Nối âm - nghe cụm & chọn phát âm đúng, đọc cụm", orderIndex: 3, targetPhonemes: [], difficulty: 7, notes: "C+V: hold on → /həʊl dɒn/. C+C: bad dog → /bæ dɒg/.", subcategory: null },
  { id: "map-t4-g04-assimilation", topicId: "topic-4-stress-connected", name: "Assimilation & Elision", description: "Biến âm & nuốt âm - nghe câu tự nhiên & chọn, đọc câu", orderIndex: 4, targetPhonemes: [], difficulty: 8, notes: "/t/+/j/=/tʃ/: meet you → meetcha. /d/+/j/=/dʒ/: did you → didja.", subcategory: null },
```

- [ ] **Step 5: Chạy test → xác nhận pass**

Run: `npm test`
Expected: PASS — 3 test subcategory mới pass, tổng số test = số cũ + 3 (trước đó 29 → 32). Không có test cũ bị hỏng.

- [ ] **Step 6: Commit**

```bash
git add prisma/lesson-catalog.ts src/lib/__tests__/lesson-catalog.test.ts
git commit -m "SP3a-fix: catalog subcategory CD1 (don/doi) + CD2 (5 tang) + test"
```

---

## Task 2: Apply schema — validate + db push + commit

**Files:**
- Apply+commit: `prisma/schema.prisma` (subcategory đã có trong working tree, chưa commit)

Lưu ý: `subcategory String?` đã được thêm vào `SoundGroup` (line 238) và `LearningMap` (line 77) trong working tree. Task này validate, apply lên DB, và commit. Cột nullable → `db push` an toàn, không mất data.

- [ ] **Step 1: Validate schema**

Run: `npx prisma validate`
Expected: `The schema at prisma/schema.prisma is valid 🚀` (không lỗi).

- [ ] **Step 2: Apply lên DB**

Run: `npx prisma db push`
Expected: DB đã có cột `subcategory` trên 2 bảng `SoundGroup` + `LearningMap`. Output báo "Your database is now in sync with your schema" (hoặc tương đương). Không có warning mất data vì cột nullable.

- [ ] **Step 3: Commit schema**

```bash
git add prisma/schema.prisma
git commit -m "SP3a-fix: schema - them subcategory (SoundGroup + LearningMap)"
```

(Không commit `next-env.d.ts` — file auto-generated, không thuộc feature này.)

---

## Task 3: Seed canonical — ghi subcategory trong seed_lessons.ts

**Files:**
- Modify: `prisma/seed_lessons.ts` (`seedSoundGroups()` line 205-257, `generateLearningMaps()` line 647-672)

Mục đích: seed chính thức ghi subcategory cho các lần re-seed đầy đủ sau này. Task này CHỈ sửa code, không chạy seed đầy đủ (để tránh re-fetch audio — xem Task 4).

- [ ] **Step 1: Sửa seedSoundGroups() ghi subcategory**

Trong `prisma/seed_lessons.ts`, tìm block upsert của `seedSoundGroups()` (khoảng line 209-226). Thêm `subcategory: sg.subcategory,` vào cả `update` và `create`:

```ts
    await prisma.soundGroup.upsert({
      where: { id: sg.id },
      update: {
        name: sg.name,
        description: sg.description,
        orderIndex: sg.orderIndex,
        status: "DRAFT", // Mặc định DRAFT; sẽ chuyển ACTIVE khi có content đầy đủ
        topicId: sg.topicId,
        subcategory: sg.subcategory,
      },
      create: {
        id: sg.id,
        name: sg.name,
        description: sg.description,
        orderIndex: sg.orderIndex,
        status: "DRAFT",
        topicId: sg.topicId,
        subcategory: sg.subcategory,
      },
    });
```

- [ ] **Step 2: Sửa generateLearningMaps() inherit subcategory**

Trong cùng file, tìm block upsert của `generateLearningMaps()` (khoảng line 655-668). Thêm `subcategory: sg.subcategory,` vào cả `update` và `create`:

```ts
    await prisma.learningMap.upsert({
      where: { id: mapId },
      update: {
        name: sg.name,
        requirement: sg.description,
        status: hasContent ? "ACTIVE" : "DRAFT",
        subcategory: sg.subcategory,
      },
      create: {
        id: mapId,
        name: sg.name,
        requirement: sg.description,
        status: hasContent ? "ACTIVE" : "DRAFT",
        subcategory: sg.subcategory,
      },
    });
```

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS (không lỗi type). Nếu `prisma/*.ts` không nằm trong `tsconfig` include, chạy thêm `npx tsx --check prisma/seed_lessons.ts` không bắt buộc — type sẽ được tsx kiểm tra khi chạy ở Task 4.

- [ ] **Step 4: Commit**

```bash
git add prisma/seed_lessons.ts
git commit -m "SP3a-fix: seed canonical ghi subcategory (SoundGroup + LearningMap inherit)"
```

---

## Task 4: Migration script nhỏ — cập nhật subcategory lên DB hiện tại

**Files:**
- Create: `prisma/seed_subcategory.ts`

Lý do KHÔNG chạy lại `npm run db:seed:lessons` đầy đủ: seed đầy đủ re-fetch audio từ Free Dictionary API trong `seedLessonContent()`, có thể ghi đè `audioUrl` (regression SP3a local audio). Script nhỏ này chỉ upsert `subcategory` trên `SoundGroup` + `LearningMap` — không đụng content/audio.

- [ ] **Step 1: Tạo script migration**

Tạo file `prisma/seed_subcategory.ts`:

```ts
/**
 * SEED SUBCATEGORY (SP3a-fix) - Cập nhật subcategory lên DB hiện tại.
 *
 * Chỉ upsert subcategory trên SoundGroup + LearningMap. KHÔNG re-fetch audio,
 * KHÔNG đổi content (words/pairs/sentences) → tránh regression SP3a local audio.
 *
 * Chạy: npx tsx prisma/seed_subcategory.ts
 * Yêu cầu: DB đã seed đầy đủ (SP3a) + đã db push (cột subcategory tồn tại, Task 2).
 */

import { PrismaClient } from "@prisma/client";
import { SOUND_GROUPS } from "./lesson-catalog";

const prisma = new PrismaClient();

async function main() {
  console.log("🏷️  Updating subcategory on SoundGroup + LearningMap (no content/audio re-fetch)...");

  let updatedGroups = 0;
  let updatedMaps = 0;
  let skipped = 0;

  for (const sg of SOUND_GROUPS) {
    const mapId = `map-${sg.id}`;

    const existingGroup = await prisma.soundGroup.findUnique({ where: { id: sg.id } });
    if (!existingGroup) {
      console.warn(`   ⚠️  SoundGroup ${sg.id} không có trong DB — bỏ qua (cần seed đầy đủ trước).`);
      skipped++;
      continue;
    }

    await prisma.soundGroup.update({
      where: { id: sg.id },
      data: { subcategory: sg.subcategory },
    });
    updatedGroups++;

    const existingMap = await prisma.learningMap.findUnique({ where: { id: mapId } });
    if (existingMap) {
      await prisma.learningMap.update({
        where: { id: mapId },
        data: { subcategory: sg.subcategory },
      });
      updatedMaps++;
    } else {
      console.warn(`   ⚠️  LearningMap ${mapId} không có trong DB — bỏ qua.`);
    }
  }

  console.log(`\n   ✓ ${updatedGroups} SoundGroups, ${updatedMaps} LearningMaps updated`);
  if (skipped > 0) console.log(`   ⚠️  ${skipped} nhóm bị bỏ qua`);

  // === DB VERIFICATION ===
  const groupCounts = await prisma.soundGroup.groupBy({ by: ["subcategory"], _count: true });
  console.log("\n📊 DB verification (SoundGroup by subcategory):");
  for (const row of groupCounts) {
    console.log(`   ${row.subcategory ?? "null"}: ${row._count}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
```

- [ ] **Step 2: Chạy script**

Run: `npx tsx prisma/seed_subcategory.ts`
Expected output (đại khái):
```
🏷️  Updating subcategory on SoundGroup + LearningMap ...
   ✓ 30 SoundGroups, 30 LearningMaps updated

📊 DB verification (SoundGroup by subcategory):
   Plosives: 3
   Fricatives: 5
   Nguyên âm đơn: 6
   Approximants: 2
   Nguyên âm đôi: 4
   Nasals: 1
   Affricates: 1
   null: 8
```
(Tổng = 3+5+6+2+4+1+1+8 = 30. Tất cả LearningMap phải có subcategory khớp với SoundGroup của nó.)

- [ ] **Step 3: Verify counts khớp erata**

Kiểm tra output: CĐ1 = 6 "Nguyên âm đơn" + 4 "Nguyên âm đôi"; CĐ2 = 3 Plosives + 5 Fricatives + 1 Affricates + 1 Nasals + 2 Approximants; null = 8 (CĐ3 4 + CĐ4 4). Nếu thiếu/sai → dừng, kiểm tra catalog (Task 1) và re-run script (idempotent).

- [ ] **Step 4: Commit**

```bash
git add prisma/seed_subcategory.ts
git commit -m "SP3a-fix: script migration subcategory (update DB, khong refetch audio)"
```

---

## Task 5: Learning Map UI — gom maps theo subcategory

**Files:**
- Modify: `src/app/learning_map/page.tsx` (map select line 22-28, LearningMapUI build line 62-68)
- Modify: `src/app/learning_map/LearningMapClient.tsx` (type line 20-26, helper + render view topic line 270-320)

- [ ] **Step 1: page.tsx — query subcategory từ map**

Trong `src/app/learning_map/page.tsx`, sửa `map` select (line 22-28) thêm `subcategory: true,`:

```ts
            map: {
              select: {
                id: true,
                name: true,
                requirement: true,
                status: true,
                subcategory: true,
              },
            },
```

- [ ] **Step 2: page.tsx — truyền subcategory vào LearningMapUI**

Trong cùng file, sửa block tạo `LearningMapUI` (line 62-68) thêm `subcategory: exercise.map.subcategory,`:

```ts
        mapsById.set(exercise.map.id, {
          id: exercise.map.id,
          name: exercise.map.name,
          requirement: exercise.map.requirement,
          status: exercise.map.status,
          subcategory: exercise.map.subcategory,
          exercises: [],
        });
```

- [ ] **Step 3: LearningMapClient.tsx — thêm subcategory vào type**

Trong `src/app/learning_map/LearningMapClient.tsx`, sửa type `LearningMapUI` (line 20-26) thêm `subcategory: string | null;`:

```ts
export type LearningMapUI = {
  id: string;
  name: string;
  requirement: string | null;
  status: string;
  subcategory: string | null;
  exercises: ExerciseUI[];
};
```

- [ ] **Step 4: LearningMapClient.tsx — thêm helper groupMapsBySubcategory**

Thêm helper function (sau `getMapStats`, trước `export default function LearningMapClient`, khoảng line 136):

```ts
function groupMapsBySubcategory(maps: LearningMapUI[]) {
  // Gom maps theo subcategory, giữ thứ tự xuất hiện (maps đã sort theo id ở page.tsx).
  // null → nhóm "không phân loại", UI render phẳng (cho CĐ3/4).
  const groups: { subcategory: string | null; maps: LearningMapUI[] }[] = [];
  for (const map of maps) {
    const key = map.subcategory ?? null;
    const existing = groups.find((g) => g.subcategory === key);
    if (existing) {
      existing.maps.push(map);
    } else {
      groups.push({ subcategory: key, maps: [map] });
    }
  }
  return groups;
}
```

- [ ] **Step 5: LearningMapClient.tsx — render gom nhóm trong view topic**

Trong view `selectedTopic && !selectedMap` (khoảng line 270-320), thay block grid hiện tại:

```tsx
            {selectedTopic.maps.length === 0 ? (
              <Card>
                <h2 className="text-xl font-bold text-neutral-900">Chưa có nhóm âm</h2>
                <p className="mt-2 text-neutral-600">Chủ đề này hiện chưa có bài tập trong database.</p>
              </Card>
            ) : (
              <section className="grid grid-cols-1 gap-5 md:grid-cols-2" aria-label="Danh sách nhóm âm">
                {selectedTopic.maps.map((map) => {
                  // ... (toàn bộ card map hiện tại giữ nguyên)
                })}
              </section>
            )}
```

bằng version gom nhóm:

```tsx
            {selectedTopic.maps.length === 0 ? (
              <Card>
                <h2 className="text-xl font-bold text-neutral-900">Chưa có nhóm âm</h2>
                <p className="mt-2 text-neutral-600">Chủ đề này hiện chưa có bài tập trong database.</p>
              </Card>
            ) : (
              <div className="space-y-10">
                {groupMapsBySubcategory(selectedTopic.maps).map((group) => (
                  <section
                    key={group.subcategory ?? "default"}
                    aria-label={group.subcategory ?? "Danh sách nhóm âm"}
                  >
                    {group.subcategory && (
                      <h3 className="mb-4 text-xl font-bold tracking-tight text-neutral-900">
                        {group.subcategory}
                      </h3>
                    )}
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                      {group.maps.map((map) => {
                        const stats = getMapStats(map);
                        const disabled = map.status !== "ACTIVE" || stats.total === 0;

                        return (
                          <button
                            key={map.id}
                            type="button"
                            onClick={() => setSelectedMap(map)}
                            disabled={disabled}
                            className="rounded-xl border border-neutral-200 bg-white p-6 text-left shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary-300 hover:shadow-md focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:border-neutral-200 disabled:hover:shadow-sm"
                            aria-label={`Mở nhóm âm ${map.name}`}
                          >
                            <div className="mb-4 flex items-start justify-between gap-4">
                              <h2 className="text-xl font-bold text-neutral-900">{map.name}</h2>
                              <div className="flex shrink-0 flex-col items-end gap-2">
                                <Badge variant={getRequirementVariant(map.requirement)} size="sm">
                                  {map.requirement || "Chưa phân loại"}
                                </Badge>
                                {map.status !== "ACTIVE" && (
                                  <Badge variant={getStatusVariant(map.status)} size="sm">
                                    {getStatusLabel(map.status)}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <p className="mb-5 text-neutral-600">
                              {stats.total} dạng bài tập, {stats.completed} bài đã đạt từ 70 điểm.
                            </p>
                            <ProgressBar
                              value={stats.completed}
                              max={Math.max(stats.total, 1)}
                              label={`${stats.completed}/${stats.total} bài hoàn thành`}
                              color={stats.completed === stats.total && stats.total > 0 ? "success" : "primary"}
                              showPercentage={stats.total > 0}
                            />
                            <div className="mt-5 text-sm font-bold text-primary-700">
                              {disabled ? "Nội dung chưa sẵn sàng" : "Xem bài tập"}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </section>
                ))}
              </div>
            )}
```

(Lưu ý: toàn bộ nội dung card map giữ nguyên như cũ, chỉ bọc thêm heading `group.subcategory` + lặp theo nhóm. Khi `group.subcategory` null → không render heading, grid phẳng như cũ cho CĐ3/4.)

- [ ] **Step 6: Type-check + build**

Run: `npx tsc --noEmit`
Expected: PASS (không lỗi type; `LearningMapUI.subcategory` khớp `string | null` từ page.tsx).

Run: `npm run build`
Expected: PASS — build thành công, không lỗi import/type.

- [ ] **Step 7: Commit**

```bash
git add src/app/learning_map/page.tsx src/app/learning_map/LearningMapClient.tsx
git commit -m "SP3a-fix: Learning Map UI gom nhom am theo subcategory (CD1/CD2)"
```

---

## Task 6: Engine — nút "X" → "← Lộ trình"

**Files:**
- Modify: `src/app/exercises/[id]/ExerciseEngineClient.tsx` (nút close line 1081-1088)

`router` đã import (line 4: `import { useRouter } from "next/navigation"`). Engine đã dùng `router.push("/learning_map")` ở 2 chỗ khác (line 974, 1067) → đổi nút "X" cho nhất quán.

- [ ] **Step 1: Đổi nút close**

Trong `src/app/exercises/[id]/ExerciseEngineClient.tsx`, thay block nút (line 1081-1088):

```tsx
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Quay lại trang trước"
          className="rounded-lg p-2 text-xl font-bold text-neutral-500 transition-colors hover:text-neutral-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500"
        >
          X
        </button>
```

bằng:

```tsx
        <button
          type="button"
          onClick={() => router.push("/learning_map")}
          aria-label="Quay về lộ trình"
          className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-bold text-neutral-500 transition-colors hover:text-neutral-900 focus:outline-none focus-visible:ring-4 focus-visible:ring-primary-500"
        >
          <span aria-hidden="true">←</span> Lộ trình
        </button>
```

- [ ] **Step 2: Type-check + build**

Run: `npx tsc --noEmit`
Expected: PASS.

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add "src/app/exercises/[id]/ExerciseEngineClient.tsx"
git commit -m "SP3a-fix: engine nut X -> 'Lộ trình' (router.push /learning_map)"
```

---

## Task 7: Trang /exercises (list) — thêm nút "← Lộ trình"

**Files:**
- Modify: `src/app/exercises/page.tsx` (đầu `<main>`, line 52-59)

`Link` đã import (line 1). Đây là server component — dùng styled `Link` (không cần "use client"), nhất quán với Link "Bắt đầu làm bài" đã có trong file (line 110-114).

- [ ] **Step 1: Thêm nút quay về đầu trang**

Trong `src/app/exercises/page.tsx`, tìm đầu `<main>` (line 52-54):

```tsx
      <main className="max-w-6xl mx-auto">
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-neutral-900 mb-3">Bài tập luyện phát âm</h1>
```

chèn nút "← Lộ trình" trước `<div className="mb-10">`:

```tsx
      <main className="max-w-6xl mx-auto">
        <div className="mb-6">
          <Link
            href="/learning_map"
            className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 bg-white px-4 py-2 text-sm font-bold text-neutral-700 transition-colors hover:border-primary-300 hover:text-primary-700"
          >
            <span aria-hidden="true">←</span> Lộ trình
          </Link>
        </div>
        <div className="mb-10">
          <h1 className="text-4xl font-bold text-neutral-900 mb-3">Bài tập luyện phát âm</h1>
```

- [ ] **Step 2: Type-check + build**

Run: `npx tsc --noEmit`
Expected: PASS.

Run: `npm run build`
Expected: PASS.

- [ ] **Step 3: Commit**

```bash
git add src/app/exercises/page.tsx
git commit -m "SP3a-fix: trang /exercises them nut 'Lộ trình' quay ve learning_map"
```

---

## Task 8: Quality gate cuối

**Files:** không sửa — chỉ verify.

- [ ] **Step 1: Validate schema**

Run: `npx prisma validate`
Expected: schema valid.

- [ ] **Step 2: DB sync**

Run: `npx prisma db push`
Expected: DB in sync (không thay đổi thêm — đã push ở Task 2).

- [ ] **Step 3: Type-check**

Run: `npx tsc --noEmit`
Expected: PASS — 0 error.

- [ ] **Step 4: Test**

Run: `npm test`
Expected: PASS — tất cả test pass, gồm 3 test subcategory mới (CĐ1/CĐ2/CĐ3-4). Tổng ~32 test.

- [ ] **Step 5: Build**

Run: `npm run build`
Expected: PASS — `✓ Compiled successfully`, route `/learning_map` + `/exercises` + `/exercises/[id]` build OK.

- [ ] **Step 6: Smoke test thủ công (tùy chọn nhưng khuyến nghị)**

Khởi động `npm run dev`, vào `/learning_map`:
- Mở CĐ1 "Nguyên âm" → thấy 2 heading "Nguyên âm đơn" (6 nhóm) + "Nguyên âm đôi" (4 nhóm).
- Mở CĐ2 "Phụ âm" → thấy 5 heading Plosives/Fricatives/Affricates/Nasals/Approximants.
- Mở CĐ3/4 → grid phẳng (không heading) — đúng (null).
- Vào `/exercises` → thấy nút "← Lộ trình" đầu trang, bấm về `/learning_map`.
- Vào 1 exercise `/exercises/[id]` → header có nút "← Lộ trình" (thay "X"), bấm về `/learning_map`.

- [ ] **Step 7: Commit cuối (nếu còn thay đổi lẻ)**

Nếu các bước verify làm phát sinh thay đổi (hiếm), commit:
```bash
git add -A
git commit -m "SP3a-fix: quality gate pass (validate + tsc + test + build)"
```
Nếu không có thay đổi → bỏ qua bước này (các commit task trước đã đủ).

---

## Self-Review (đã kiểm tra)

**Spec coverage:** Tất cả mục trong spec đều có task:
- §1 schema → Task 2 ✓ | §1 catalog (CĐ1+CĐ2) → Task 1 ✓ | §1 seed → Task 3 + Task 4 ✓ | §1 UI gom → Task 5 ✓
- §2 engine nút → Task 6 ✓ | §2 list nút → Task 7 ✓ | §3 test → Task 1 (TDD) ✓ | §3 quality gate → Task 8 ✓
- §3 "không re-seed content" → Task 4 dùng script nhỏ, không re-fetch audio ✓

**Placeholder scan:** Không có TBD/TODO. Mọi step code đều có code đầy đủ.

**Type consistency:** `subcategory: string | null` nhất quán qua: catalog type (Task 1) → seed (Task 3) → DB (Task 2/4) → `LearningMapUI` (Task 5). Test dùng `=== null` khớp kiểu (không undefined).

**Rủi ro đã xử lý:** re-fetch audio tránh bằng script migration riêng (Task 4); UI null → phẳng giữ CĐ3/4 không vỡ (Task 5).
