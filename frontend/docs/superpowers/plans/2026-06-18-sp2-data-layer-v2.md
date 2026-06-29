# SP2 — Data layer v2 (schema + catalog 30 nhóm) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Nâng schema + catalog từ v1 (25 nhóm/100 bài) lên v2 (30 nhóm/112 bài) với unlock tuần tự 80%, sẵn sàng cho SP3 (content) + SP4 (engine). Không vỡ v1.

**Architecture:** Thêm 7 trường nullable vào schema (không phá v1). Viết lại `lesson-catalog.ts` (4 topic + 30 nhóm + 6 mode). Cập nhật `seed_lessons.ts` sinh shell 30 nhóm + 4 QuestionType mới, giữ content 5 nhóm v1. TDD cho catalog test trước, seed sau. `prisma db push` để migrate (dev).

**Tech Stack:** Prisma 6.19.3 + PostgreSQL, TypeScript strict, `node:test` + `node:assert/strict` (pattern hiện có trong `src/lib/__tests__/`), tsx để chạy seed.

**Spec:** `docs/superpowers/specs/2026-06-18-sp2-data-layer-v2-design.md`

---

## File Structure

| File | Trách nhiệm | Hành động |
|---|---|---|
| `frontend/prisma/schema.prisma` | Định nghĩa DB. Thêm 7 trường (Topic×2, Question×1, QuestionBankItem×1, WordItem×3). | sửa |
| `frontend/prisma/lesson-catalog.ts` | Nguồn cấu hình duy nhất: 4 topic + 30 nhóm + 6 mode + 44 phoneme. | viết lại |
| `frontend/prisma/seed_lessons.ts` | Seed shell 30 nhóm + 4 QuestionType mới, giữ 5 nhóm content v1. | sửa |
| `frontend/src/lib/__tests__/lesson-catalog.test.ts` | Test catalog: counts, phân bổ topic, unlock, tổng bài. | tạo (TDD) |

Lý do tách: catalog là nguồn chân thực (test được độc lập, không cần DB), seed dùng catalog, schema độc lập. Test catalog chạy nhanh (pure TS, không Prisma) — phù hợp pattern `node:test` hiện có.

---

### Task 1: Thêm 7 trường vào schema

**Files:**
- Modify: `frontend/prisma/schema.prisma` (Topic block dòng 116-123, Question block ~178, QuestionBankItem block ~343, WordItem block ~265)

- [ ] **Step 1: Sửa model Topic — thêm `orderIndex` + `unlockThresholdPercent`**

Trong `frontend/prisma/schema.prisma`, thay block Topic hiện tại:

```prisma
model Topic {
  id          String  @id @default(uuid())
  name        String // TenCD
  description String? // MoTa

  exercises   Exercise[]
  soundGroups SoundGroup[]
}
```

thành:

```prisma
model Topic {
  id          String  @id @default(uuid())
  name        String // TenCD
  description String? // MoTa

  // v2: thứ tự chủ đề + unlock tuần tự
  orderIndex             Int @default(0) // 1=vowels, 2=consonants, 3=minimal-pairs-hard, 4=stress-connected
  unlockThresholdPercent Int @default(0) // % hoàn thành topic trước cần đạt. 0 = mở tự do (CĐ1). CĐ2/3/4 = 80.

  exercises   Exercise[]
  soundGroups SoundGroup[]
}
```

- [ ] **Step 2: Sửa model Question — thêm `acceptedAnswers`**

Tìm block `model Question` (có `answer String`). Thêm sau dòng `answer String`:

```prisma
  acceptedAnswers Json? // v2: mảng đáp án chấp nhận cho Mode B CĐ4. null = dùng `answer` đơn trị.
```

- [ ] **Step 3: Sửa model QuestionBankItem — thêm `acceptedAnswers`**

Tìm block `model QuestionBankItem` (có `answer String`). Thêm sau dòng `answer String`:

```prisma
  acceptedAnswers Json? // v2: mảng đáp án chấp nhận cho Mode B CĐ4 (kho nguồn). null = dùng `answer` đơn trị.
```

- [ ] **Step 4: Sửa model WordItem — thêm `syllables`, `stressIndex`, `wordStressType`**

Tìm block `model WordItem` (có `word String`, `ipa String`). Thêm sau dòng `meaningVi String?`:

```prisma
  // v2: cho Chủ đề 4 Trọng âm & Nối âm
  syllables      Json?   // Mảng âm tiết để UI "Tap the Stress" render khối, vd ["pho","to","gra","phy"]
  stressIndex    Int?    // Vị trí âm tiết nhấn (0-based)
  wordStressType String? // WORD_STRESS | WEAK_FORM | LINKING | ASSIMILATION. null = từ IPA thường (CĐ1-3).
```

- [ ] **Step 5: Validate schema**

Run: `cd english_pronunciation_app\frontend && npx prisma validate`
Expected: `The schema at prisma\schema.prisma is valid 🚀`

- [ ] **Step 6: Generate client + push DB**

```bash
cd english_pronunciation_app\frontend
npx prisma generate
npx prisma db push
cd ..\..
```
Expected: `generate` thành công (có thể warn về deprecated package.json#prisma — OK); `db push` thêm 7 cột nullable, không mất data v1.

- [ ] **Step 7: Commit**

```bash
git add english_pronunciation_app/frontend/prisma/schema.prisma
git commit -m "SP2.1: schema v2 - them 7 truong (Topic orderIndex+unlockThreshold, Question/QBI acceptedAnswers, WordItem syllables/stressIndex/wordStressType)"
```

---

### Task 2: Viết test catalog (TDD - failing first)

**Files:**
- Create: `frontend/src/lib/__tests__/lesson-catalog.test.ts`

- [ ] **Step 1: Viết test failing**

Tạo `frontend/src/lib/__tests__/lesson-catalog.test.ts`:

```typescript
import assert from "node:assert/strict";
import test from "node:test";
import {
  TOPICS,
  SOUND_GROUPS,
  EXERCISE_MODES,
  PHONEMES,
  TOTAL_LESSONS,
  getSoundGroupsByTopic,
} from "../../prisma/lesson-catalog";

test("catalog có đúng 4 topic", () => {
  assert.equal(TOPICS.length, 4);
});

test("topic có orderIndex 1-4 không trùng và unlockThresholdPercent đúng", () => {
  const orders = TOPICS.map((t) => t.orderIndex).sort((a, b) => a - b);
  assert.deepEqual(orders, [1, 2, 3, 4]);

  const byOrder = Object.fromEntries(TOPICS.map((t) => [t.orderIndex, t]));
  // CĐ1 mở tự do, CĐ2/3/4 khóa 80%
  assert.equal(byOrder[1].unlockThresholdPercent, 0);
  assert.equal(byOrder[2].unlockThresholdPercent, 80);
  assert.equal(byOrder[3].unlockThresholdPercent, 80);
  assert.equal(byOrder[4].unlockThresholdPercent, 80);
});

test("catalog có đúng 30 sound group phân bổ đúng theo topic", () => {
  assert.equal(SOUND_GROUPS.length, 30);
  assert.equal(getSoundGroupsByTopic("topic-1-vowels").length, 10);
  assert.equal(getSoundGroupsByTopic("topic-2-consonants").length, 12);
  assert.equal(getSoundGroupsByTopic("topic-3-minimal-pairs-hard").length, 4);
  assert.equal(getSoundGroupsByTopic("topic-4-stress-connected").length, 4);
});

test("mỗi sound group có topicId hợp lệ và orderIndex không trùng trong topic", () => {
  const validTopicIds = new Set(TOPICS.map((t) => t.id));
  for (const sg of SOUND_GROUPS) {
    assert.ok(validTopicIds.has(sg.topicId), `topicId không hợp lệ: ${sg.topicId} (${sg.id})`);
  }
  // orderIndex không trùng trong từng topic
  const byTopic = new Map<string, number[]>();
  for (const sg of SOUND_GROUPS) {
    const arr = byTopic.get(sg.topicId) ?? [];
    arr.push(sg.orderIndex);
    byTopic.set(sg.topicId, arr);
  }
  for (const [topicId, orders] of byTopic) {
    const set = new Set(orders);
    assert.equal(set.size, orders.length, `orderIndex trùng trong topic ${topicId}`);
  }
});

test("catalog có 6 exercise mode (4 chuẩn + 2 đặc thù CĐ4)", () => {
  assert.equal(EXERCISE_MODES.length, 6);
  const ids = EXERCISE_MODES.map((m) => m.id);
  assert.ok(ids.includes("listen_choose"));
  assert.ok(ids.includes("speak_word"));
  assert.ok(ids.includes("speak_minimal_pair"));
  assert.ok(ids.includes("speak_sentence"));
  assert.ok(ids.includes("mode_a_listen_choose"));
  assert.ok(ids.includes("mode_b_speak_match"));
});

test("tổng số bài = 112 (CĐ1-3: 26 nhóm × 4 mode = 104; CĐ4: 4 nhóm × 2 mode = 8)", () => {
  assert.equal(TOTAL_LESSONS, 112);
});

test("catalog có 44 phoneme", () => {
  assert.equal(PHONEMES.length, 44);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd english_pronunciation_app\frontend && npm test`
Expected: FAIL — `lesson-catalog.test.ts` import từ catalog v1 (25 nhóm, 4 mode, TOTAL_LESSONS=100), các assertion 30/112/6 mode fail. (Các test cũ khác vẫn pass.)

- [ ] **Step 3: Commit failing test**

```bash
git add english_pronunciation_app/frontend/src/lib/__tests__/lesson-catalog.test.ts
git commit -m "SP2.2: test catalog v2 (failing) - 30 nhom, 6 mode, 112 bai, unlock 0/80/80/80"
```

---

### Task 3: Viết lại `lesson-catalog.ts` v2 (chỉ cấu trúc, đủ pass test)

**Files:**
- Modify: `frontend/prisma/lesson-catalog.ts` (viết lại toàn bộ)

- [ ] **Step 1: Viết lại catalog với 4 topic + 30 nhóm + 6 mode**

Thay toàn bộ nội dung `frontend/prisma/lesson-catalog.ts` bằng:

```typescript
/**
 * LESSON CATALOG v2 - Nguồn cấu hình duy nhất cho 4 chủ đề, 30 nhóm âm, 112 bài
 *
 * Cấu trúc (theo LESSON_SYLLABUS_STRUCTURE.md):
 * - 4 Topics (Chủ đề) với unlock tuần tự 80%
 * - 30 Sound Groups (10 vowels + 12 consonants + 4 minimal-pairs-hard + 4 stress-connected)
 * - 6 Exercise Modes (4 chuẩn cho CĐ1-3 + 2 đặc thù cho CĐ4)
 * - Tổng: 26 nhóm × 4 mode + 4 nhóm × 2 mode = 112 bài
 *
 * Unlock: CĐ1 mở tự do; CĐ2/3/4 mở khi topic trước hoàn thành ≥80% (trường unlockThresholdPercent).
 *
 * Nguyên tắc: không code 112 bài thủ công. Seed từ catalog -> generate Exercise.
 */

export type TopicDefinition = {
  id: string;
  name: string;
  description: string;
  orderIndex: number;
  unlockThresholdPercent: number; // 0 = mở tự do
  totalSoundGroups: number;
  color: string;
};

export type PhonemeDefinition = {
  ipa: string;
  type: "MONOPHTHONG" | "DIPHTHONG" | "CONSONANT";
  description: string;
  exampleWords: string[];
};

export type SoundGroupDefinition = {
  id: string;
  topicId: string;
  name: string;
  description: string;
  orderIndex: number;
  targetPhonemes: string[];
  difficulty: number;
  notes: string;
};

export type ExerciseModeDefinition = {
  id: string;
  name: string;
  description: string;
  questionTypeId: string;
  orderIndex: number;
  icon: string;
  appliesToTopics: string[]; // topic id áp dụng mode này
};

// ============================================================================
// TOPICS (4 chủ đề, unlock tuần tự 80%)
// ============================================================================

export const TOPICS: TopicDefinition[] = [
  {
    id: "topic-1-vowels",
    name: "Nguyên âm",
    description: "Nền tảng phát âm - 10 nhóm nguyên âm (6 đơn + 4 đôi)",
    orderIndex: 1,
    unlockThresholdPercent: 0,
    totalSoundGroups: 10,
    color: "blue",
  },
  {
    id: "topic-2-consonants",
    name: "Phụ âm",
    description: "12 nhóm phụ âm theo 5 tầng (Plosives/Fricatives/Affricates/Nasals/Approximants)",
    orderIndex: 2,
    unlockThresholdPercent: 80,
    totalSoundGroups: 12,
    color: "orange",
  },
  {
    id: "topic-3-minimal-pairs-hard",
    name: "Minimal Pairs Khó",
    description: "Tổng hợp 4 nhóm cặp âm dễ nhầm nhất (mở khóa sau CĐ2 ≥80%)",
    orderIndex: 3,
    unlockThresholdPercent: 80,
    totalSoundGroups: 4,
    color: "red",
  },
  {
    id: "topic-4-stress-connected",
    name: "Trọng âm & Nối âm",
    description: "4 nhóm đặc thù: Word Stress, Weak Forms, Linking, Assimilation (mở khóa sau CĐ3 ≥80%)",
    orderIndex: 4,
    unlockThresholdPercent: 80,
    totalSoundGroups: 4,
    color: "purple",
  },
];

// ============================================================================
// EXERCISE MODES (6: 4 chuẩn cho CĐ1-3 + 2 đặc thù cho CĐ4)
// ============================================================================

const STANDARD_TOPIC_IDS = ["topic-1-vowels", "topic-2-consonants", "topic-3-minimal-pairs-hard"];
const STRESS_TOPIC_IDS = ["topic-4-stress-connected"];

export const EXERCISE_MODES: ExerciseModeDefinition[] = [
  {
    id: "listen_choose",
    name: "Luyện tai",
    description: "Nghe và chọn IPA/từ đúng",
    questionTypeId: "qtype-1-mc",
    orderIndex: 1,
    icon: "👂",
    appliesToTopics: STANDARD_TOPIC_IDS,
  },
  {
    id: "speak_word",
    name: "Luyện miệng",
    description: "Đọc từ đơn theo IPA",
    questionTypeId: "qtype-2-voice",
    orderIndex: 2,
    icon: "🗣️",
    appliesToTopics: STANDARD_TOPIC_IDS,
  },
  {
    id: "speak_minimal_pair",
    name: "Thử thách kép",
    description: "Đọc cặp từ dễ nhầm lẫn",
    questionTypeId: "qtype-3-minimal-pairs",
    orderIndex: 3,
    icon: "⚔️",
    appliesToTopics: STANDARD_TOPIC_IDS,
  },
  {
    id: "speak_sentence",
    name: "Thực chiến",
    description: "Đọc câu có chứa âm mục tiêu",
    questionTypeId: "qtype-2-voice",
    orderIndex: 4,
    icon: "🎯",
    appliesToTopics: STANDARD_TOPIC_IDS,
  },
  {
    id: "mode_a_listen_choose",
    name: "Nghe & Chọn",
    description: "Mode A đặc thù CĐ4: nghe → chọn (tap stress / weak form / linking / assimilation)",
    questionTypeId: "qtype-2-voice", // placeholder, mỗi nhóm CĐ4 override questionTypeId cụ thể khi seed (SP3)
    orderIndex: 5,
    icon: "🎧",
    appliesToTopics: STRESS_TOPIC_IDS,
  },
  {
    id: "mode_b_speak_match",
    name: "Đọc & So khớp",
    description: "Mode B đặc thù CĐ4: đọc → so khớp nhiều dạng (acceptedAnswers)",
    questionTypeId: "qtype-2-voice",
    orderIndex: 6,
    icon: "🗣️",
    appliesToTopics: STRESS_TOPIC_IDS,
  },
];

// ============================================================================
// SOUND GROUPS (30 nhóm)
// ============================================================================

export const SOUND_GROUPS: SoundGroupDefinition[] = [
  // --- CĐ1 NGUYÊN ÂM (10 nhóm: 6 đơn + 4 đôi) ---
  { id: "map-t1-g01-i-ih", topicId: "topic-1-vowels", name: "/iː/ & /ɪ/", description: "Dài & ngắn phía trước (ship/sheep)", orderIndex: 1, targetPhonemes: ["/iː/", "/ɪ/"], difficulty: 3, notes: "Cặp cơ bản nhất" },
  { id: "map-t1-g02-e-ae", topicId: "topic-1-vowels", name: "/e/ & /æ/", description: "Hẹp & mở phía trước (bed/bad)", orderIndex: 2, targetPhonemes: ["/e/", "/æ/"], difficulty: 4, notes: "Người Việt hay gộp /æ/ thành /e/" },
  { id: "map-t1-g03-central", topicId: "topic-1-vowels", name: "/ɑː/ & /ʌ/ & /ə/", description: "Nhóm trung tâm (father/fun/about)", orderIndex: 3, targetPhonemes: ["/ɑː/", "/ʌ/", "/ə/"], difficulty: 5, notes: "Ba âm trung tâm" },
  { id: "map-t1-g04-o-oh", topicId: "topic-1-vowels", name: "/ɒ/ & /ɔː/", description: "Tròn ngắn & tròn dài (hot/horse)", orderIndex: 4, targetPhonemes: ["/ɒ/", "/ɔː/"], difficulty: 4, notes: "Âm tròn môi" },
  { id: "map-t1-g05-u-uh", topicId: "topic-1-vowels", name: "/ʊ/ & /uː/", description: "Sau ngắn & sau dài (full/fool)", orderIndex: 5, targetPhonemes: ["/ʊ/", "/uː/"], difficulty: 3, notes: "Cặp âm sau" },
  { id: "map-t1-g06-er", topicId: "topic-1-vowels", name: "/ɜː/", description: "Âm giữa đặc biệt (bird/word)", orderIndex: 6, targetPhonemes: ["/ɜː/"], difficulty: 6, notes: "Không có trong tiếng Việt" },
  { id: "map-t1-g07-ei-ai", topicId: "topic-1-vowels", name: "/eɪ/ & /aɪ/", description: "Kết thúc bằng /ɪ/ (day/die)", orderIndex: 7, targetPhonemes: ["/eɪ/", "/aɪ/"], difficulty: 4, notes: "Âm trượt phổ biến" },
  { id: "map-t1-g08-oi-au", topicId: "topic-1-vowels", name: "/ɔɪ/ & /aʊ/", description: "/ɔɪ/ lên, /aʊ/ xuống-lên (boy/now)", orderIndex: 8, targetPhonemes: ["/ɔɪ/", "/aʊ/"], difficulty: 5, notes: "Hướng di chuyển âm" },
  { id: "map-t1-g09-ou-ea", topicId: "topic-1-vowels", name: "/əʊ/ & /eə/", description: "Nhóm trung tâm (go/air)", orderIndex: 9, targetPhonemes: ["/əʊ/", "/eə/"], difficulty: 6, notes: "Âm trượt từ/tới schwa" },
  { id: "map-t1-g10-ia-ua", topicId: "topic-1-vowels", name: "/ɪə/ & /ʊə/", description: "Kết thúc bằng schwa (ear/tour)", orderIndex: 10, targetPhonemes: ["/ɪə/", "/ʊə/"], difficulty: 7, notes: "Âm khó, ít gặp" },

  // --- CĐ2 PHỤ ÂM (12 nhóm theo 5 tầng) ---
  // Tầng 1 Plosives
  { id: "map-t2-g01-p-b", topicId: "topic-2-consonants", name: "/p/ & /b/", description: "Bilabial - hai môi (pen/ben)", orderIndex: 1, targetPhonemes: ["/p/", "/b/"], difficulty: 2, notes: "Cặp vô thanh/hữu thanh cơ bản" },
  { id: "map-t2-g02-t-d", topicId: "topic-2-consonants", name: "/t/ & /d/", description: "Alveolar tắc (tea/day)", orderIndex: 2, targetPhonemes: ["/t/", "/d/"], difficulty: 3, notes: "Người Việt hay nuốt /t/ /d/ cuối" },
  { id: "map-t2-g03-k-g", topicId: "topic-2-consonants", name: "/k/ & /g/", description: "Velar (cat/got)", orderIndex: 3, targetPhonemes: ["/k/", "/g/"], difficulty: 3, notes: "Âm từ vòm mềm" },
  // Tầng 2 Fricatives
  { id: "map-t2-g04-f-v", topicId: "topic-2-consonants", name: "/f/ & /v/", description: "Labiodental (fan/van)", orderIndex: 4, targetPhonemes: ["/f/", "/v/"], difficulty: 4, notes: "Người Việt nhầm /v/ thành /w/" },
  { id: "map-t2-g05-th-dh", topicId: "topic-2-consonants", name: "/θ/ & /ð/", description: "Dental - đặt lưỡi giữa răng (think/this)", orderIndex: 5, targetPhonemes: ["/θ/", "/ð/"], difficulty: 8, notes: "Khó nhất người Việt, không có âm răng" },
  { id: "map-t2-g06-s-z", topicId: "topic-2-consonants", name: "/s/ & /z/", description: "Alveolar xát (see/zoo)", orderIndex: 6, targetPhonemes: ["/s/", "/z/"], difficulty: 3, notes: "/z/ ít gặp trong tiếng Việt" },
  { id: "map-t2-g07-sh-zh", topicId: "topic-2-consonants", name: "/ʃ/ & /ʒ/", description: "Post-alveolar (ship/measure)", orderIndex: 7, targetPhonemes: ["/ʃ/", "/ʒ/"], difficulty: 5, notes: "/ʒ/ rất hiếm" },
  { id: "map-t2-g08-h", topicId: "topic-2-consonants", name: "/h/", description: "Glottal - thanh hầu (he/hot)", orderIndex: 8, targetPhonemes: ["/h/"], difficulty: 3, notes: "Không có cặp vô thanh/hữu thanh" },
  // Tầng 3 Affricates
  { id: "map-t2-g09-ch-j", topicId: "topic-2-consonants", name: "/tʃ/ & /dʒ/", description: "Affricate post-alveolar (chair/job)", orderIndex: 9, targetPhonemes: ["/tʃ/", "/dʒ/"], difficulty: 4, notes: "Âm kép" },
  // Tầng 4 Nasals
  { id: "map-t2-g10-nasals", topicId: "topic-2-consonants", name: "/m/ & /n/ & /ŋ/", description: "Âm mũi (man/now/sing)", orderIndex: 10, targetPhonemes: ["/m/", "/n/", "/ŋ/"], difficulty: 3, notes: "/ŋ/ cuối từ không thêm /g/" },
  // Tầng 5 Approximants
  { id: "map-t2-g11-l-r", topicId: "topic-2-consonants", name: "/l/ & /r/", description: "Liquids (light/right)", orderIndex: 11, targetPhonemes: ["/l/", "/r/"], difficulty: 7, notes: "Khó nhất người Việt, /r/ cần uốn lưỡi" },
  { id: "map-t2-g12-w-j", topicId: "topic-2-consonants", name: "/w/ & /j/", description: "Glides - bán nguyên âm (we/yes)", orderIndex: 12, targetPhonemes: ["/w/", "/j/"], difficulty: 4, notes: "Người Việt nhầm /w/ với /v/, /j/ với /dʒ/" },

  // --- CĐ3 MINIMAL PAIRS KHÓ (4 nhóm) ---
  { id: "map-t3-g01-front-vowel-mix", topicId: "topic-3-minimal-pairs-hard", name: "Nguyên âm phía trước dễ nhầm", description: "/iː/ vs /ɪ/ vs /e/ vs /æ/ (sheep/ship/shape/sharp)", orderIndex: 1, targetPhonemes: ["/iː/", "/ɪ/", "/e/", "/æ/"], difficulty: 9, notes: "Tổng hợp 4 nguyên âm phía trước" },
  { id: "map-t3-g02-initial-confuse", topicId: "topic-3-minimal-pairs-hard", name: "Phụ âm đầu từ dễ nhầm", description: "/l/ vs /r/ vs /n/ (light/right/night)", orderIndex: 2, targetPhonemes: ["/l/", "/r/", "/n/"], difficulty: 9, notes: "Lỗi l/n và /r/" },
  { id: "map-t3-g03-final-drop", topicId: "topic-3-minimal-pairs-hard", name: "Phụ âm cuối từ dễ bỏ", description: "final /p/ vs /b/, /t/ vs /d/, /k/ vs /g/ (cap/cab, cat/cad)", orderIndex: 3, targetPhonemes: ["/p/", "/b/", "/t/", "/d/", "/k/", "/g/"], difficulty: 8, notes: "Người Việt hay nuốt phụ âm cuối" },
  { id: "map-t3-g04-dental-sibilant", topicId: "topic-3-minimal-pairs-hard", name: "Âm răng & âm xát", description: "/θ/ vs /s/ vs /t/, /ð/ vs /z/ vs /d/ (think/sink, this/diss)", orderIndex: 4, targetPhonemes: ["/θ/", "/s/", "/t/", "/ð/", "/z/", "/d/"], difficulty: 10, notes: "Khó nhất - không có âm răng trong tiếng Việt" },

  // --- CĐ4 TRỌNG ÂM & NỐI ÂM (4 nhóm mới) ---
  { id: "map-t4-g01-word-stress", topicId: "topic-4-stress-connected", name: "Word Stress", description: "Trọng âm từ - nghe & bấm âm tiết nhấn, đọc đúng trọng âm", orderIndex: 1, targetPhonemes: [], difficulty: 6, notes: "Mode A: Tap the Stress. Mode B: đọc từ đúng trọng âm." },
  { id: "map-t4-g02-weak-forms", topicId: "topic-4-stress-connected", name: "Weak Forms", description: "Âm lướt / từ chức năng - chọn từ đọc lướt /ə/, đọc cả câu", orderIndex: 2, targetPhonemes: ["/ə/"], difficulty: 7, notes: "can/to/for/and/at → /kən/ /tə/ /fə/ /ən/ /ət/" },
  { id: "map-t4-g03-linking", topicId: "topic-4-stress-connected", name: "Linking", description: "Nối âm - nghe cụm & chọn phát âm đúng, đọc cụm", orderIndex: 3, targetPhonemes: [], difficulty: 7, notes: "C+V: hold on → /həʊl dɒn/. C+C: bad dog → /bæ dɒg/." },
  { id: "map-t4-g04-assimilation", topicId: "topic-4-stress-connected", name: "Assimilation & Elision", description: "Biến âm & nuốt âm - nghe câu tự nhiên & chọn, đọc câu", orderIndex: 4, targetPhonemes: [], difficulty: 8, notes: "/t/+/j/=/tʃ/: meet you → meetcha. /d/+/j/=/dʒ/: did you → didja." },
];

// ============================================================================
// PHONEMES (44 âm IPA - giữ nguyên v1)
// ============================================================================

export const PHONEMES: PhonemeDefinition[] = [
  // Monophthongs
  { ipa: "/iː/", type: "MONOPHTHONG", description: "Nguyên âm dài trước cao", exampleWords: ["sheep", "see", "beat"] },
  { ipa: "/ɪ/", type: "MONOPHTHONG", description: "Nguyên âm ngắn trước cao", exampleWords: ["ship", "sit", "bit"] },
  { ipa: "/e/", type: "MONOPHTHONG", description: "Nguyên âm trước trung", exampleWords: ["bed", "pen", "red"] },
  { ipa: "/æ/", type: "MONOPHTHONG", description: "Nguyên âm trước thấp", exampleWords: ["bad", "pan", "rat"] },
  { ipa: "/ɑː/", type: "MONOPHTHONG", description: "Nguyên âm sau thấp dài", exampleWords: ["father", "car", "bar"] },
  { ipa: "/ʌ/", type: "MONOPHTHONG", description: "Nguyên âm trung ngắn", exampleWords: ["fun", "cup", "but"] },
  { ipa: "/ə/", type: "MONOPHTHONG", description: "Schwa - âm yếu", exampleWords: ["about", "sofa", "the"] },
  { ipa: "/ɒ/", type: "MONOPHTHONG", description: "Nguyên âm sau tròn ngắn", exampleWords: ["hot", "dog", "got"] },
  { ipa: "/ɔː/", type: "MONOPHTHONG", description: "Nguyên âm sau tròn dài", exampleWords: ["horse", "door", "law"] },
  { ipa: "/ʊ/", type: "MONOPHTHONG", description: "Nguyên âm sau cao ngắn", exampleWords: ["full", "put", "book"] },
  { ipa: "/uː/", type: "MONOPHTHONG", description: "Nguyên âm sau cao dài", exampleWords: ["fool", "food", "blue"] },
  { ipa: "/ɜː/", type: "MONOPHTHONG", description: "Nguyên âm trung cao dài", exampleWords: ["bird", "word", "nurse"] },
  // Diphthongs
  { ipa: "/eɪ/", type: "DIPHTHONG", description: "Nguyên âm đôi", exampleWords: ["day", "make", "they"] },
  { ipa: "/aɪ/", type: "DIPHTHONG", description: "Nguyên âm đôi", exampleWords: ["die", "my", "nice"] },
  { ipa: "/ɔɪ/", type: "DIPHTHONG", description: "Nguyên âm đôi", exampleWords: ["boy", "coin", "voice"] },
  { ipa: "/aʊ/", type: "DIPHTHONG", description: "Nguyên âm đôi", exampleWords: ["now", "house", "found"] },
  { ipa: "/əʊ/", type: "DIPHTHONG", description: "Nguyên âm đôi", exampleWords: ["go", "home", "know"] },
  { ipa: "/eə/", type: "DIPHTHONG", description: "Nguyên âm đôi", exampleWords: ["air", "care", "there"] },
  { ipa: "/ɪə/", type: "DIPHTHONG", description: "Nguyên âm đôi", exampleWords: ["ear", "here", "fear"] },
  { ipa: "/ʊə/", type: "DIPHTHONG", description: "Nguyên âm đôi", exampleWords: ["tour", "poor", "sure"] },
  // Consonants
  { ipa: "/p/", type: "CONSONANT", description: "Phụ âm vô thanh", exampleWords: ["pen", "cup", "happy"] },
  { ipa: "/b/", type: "CONSONANT", description: "Phụ âm hữu thanh", exampleWords: ["ben", "cab", "rabbit"] },
  { ipa: "/t/", type: "CONSONANT", description: "Phụ âm vô thanh", exampleWords: ["tea", "cat", "butter"] },
  { ipa: "/d/", type: "CONSONANT", description: "Phụ âm hữu thanh", exampleWords: ["day", "cad", "ladder"] },
  { ipa: "/k/", type: "CONSONANT", description: "Phụ âm vô thanh", exampleWords: ["cat", "back", "school"] },
  { ipa: "/g/", type: "CONSONANT", description: "Phụ âm hữu thanh", exampleWords: ["got", "bag", "foggy"] },
  { ipa: "/f/", type: "CONSONANT", description: "Phụ âm vô thanh", exampleWords: ["fan", "leaf", "photo"] },
  { ipa: "/v/", type: "CONSONANT", description: "Phụ âm hữu thanh", exampleWords: ["van", "live", "very"] },
  { ipa: "/s/", type: "CONSONANT", description: "Phụ âm vô thanh", exampleWords: ["see", "ice", "miss"] },
  { ipa: "/z/", type: "CONSONANT", description: "Phụ âm hữu thanh", exampleWords: ["zoo", "easy", "buzz"] },
  { ipa: "/ʃ/", type: "CONSONANT", description: "Phụ âm vô thanh", exampleWords: ["ship", "fish", "nation"] },
  { ipa: "/ʒ/", type: "CONSONANT", description: "Phụ âm hữu thanh", exampleWords: ["measure", "vision", "beige"] },
  { ipa: "/tʃ/", type: "CONSONANT", description: "Phụ âm kép vô thanh", exampleWords: ["chair", "match", "nature"] },
  { ipa: "/dʒ/", type: "CONSONANT", description: "Phụ âm kép hữu thanh", exampleWords: ["job", "age", "soldier"] },
  { ipa: "/θ/", type: "CONSONANT", description: "Phụ âm vô thanh răng", exampleWords: ["think", "path", "bath"] },
  { ipa: "/ð/", type: "CONSONANT", description: "Phụ âm hữu thanh răng", exampleWords: ["this", "bathe", "father"] },
  { ipa: "/m/", type: "CONSONANT", description: "Phụ âm mũi", exampleWords: ["man", "ham", "summer"] },
  { ipa: "/n/", type: "CONSONANT", description: "Phụ âm mũi", exampleWords: ["now", "sun", "funny"] },
  { ipa: "/ŋ/", type: "CONSONANT", description: "Phụ âm mũi", exampleWords: ["sing", "bank", "finger"] },
  { ipa: "/l/", type: "CONSONANT", description: "Phụ âm bên", exampleWords: ["light", "fall", "hello"] },
  { ipa: "/r/", type: "CONSONANT", description: "Phụ âm tiếp cận", exampleWords: ["right", "car", "carry"] },
  { ipa: "/w/", type: "CONSONANT", description: "Bán nguyên âm", exampleWords: ["we", "away", "queen"] },
  { ipa: "/j/", type: "CONSONANT", description: "Bán nguyên âm", exampleWords: ["yes", "use", "billion"] },
  { ipa: "/h/", type: "CONSONANT", description: "Âm hầu", exampleWords: ["he", "hot", "ahead"] },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getTopicById(id: string): TopicDefinition | undefined {
  return TOPICS.find((t) => t.id === id);
}

export function getSoundGroupsByTopic(topicId: string): SoundGroupDefinition[] {
  return SOUND_GROUPS.filter((sg) => sg.topicId === topicId).sort((a, b) => a.orderIndex - b.orderIndex);
}

export function getModesForTopic(topicId: string): ExerciseModeDefinition[] {
  return EXERCISE_MODES.filter((m) => m.appliesToTopics.includes(topicId)).sort((a, b) => a.orderIndex - b.orderIndex);
}

export function getPhonemeByIpa(ipa: string): PhonemeDefinition | undefined {
  return PHONEMES.find((p) => p.ipa === ipa);
}

// Tổng số bài = sum(ánh xạ nhóm → số mode áp dụng)
export const TOTAL_LESSONS = SOUND_GROUPS.reduce((sum, sg) => {
  return sum + getModesForTopic(sg.topicId).length;
}, 0);
```

- [ ] **Step 2: Run test to verify it passes**

Run: `cd english_pronunciation_app\frontend && npm test`
Expected: PASS — tất cả test (14 cũ + 8 catalog mới) pass. Nếu fail, đọc lỗi sửa catalog cho khớp test (không sửa test).

- [ ] **Step 3: Commit**

```bash
git add english_pronunciation_app/frontend/prisma/lesson-catalog.ts
git commit -m "SP2.3: catalog v2 - 4 topic + 30 nhom + 6 mode + unlock 0/80/80/80 (pass 8 test)"
```

---

### Task 4: Cập nhật seed — 4 QuestionType mới + 4 topic mới + shell 30 nhóm

**Files:**
- Modify: `frontend/prisma/seed_lessons.ts`

- [ ] **Step 1: Thêm 4 QuestionType mới vào `seedQuestionTypes`**

Trong `frontend/prisma/seed_lessons.ts`, tìm hàm `seedQuestionTypes`, thay mảng `questionTypes` hiện (3 phần tử) thành 7 phần tử:

```typescript
  const questionTypes = [
    {
      id: "qtype-1-mc",
      name: "Trắc nghiệm nghe",
      description: "Nghe audio và chọn đáp án đúng (IPA hoặc từ)",
    },
    {
      id: "qtype-2-voice",
      name: "Đọc từ hoặc câu",
      description: "Đọc từ đơn hoặc câu theo yêu cầu",
    },
    {
      id: "qtype-3-minimal-pairs",
      name: "Đọc cặp từ",
      description: "Đọc cặp minimal pair để phân biệt âm",
    },
    // v2: 4 QuestionType mới cho Chủ đề 4 Trọng âm & Nối âm
    {
      id: "qtype-4-tap-stress",
      name: "Chọn âm tiết nhấn",
      description: "Word Stress Mode A: nghe từ → bấm âm tiết được nhấn",
    },
    {
      id: "qtype-5-choose-weak",
      name: "Chọn từ lướt",
      description: "Weak Forms Mode A: nghe câu → chọn từ bị đọc lướt thành /ə/",
    },
    {
      id: "qtype-6-choose-linking",
      name: "Chọn phát âm nối",
      description: "Linking Mode A: nghe cụm từ → chọn cách phát âm đúng",
    },
    {
      id: "qtype-7-choose-assimilation",
      name: "Chọn câu biến âm",
      description: "Assimilation Mode A: nghe câu tự nhiên → chọn câu vừa nghe",
    },
  ];
```

- [ ] **Step 2: Cập nhật `seedTopics` — gán `orderIndex` + `unlockThresholdPercent`**

Tìm hàm `seedTopics`, thay nội dung upsert để gán 2 trường v2:

```typescript
async function seedTopics() {
  console.log("📚 Seeding Topics (4 chủ đề v2)...");

  for (const topic of TOPICS) {
    await prisma.topic.upsert({
      where: { id: topic.id },
      update: {
        name: topic.name,
        description: topic.description,
        orderIndex: topic.orderIndex,
        unlockThresholdPercent: topic.unlockThresholdPercent,
      },
      create: {
        id: topic.id,
        name: topic.name,
        description: topic.description,
        orderIndex: topic.orderIndex,
        unlockThresholdPercent: topic.unlockThresholdPercent,
      },
    });
  }

  console.log(`   ✓ ${TOPICS.length} Topics created (unlock: 0/80/80/80)`);
}
```

- [ ] **Step 3: Cập nhật `generateExercises` — sinh mode theo `getModesForTopic`**

Tìm hàm `generateExercises`, thay vòng lặp `for (const mode of EXERCISE_MODES)` bằng lọc mode theo topic của nhóm:

```typescript
  for (const sg of SOUND_GROUPS) {
    const mapId = `map-${sg.id}`;
    const content = getContentBySoundGroup(sg.id);
    const hasContent = Boolean(content && content.words.length > 0);
    const modesForTopic = getModesForTopic(sg.topicId); // v2: mode theo topic

    for (const mode of modesForTopic) {
      const exerciseId = generateExerciseId(sg.id, mode.id);
      const exerciseName = `${sg.name} - ${mode.name}`;

      await prisma.exercise.upsert({
        where: { id: exerciseId },
        update: {
          name: exerciseName,
          description: mode.description,
          status: hasContent ? "ACTIVE" : "DRAFT",
          topicId: sg.topicId,
          levelId: defaultLevel.id,
        },
        create: {
          id: exerciseId,
          name: exerciseName,
          description: mode.description,
          topicId: sg.topicId,
          levelId: defaultLevel.id,
          mapId: mapId,
          questionCount: 0,
          timeLimit: 300,
          status: hasContent ? "ACTIVE" : "DRAFT",
        },
      });

      totalExercises++;
    }
  }

  console.log(`   ✓ ${totalExercises} Exercises generated (topicId gán đúng, mode theo topic)`);
```

Thêm import `getModesForTopic` ở đầu file (sau các import từ `./lesson-catalog`):

```typescript
import {
  TOPICS,
  SOUND_GROUPS,
  EXERCISE_MODES,
  PHONEMES,
  getModesForTopic,
} from "./lesson-catalog";
```

- [ ] **Step 4: Dọn dữ liệu v1 cũ trước khi seed lại**

Vì v2 đổi topicId (`topic-1-monophthongs` → `topic-1-vowels` v.v.) và thêm nhóm, cần dọn DB để tránh rác v1 (topic cũ mồ côi, exercise gán topicId sai). Chạy cleanup rồi seed:

```bash
cd english_pronunciation_app\frontend
npx tsx prisma/db_cleanup.ts
npx tsx prisma/seed_lessons.ts
cd ..\..
```
Expected: seed log ra `4 Topics`, `44 Phonemes`, `30 SoundGroups`, `30 LearningMaps`, `112 Exercises` (5 nhóm content cũ vẫn seed words/pairs/sentences + QBI + questions).

- [ ] **Step 5: Verify DB counts bằng script tạm**

Tạo `frontend/prisma/_verify_sp2.ts`:

```typescript
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();
async function main() {
  const t = await prisma.topic.count();
  const sg = await prisma.soundGroup.count();
  const lm = await prisma.learningMap.count();
  const ex = await prisma.exercise.count();
  const qt = await prisma.questionType.count();
  const qbi = await prisma.questionBankItem.count();
  const q = await prisma.question.count();
  const exByTopic = await prisma.exercise.groupBy({ by: ["topicId"], _count: true, orderBy: { topicId: "asc" } });
  const topicUnlock = await prisma.topic.findMany({ select: { id: true, orderIndex: true, unlockThresholdPercent: true }, orderBy: { orderIndex: "asc" } });
  console.log("Counts: topic=" + t + " sg=" + sg + " map=" + lm + " exercise=" + ex + " qtype=" + qt + " qbi=" + qbi + " question=" + q);
  console.log("Exercise by topic:", exByTopic.map((r) => r.topicId + ":" + r._count).join(", "));
  console.log("Topic unlock:", topicUnlock.map((r) => r.id + "(ord=" + r.orderIndex + ",unlock=" + r.unlockThresholdPercent + ")").join(", "));
  // Asserts
  const ok = t === 4 && sg === 30 && lm === 30 && ex === 112 && qt === 7 && qbi > 0 && q > 0;
  console.log(ok ? "PASS ✅" : "FAIL ❌");
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
```

Run: `cd english_pronunciation_app\frontend && npx tsx prisma/_verify_sp2.ts`
Expected: `PASS ✅` với counts topic=4, sg=30, map=30, exercise=112, qtype=7; exercise by topic: `topic-1-vowels:40, topic-2-consonants:48, topic-3-minimal-pairs-hard:16, topic-4-stress-connected:8`; unlock `0/80/80/80`.

- [ ] **Step 6: Xóa script verify tạm**

```bash
cd english_pronunciation_app\frontend
del prisma\_verify_sp2.ts
cd ..\..
```

- [ ] **Step 7: Commit**

```bash
git add english_pronunciation_app/frontend/prisma/seed_lessons.ts
git commit -m "SP2.4: seed v2 - 4 QuestionType moi + topic unlock + shell 30 nhom/112 bai (5 nhom content cu giu)"
```

---

### Task 5: Quality gate

**Files:** không sửa, chỉ verify.

- [ ] **Step 1: prisma validate + generate**

```bash
cd english_pronunciation_app\frontend
npx prisma validate
npx prisma generate
cd ..\..
```
Expected: schema valid; generate thành công.

- [ ] **Step 2: tsc --noEmit**

```bash
cd english_pronunciation_app\frontend
npx tsc --noEmit --pretty false
cd ..\..
```
Expected: không output (pass).

- [ ] **Step 3: npm test**

```bash
cd english_pronunciation_app\frontend
npm test
cd ..\..
```
Expected: `pass 22` (14 cũ + 8 catalog mới), `fail 0`.

- [ ] **Step 4: npm run build**

```bash
cd english_pronunciation_app\frontend
npm run build
cd ..\..
```
Expected: `✓ Compiled successfully`, `✓ Generating static pages ... (24/24)`.

- [ ] **Step 5: Commit marker**

```bash
git commit --allow-empty -m "SP2.5: quality gate pass (validate + generate + tsc + 22 test + build)"
```

---

## Tiêu chí hoàn thành SP2

- [ ] Schema có 7 trường v2 (`orderIndex`, `unlockThresholdPercent`, `acceptedAnswers`×2, `syllables`, `stressIndex`, `wordStressType`).
- [ ] Catalog v2: 4 topic, 30 nhóm, 6 mode, 44 phoneme, 112 tổng bài.
- [ ] 8 test catalog pass + 14 test cũ pass = 22.
- [ ] DB sau seed: 4 topic (unlock 0/80/80/80), 30 nhóm, 30 map, 112 exercise, 7 QuestionType, 5 nhóm content cũ giữ (QBI + questions).
- [ ] Exercise by topic: 40/48/16/8.
- [ ] Quality gate 4 lệnh pass.
- [ ] XP/streak/badge/leaderboard/check-in KHÔNG bị đụng.

## Sau SP2

Chuyển sang brainstorm SP3 (Content + seed v2: content 25 nhóm mới + 4 nhóm CĐ4). SP2 cung cấp cấu trúc + shell sẵn sàng để SP3 điền content.
