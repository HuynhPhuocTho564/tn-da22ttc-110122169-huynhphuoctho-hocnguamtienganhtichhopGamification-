# SP3d — Content CĐ4 (4 nhóm Trọng âm & Nối âm) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Git policy:** Engineer KHÔNG tự commit. Mỗi task kết thúc checkpoint review với user; user tự commit khi convenient. Không chạy `git add`/`git commit`/`git push`.

**Goal:** Biên soạn content pilot 8 item/nhóm cho 4 nhóm CĐ4 (Word Stress / Weak Forms / Linking / Assimilation & Elision) = 32 item, sửa seed sinh Question cho 2 mode đặc thù (Mode A nghe/chọn + Mode B đọc/so khớp `acceptedAnswers`), re-seed flip DRAFT→ACTIVE + rút audio local g01, hoàn thiện 30/30 nhóm có content.

**Architecture:** Hướng A (spec `2026-06-19-sp3d-content-cd4-design.md`). Mở rộng `WordItemData` (+3 field) + `SentenceItemData` (+6 authoring field) trong `lesson-content.ts`; thêm 4 block content + 4 entry map. Sửa `seed_lessons.ts` (3 điểm): nới lỏng `hasContent` 3 chỗ (g02/3/4 sentences-only), `seedWordItems` truyền 3 field CĐ4, thêm `CD4_QTYPE_BY_GROUP` + 2 nhánh `generateQuestions` (mode A/B sinh Question trực tiếp từ content, bypass QuestionBankItem — đúng precedent nhánh listen_choose 3-stage `seed_lessons.ts:789-889`). TDD: mở rộng `lesson-content.test.ts` test CĐ4 trước (fail) → implement content → pass. UI render 4 dạng = SP4 (defer); SP3d verify DB-level + test.

**Tech Stack:** Next.js 16, React 18, TypeScript 6, Prisma 6, Tailwind 4, test runner `tsx --test` (Node `node:test` + `node:assert/strict`).

**Spec reference:** `docs/superpowers/specs/2026-06-19-sp3d-content-cd4-design.md`

**Codebase root note:** Source dưới `english_pronunciation_app/frontend/`. Mọi path tương đối từ `english_pronunciation_app/frontend/`. Chạy `npm`/`npx`/`tsx` từ `english_pronunciation_app/frontend/`.

**IPA quy ước:** GA (American rhotic), **không length mark** trong `ipa` (commit `17a70bf`). `targetPhonemes` dùng symbol có trong `PHONEMES` (`lesson-catalog.ts:214-262`, có length mark cho nguyên âm dài `/ɑː/` `/ɔː/` `/uː/` `/ɜː/`, `/əʊ/` cho GO vowel) — 2 field độc lập, giống codebase hiện tại.

**⚠️ Refinement so với spec (cần useraware):** Spec section 2.2 viết "không thêm field type" cho `SentenceItemData`, nhưng nhánh seed cần `weakWords`/`linkingPairs`/`assimilationType`/`assimOriginal`/`assimResult`/`acceptedAnswers` từ đâu đó để build `Question.contentJson`. Plan thêm 6 field **optional** vào `SentenceItemData` (TypeScript authoring field, KHÔNG phải cột DB — `seedSentenceItems` `seed_lessons.ts:377-402` chỉ đọc `sentence/targetWords/difficulty/status/sourceType/reviewNote`, bỏ qua field mới; SentenceItem DB không có cột này). Điều này bảo toàn ý định thực sự của spec (không migration; structure encode trong `Question.contentJson`) và DRY (author ở 1 chỗ). Nếu user không đồng ý, dùng approach Y (lookup riêng) — flag lại ở checkpoint Task 1.

**Batch split:** Plan chia 2 batch (review + commit giữa). Batch 1: g01 Word Stress + g02 Weak Forms (Task 1-6). Batch 2: g03 Linking + g04 Assimilation (Task 7-10). Sửa seed (Task 5) generic cho cả 4 nhóm (qua `CD4_QTYPE_BY_GROUP` + nhánh theo `sg.id`) → sau Batch 1 g03/g04 DRAFT (content rỗng), sau Batch 2 ACTIVE.

---

## File Structure

| Hành động | File | Trách nhiệm |
|---|---|---|
| sửa | `prisma/lesson-content.ts` | +3 field `WordItemData` +6 field `SentenceItemData`; +4 block content (`WORDS_T4_G01_WORD_STRESS`, `SENTENCES_T4_G02_WEAK/03_LINKING/04_ASSIM`) +4 entry `LESSON_CONTENT_BY_SOUND_GROUP` |
| sửa | `prisma/seed_lessons.ts` | Sửa 1: nới lỏng `hasContent` 3 chỗ (`:662`,`:694`,`:780`). Sửa 2: +`CD4_QTYPE_BY_GROUP` +2 nhánh `generateQuestions` (mode A/B). Sửa 3: `seedWordItems` truyền `syllables`/`stressIndex`/`wordStressType` |
| sửa | `src/lib/__tests__/lesson-content.test.ts` | +5 test CĐ4 (chia 2 batch: Batch 1 g01/g02/total, Batch 2 g03/g04/all-4) |
| chạy (không sửa) | `prisma/db_cleanup.ts` → `seed_lessons.ts` (`npm run db:seed:lessons`) | re-seed idempotent |
| chạy (không sửa) | `prisma/seed_audio_local.ts` | rút mp3 local 8 từ g01 (idempotent) |

**Decomposition rationale:** Batch 1: Task 1 type (scaffolding, không behavior) → Task 2 test fail → Task 3-4 content g01/g02 (test pass) → Task 5 sửa seed → Task 6 re-seed + audio + quality gate. Batch 2: Task 7 test fail (g03/g04) → Task 8-9 content g03/g04 → Task 10 re-seed + quality gate. Test chia 2 batch để quality gate mỗi batch xanh (g03/g04 test chỉ thêm khi content có).

**Type reminder:** Field authored `exampleSentence` (word → seed map `meaningVi` `seed_lessons.ts:318`), `translation` (sentence). g01 word thêm `syllables`/`stressIndex`/`wordStressType` (lưu DB WordItem). g02/3/4 sentence thêm `weakWords`/`linkingPairs`/`assimilationType`/`assimOriginal`/`assimResult`/`acceptedAnswers` (authoring, seed build Question.contentJson, KHÔNG lưu SentenceItem DB).

---

## Batch 1 — g01 Word Stress + g02 Weak Forms

### Task 1: Type extension (scaffolding — không behavior)

**Files:**
- Modify: `prisma/lesson-content.ts` (`WordItemData` line 14-26, `SentenceItemData` line 44-56)

- [ ] **Step 1: Thêm 3 field optional vào `WordItemData`**

Trong `prisma/lesson-content.ts`, sửa `WordItemData` (line 14-26). Thêm 3 field trước dấu `};` đóng (sau `reviewNote?: string;`):
```ts
export type WordItemData = {
  word: string;
  ipa: string;
  soundGroupId: string;
  targetPhonemes: string[];
  difficulty: number;
  audioUrl?: string;
  exampleSentence?: string;
  status: "ACTIVE" | "DRAFT" | "NEEDS_REVIEW";
  sourceType: "MANUAL" | "FREE_API" | "LICENSED";
  sourceUrl?: string;
  reviewNote?: string;
  // v2 CĐ4: cho Word Stress (UI tap-stress). Lưu DB WordItem (schema đã có cột).
  syllables?: string[];
  stressIndex?: number;
  wordStressType?: "WORD_STRESS" | "WEAK_FORM" | "LINKING" | "ASSIMILATION";
};
```

- [ ] **Step 2: Thêm 6 field optional vào `SentenceItemData`**

Sửa `SentenceItemData` (line 44-56). Thêm 6 field trước dấu `};` đóng (sau `reviewNote?: string;`):
```ts
export type SentenceItemData = {
  sentence: string;
  soundGroupId: string;
  targetWords: string[];
  targetPhonemes: string[];
  difficulty: number;
  ipa?: string;
  audioUrl?: string;
  translation?: string;
  status: "ACTIVE" | "DRAFT" | "NEEDS_REVIEW";
  sourceType: "MANUAL" | "FREE_API" | "LICENSED";
  sourceUrl?: string;
  reviewNote?: string;
  // v2 CĐ4: authoring field (KHÔNG lưu DB SentenceItem — seed build Question.contentJson từ đây)
  weakWords?: string[];
  linkingPairs?: string[][];
  assimilationType?: string;
  assimOriginal?: string;
  assimResult?: string;
  acceptedAnswers?: string[];
};
```

- [ ] **Step 3: Verify tsc**
```bash
npx tsc --noEmit
```
Expected: 0 error (thêm optional field không break code hiện có — field mới đều optional).

- [ ] **Step 4: Verify test hiện tại vẫn pass (no regression)**
```bash
npx tsx --test "src/lib/__tests__/lesson-content.test.ts"
```
Expected: ALL test cũ pass (CD1/CD2/pilot — type extension không đổi behavior).

- [ ] **Step 5: Checkpoint review với user**

Báo user: type extension xong (WordItemData +3, SentenceItemData +6 optional field), tsc 0 error, test cũ pass. **Flag refinement SentenceItemData** (mục ⚠️ header) — user OK thì tiếp Task 2.

---

### Task 2: Test TDD Batch 1 — g01 + g02 + total (fail trước)

**Files:**
- Modify: `src/lib/__tests__/lesson-content.test.ts`

- [ ] **Step 1: Thêm 3 test CĐ4 Batch 1 vào cuối file**

Thêm vào cuối `src/lib/__tests__/lesson-content.test.ts` (sau test cuối "pilot nhóm map-t1-g01-i-ih...ipa RP"):
```ts
// ===== SP3d Batch 1: CĐ4 (g01 Word Stress + g02 Weak Forms) =====

test("Word Stress (g01): 8 từ, mỗi từ có syllables >=2 + stressIndex + wordStressType WORD_STRESS + targetPhonemes không rỗng", () => {
  const content = getContentBySoundGroup("map-t4-g01-word-stress");
  assert.ok(content, "g01 phải có content");
  assert.ok(content!.words.length >= 8, `g01 words >= 8 (hiện ${content!.words.length})`);
  for (const w of content!.words) {
    assert.ok(w.syllables && w.syllables.length >= 2, `${w.word} thiếu syllables >= 2`);
    assert.ok(typeof w.stressIndex === "number" && w.stressIndex >= 0, `${w.word} thiếu stressIndex hợp lệ`);
    assert.equal(w.wordStressType, "WORD_STRESS", `${w.word} wordStressType sai`);
    assert.ok(w.targetPhonemes.length > 0, `${w.word} thiếu targetPhonemes (bắt buộc cho phonemeId)`);
    assert.ok(w.ipa.startsWith("/"), `${w.word} ipa phải bắt đầu /`);
  }
});

test("Weak Forms (g02): 8 câu, mỗi câu có ipa bắt đầu / + targetPhonemes chứa /ə/", () => {
  const content = getContentBySoundGroup("map-t4-g02-weak-forms");
  assert.ok(content, "g02 phải có content");
  assert.ok(content!.sentences.length >= 8, `g02 sentences >= 8 (hiện ${content!.sentences.length})`);
  for (const s of content!.sentences) {
    assert.ok(s.ipa, `g02 sentence "${s.sentence}" thiếu ipa`);
    assert.ok(s.ipa!.startsWith("/"), `g02 ipa "${s.ipa}" phải bắt đầu /`);
    assert.ok(s.targetPhonemes.includes("/ə/"), `g02 sentence "${s.sentence}" thiếu /ə/`);
  }
});

test("tổng số nhóm có content >= 26 (10 CD1 + 2 legacy CD3 + 12 CD2 + 2 CD4 Batch 1)", () => {
  assert.ok(Object.keys(LESSON_CONTENT_BY_SOUND_GROUP).length >= 26, `Ít nhất 26 nhóm content (hiện ${Object.keys(LESSON_CONTENT_BY_SOUND_GROUP).length})`);
});
```

- [ ] **Step 2: Chạy test verify fail**
```bash
npx tsx --test "src/lib/__tests__/lesson-content.test.ts"
```
Expected: 3 test mới FAIL — "g01 phải có content" undefined, "g02 phải có content" undefined, total < 26 (hiện 24). Test cũ pass.

- [ ] **Step 3: Verify tsc**
```bash
npx tsc --noEmit
```
Expected: 0 error (test truy cập `w.syllables`/`w.stressIndex`/`w.wordStressType`/`s.ipa` — field đã có ở Task 1).

- [ ] **Step 4: Checkpoint review với user**

Báo user: 3 test CĐ4 Batch 1 thêm, fail đúng (content chưa có). Review rồi tiếp Task 3.

---

### Task 3: Content g01 Word Stress (8 từ) + entry map

**Files:**
- Modify: `prisma/lesson-content.ts` (thêm block `WORDS_T4_G01_WORD_STRESS` + entry map)

**Context:** g01 dùng **WordItems** (UI tap-stress render `syllables`). Mỗi từ phải có `targetPhonemes[0]` = symbol `PHONEMES` tồn tại (vì `WordItem.phonemeId` bắt buộc, `seedWordItems` `seed_lessons.ts:276-282` lookup phoneme → bỏ qua nếu không khớp). `targetPhonemes` = nguyên âm của âm tiết nhấn. Cặp photograph/photographer = stress-shift kinh điển (2 chính tả → audio phân biệt). KHÔNG dùng cặp noun/verb cùng chính tả (record/present) — audio mơ hồ cho Mode A.

- [ ] **Step 1: Thêm block g01 trước `// EXPORTS`**

Tìm dòng `// ============ EXPORTS` (khoảng line 1425, trước `export const LESSON_CONTENT_BY_SOUND_GROUP`). Thêm vào trước nó:
```ts
// ============================================================================
// TOPIC 4 - NHÓM 1: Word Stress (CĐ4) — Mode A: tap-stress / Mode B: đọc từ
// ============================================================================

export const WORDS_T4_G01_WORD_STRESS: WordItemData[] = [
  { word: "photograph", ipa: "/ˈfoʊtəɡræf/", soundGroupId: "map-t4-g01-word-stress", targetPhonemes: ["/əʊ/"], difficulty: 4, exampleSentence: "Take a photograph of the view.", status: "ACTIVE", sourceType: "FREE_API", syllables: ["pho","to","graph"], stressIndex: 0, wordStressType: "WORD_STRESS", reviewNote: "Stress syllable 1 (pho) — cặp với photographer (stress shift)" },
  { word: "photographer", ipa: "/fəˈtɑɡrəfər/", soundGroupId: "map-t4-g01-word-stress", targetPhonemes: ["/ɑː/"], difficulty: 5, exampleSentence: "She is a wedding photographer.", status: "ACTIVE", sourceType: "FREE_API", syllables: ["pho","tog","ra","pher"], stressIndex: 1, wordStressType: "WORD_STRESS", reviewNote: "Stress syllable 2 (tog) — stress shift vs photograph" },
  { word: "balloon", ipa: "/bəˈlun/", soundGroupId: "map-t4-g01-word-stress", targetPhonemes: ["/uː/"], difficulty: 3, exampleSentence: "The balloon floats up.", status: "ACTIVE", sourceType: "FREE_API", syllables: ["ba","lloon"], stressIndex: 1, wordStressType: "WORD_STRESS" },
  { word: "guitar", ipa: "/ɡɪˈtɑr/", soundGroupId: "map-t4-g01-word-stress", targetPhonemes: ["/ɑː/"], difficulty: 3, exampleSentence: "He plays the guitar.", status: "ACTIVE", sourceType: "FREE_API", syllables: ["gui","tar"], stressIndex: 1, wordStressType: "WORD_STRESS" },
  { word: "hotel", ipa: "/hoʊˈtɛl/", soundGroupId: "map-t4-g01-word-stress", targetPhonemes: ["/e/"], difficulty: 3, exampleSentence: "We stayed at a hotel.", status: "ACTIVE", sourceType: "FREE_API", syllables: ["ho","tel"], stressIndex: 1, wordStressType: "WORD_STRESS" },
  { word: "tomorrow", ipa: "/təˈmɔroʊ/", soundGroupId: "map-t4-g01-word-stress", targetPhonemes: ["/ɔː/"], difficulty: 4, exampleSentence: "See you tomorrow.", status: "ACTIVE", sourceType: "FREE_API", syllables: ["to","mor","row"], stressIndex: 1, wordStressType: "WORD_STRESS" },
  { word: "banana", ipa: "/bəˈnænə/", soundGroupId: "map-t4-g01-word-stress", targetPhonemes: ["/æ/"], difficulty: 4, exampleSentence: "I eat a banana for breakfast.", status: "ACTIVE", sourceType: "FREE_API", syllables: ["ba","na","na"], stressIndex: 1, wordStressType: "WORD_STRESS" },
  { word: "computer", ipa: "/kəmˈpjutər/", soundGroupId: "map-t4-g01-word-stress", targetPhonemes: ["/uː/"], difficulty: 4, exampleSentence: "Turn on the computer.", status: "ACTIVE", sourceType: "FREE_API", syllables: ["com","pu","ter"], stressIndex: 1, wordStressType: "WORD_STRESS" },
];
```

- [ ] **Step 2: Thêm entry g01 vào `LESSON_CONTENT_BY_SOUND_GROUP`**

Trong object `LESSON_CONTENT_BY_SOUND_GROUP` (sau entry `"map-t2-g12-w-j"` cuối, trước dấu `}` đóng object), thêm:
```ts
  "map-t4-g01-word-stress": {
    words: WORDS_T4_G01_WORD_STRESS,
    minimalPairs: [],
    sentences: [],
  },
```

- [ ] **Step 3: Chạy test verify g01 pass**
```bash
npx tsx --test "src/lib/__tests__/lesson-content.test.ts"
```
Expected: test "Word Stress (g01)" PASS. test "Weak Forms (g02)" vẫn FAIL (g02 chưa có). test "total >= 26" PASS (24 + 1 = 25? **CHÚ Ý**: thêm 1 group → 25, test `>= 26` vẫn FAIL). → g01 test pass, 2 test còn fail. Đây là tiến độ đúng (Task 3 chỉ thêm g01).

- [ ] **Step 4: Verify tsc**
```bash
npx tsc --noEmit
```
Expected: 0 error.

- [ ] **Step 5: Checkpoint review với user**

Báo user: g01 Word Stress (8 từ) content done, test g01 pass. Review rồi tiếp Task 4.

---

### Task 4: Content g02 Weak Forms (8 câu) + entry map

**Files:**
- Modify: `prisma/lesson-content.ts` (thêm block `SENTENCES_T4_G02_WEAK` + entry map)

**Context:** g02 dùng **SentenceItems** (không phonemeId). `weakWords` = từ lướt `/ə/` (đáp án Mode A). `acceptedAnswers` = dạng contraction + đầy đủ (Mode B multi); nếu không có contraction → bỏ field (Mode B đơn trị). `targetPhonemes: ["/ə/"]` (catalog g02 đã set). `targetWords` = weakWords.

- [ ] **Step 1: Thêm block g02 sau block g01** (trước `// EXPORTS`)
```ts
// ============================================================================
// TOPIC 4 - NHÓM 2: Weak Forms (CĐ4) — Mode A: choose-weak / Mode B: đọc câu
// ============================================================================

export const SENTENCES_T4_G02_WEAK: SentenceItemData[] = [
  { sentence: "I'm going to the shop.", soundGroupId: "map-t4-g02-weak-forms", targetWords: ["to","the"], targetPhonemes: ["/ə/"], difficulty: 5, ipa: "/aɪm ˈɡoʊɪŋ tə ðə ˈʃɑp/", translation: "Tôi đang đi tới cửa hàng.", status: "ACTIVE", sourceType: "MANUAL", weakWords: ["to","the"], acceptedAnswers: ["I'm going to the shop", "I am going to the shop"], reviewNote: "to→/tə/, the→/ðə/ weak; Mode B accept I'm/I am" },
  { sentence: "What do you want?", soundGroupId: "map-t4-g02-weak-forms", targetWords: ["do"], targetPhonemes: ["/ə/"], difficulty: 4, ipa: "/wʌt də ju ˈwɑnt/", translation: "Bạn muốn gì?", status: "ACTIVE", sourceType: "MANUAL", weakWords: ["do"], reviewNote: "do→/də/ weak" },
  { sentence: "Can I have a coffee?", soundGroupId: "map-t4-g02-weak-forms", targetWords: ["a"], targetPhonemes: ["/ə/"], difficulty: 4, ipa: "/kən aɪ hæv ə ˈkɑfi/", translation: "Tôi có thể lấy một cốc cà phê không?", status: "ACTIVE", sourceType: "MANUAL", weakWords: ["a"], reviewNote: "a→/ə/ weak" },
  { sentence: "She's at the bus stop.", soundGroupId: "map-t4-g02-weak-forms", targetWords: ["at","the"], targetPhonemes: ["/ə/"], difficulty: 5, ipa: "/ʃiz ət ðə ˈbʌs stɑp/", translation: "Cô ấy ở trạm xe buýt.", status: "ACTIVE", sourceType: "MANUAL", weakWords: ["at","the"], acceptedAnswers: ["She's at the bus stop", "She is at the bus stop"], reviewNote: "at→/ət/, the→/ðə/ weak; Mode B accept She's/She is" },
  { sentence: "A cup of tea, please.", soundGroupId: "map-t4-g02-weak-forms", targetWords: ["a","of"], targetPhonemes: ["/ə/"], difficulty: 5, ipa: "/ə ˈkʌp əv ˈti pliz/", translation: "Một tách trà, làm ơn.", status: "ACTIVE", sourceType: "MANUAL", weakWords: ["a","of"], reviewNote: "a→/ə/, of→/əv/ weak" },
  { sentence: "It's for you and me.", soundGroupId: "map-t4-g02-weak-forms", targetWords: ["for","and"], targetPhonemes: ["/ə/"], difficulty: 5, ipa: "/ɪts fər ju ən ˈmi/", translation: "Nó dành cho bạn và tôi.", status: "ACTIVE", sourceType: "MANUAL", weakWords: ["for","and"], acceptedAnswers: ["It's for you and me", "It is for you and me"], reviewNote: "for→/fər/, and→/ən/ weak; Mode B accept It's/It is" },
  { sentence: "There is a book on the table.", soundGroupId: "map-t4-g02-weak-forms", targetWords: ["is","a","the"], targetPhonemes: ["/ə/"], difficulty: 6, ipa: "/ðɛr ɪz ə ˈbʊk ən ðə ˈtebəl/", translation: "Có một quyển sách trên bàn.", status: "ACTIVE", sourceType: "MANUAL", weakWords: ["is","a","the"], acceptedAnswers: ["There is a book on the table", "There's a book on the table"], reviewNote: "is/a/the weak; Mode B accept There is/There's" },
  { sentence: "What are you doing?", soundGroupId: "map-t4-g02-weak-forms", targetWords: ["are"], targetPhonemes: ["/ə/"], difficulty: 5, ipa: "/wʌt ər ju ˈduɪŋ/", translation: "Bạn đang làm gì?", status: "ACTIVE", sourceType: "MANUAL", weakWords: ["are"], reviewNote: "are→/ər/ weak" },
];
```

- [ ] **Step 2: Thêm entry g02 vào `LESSON_CONTENT_BY_SOUND_GROUP`** (sau entry g01)
```ts
  "map-t4-g02-weak-forms": {
    words: [],
    minimalPairs: [],
    sentences: SENTENCES_T4_G02_WEAK,
  },
```

- [ ] **Step 3: Chạy test verify Batch 1 test pass**
```bash
npx tsx --test "src/lib/__tests__/lesson-content.test.ts"
```
Expected: TẤT CẢ test pass (cũ + 3 mới Batch 1). test "Weak Forms (g02)" PASS. test "total >= 26" PASS (24 + 2 = 26). test "Word Stress (g01)" PASS (Task 3).

- [ ] **Step 4: Verify tsc**
```bash
npx tsc --noEmit
```
Expected: 0 error.

- [ ] **Step 5: Checkpoint review với user**

Báo user: g02 Weak Forms (8 câu) content done, 3 test Batch 1 pass. Review rồi tiếp Task 5 (sửa seed — task kỹ thuật chính).

---

### Task 5: Sửa seed_lessons.ts (3 điểm + CD4_QTYPE_BY_GROUP + 2 nhánh generateQuestions)

**Files:**
- Modify: `prisma/seed_lessons.ts`

**Context:** Đây là task kỹ thuật chính, rủi ro cao nhất. 3 sửa từ spec section 3 + thêm `CD4_QTYPE_BY_GROUP` + 2 nhánh `generateQuestions` (sinh Question CĐ4 trực tiếp từ content, bypass QuestionBankItem — precedent nhánh listen_choose 3-stage `seed_lessons.ts:789-889`). Guard `sg.topicId === "topic-4-stress-connected"` + `continue` → không ảnh hưởng CĐ1-3.

- [ ] **Step 1: Thêm `CD4_QTYPE_BY_GROUP` (module-level, sau `mapDifficulty` ~line 71)**

Trong `prisma/seed_lessons.ts`, sau hàm `mapDifficulty` (line 67-71), thêm:
```ts
// v2 CĐ4: map nhóm CĐ4 → QuestionType cụ thể (override catalog placeholder mode_a questionTypeId)
const CD4_QTYPE_BY_GROUP: Record<string, string> = {
  "map-t4-g01-word-stress": "qtype-4-tap-stress",
  "map-t4-g02-weak-forms": "qtype-5-choose-weak",
  "map-t4-g03-linking": "qtype-6-choose-linking",
  "map-t4-g04-assimilation": "qtype-7-choose-assimilation",
};
```

- [ ] **Step 2: Sửa 1a — nới lỏng `hasContent` trong `generateLearningMaps` (line 662)**

Tìm trong `generateLearningMaps` (khoảng line 662):
```ts
    const hasContent = Boolean(content && content.words.length > 0);
```
Sửa thành:
```ts
    const hasContent = Boolean(content && (content.words.length > 0 || content.sentences.length > 0));
```

- [ ] **Step 3: Sửa 1b — nới lỏng `hasContent` trong `generateExercises` (line 694)**

Tìm trong `generateExercises` (khoảng line 694):
```ts
    const hasContent = Boolean(content && content.words.length > 0);
```
Sửa thành:
```ts
    const hasContent = Boolean(content && (content.words.length > 0 || content.sentences.length > 0));
```
(Lưu ý: có 2 dòng `const hasContent = Boolean(content && content.words.length > 0);` giống hệt — dòng 662 và 694. Dùng `replace_all: true` HOẶC sửa từng dòng với context xung quanh để unique. Engineer: sửa cả 2.)

- [ ] **Step 4: Sửa 1c — nới lỏng guard trong `generateQuestions` (line 780)**

Tìm trong `generateQuestions` (khoảng line 779-780):
```ts
    const content = getContentBySoundGroup(sg.id);
    if (!content || content.words.length === 0) continue;
```
Sửa thành:
```ts
    const content = getContentBySoundGroup(sg.id);
    if (!content || (content.words.length === 0 && content.sentences.length === 0)) continue;
```

- [ ] **Step 5: Sửa 3 — `seedWordItems` truyền 3 field CĐ4 (line 303-334)**

Tìm hàm `seedWordItems`, khối `await prisma.wordItem.upsert({...})`. Trong cả `update:` và `create:` thêm 3 field (sau `reviewNote: word.reviewNote ?? null,`):
```ts
        syllables: word.syllables ? JSON.parse(JSON.stringify(word.syllables)) : null,
        stressIndex: word.stressIndex ?? null,
        wordStressType: word.wordStressType ?? null,
```
Cả `update` và `create` đều thêm 3 dòng này (cùng nội dung). Field đã có cột schema (`WordItem.syllables Json? / stressIndex Int? / wordStressType String?`).

- [ ] **Step 6: Sửa 2a — thêm nhánh Mode A trong `generateQuestions` (sau nhánh listen_choose 3-stage, trước nhánh bank)**

Tìm kết thúc nhánh listen_choose 3-stage (khoảng line 889-890):
```ts
        continue; // skip nhánh bank cũ (word-mode) — unreachable cho listen_choose CĐ1-3
      }
```
Ngay sau dấu `}` đó (và trước dòng `// Lấy QuestionBankItem ACTIVE...` ~line 892), thêm nhánh Mode A:
```ts

      // === v2 CĐ4 Mode A (mode_a_listen_choose): sinh Question trực tiếp từ content (bypass bank) ===
      if (mode.id === "mode_a_listen_choose" && sg.topicId === "topic-4-stress-connected") {
        const cd4QtypeId = CD4_QTYPE_BY_GROUP[sg.id];
        if (!cd4QtypeId) {
          await prisma.exercise.update({ where: { id: exerciseId }, data: { status: "DRAFT", questionCount: 0 } });
          continue;
        }
        await prisma.question.deleteMany({ where: { exerciseId } }); // idempotent
        let qIdx = 1;

        if (sg.id === "map-t4-g01-word-stress") {
          // Word Stress: iterate words (có audio), tap-stress question
          for (const w of content.words) {
            const wordItem = await prisma.wordItem.findFirst({ where: { word: w.word, ipa: w.ipa } });
            if (!wordItem || wordItem.status !== "ACTIVE" || !wordItem.audioUrl) continue;
            const questionId = generateQuestionId(exerciseId, qIdx);
            const contentJson = JSON.stringify({
              mode: "mode_a_listen_choose",
              qtype: "tap-stress",
              word: w.word,
              ipa: w.ipa,
              syllables: w.syllables ?? [],
              stressIndex: w.stressIndex ?? 0,
              audioUrl: wordItem.audioUrl,
            });
            await prisma.question.upsert({
              where: { id: questionId },
              update: { name: `Q${qIdx}`, content: contentJson, answer: String(w.stressIndex ?? 0), score: 10, status: "ACTIVE", typeId: qtypeMap[cd4QtypeId].id },
              create: { id: questionId, name: `Q${qIdx}`, content: contentJson, answer: String(w.stressIndex ?? 0), score: 10, status: "ACTIVE", typeId: qtypeMap[cd4QtypeId].id, exerciseId },
            });
            // AnswerOption = mỗi âm tiết (user bấm 1 — single select, scoring SP4)
            await prisma.answerOption.deleteMany({ where: { questionId } });
            const syls = w.syllables ?? [];
            for (let i = 0; i < syls.length; i++) {
              await prisma.answerOption.create({ data: { content: syls[i], questionId } });
            }
            qIdx++;
            totalQuestions++;
          }
        } else {
          // g02 weak / g03 linking / g04 assimilation: iterate sentences
          for (const s of content.sentences) {
            const questionId = generateQuestionId(exerciseId, qIdx);
            let contentJson: string;
            let answer: string;
            const options: string[] = [];

            if (sg.id === "map-t4-g02-weak-forms") {
              const weakWords = s.weakWords ?? [];
              contentJson = JSON.stringify({ mode: "mode_a_listen_choose", qtype: "choose-weak", sentence: s.sentence, ipa: s.ipa ?? "", weakWords, audioUrl: null });
              answer = weakWords.join(",");
              options.push(...s.sentence.replace(/[.,!?]/g, "").split(/\s+/).filter(Boolean));
            } else if (sg.id === "map-t4-g03-linking") {
              const linkingPairs = s.linkingPairs ?? [];
              contentJson = JSON.stringify({ mode: "mode_a_listen_choose", qtype: "choose-linking", sentence: s.sentence, ipa: s.ipa ?? "", linkingPairs, audioUrl: null });
              answer = linkingPairs.map((p) => p.join("→")).join(",");
              const words = s.sentence.replace(/[.,!?]/g, "").split(/\s+/).filter(Boolean);
              for (let i = 0; i < words.length - 1; i++) options.push(`${words[i]}→${words[i + 1]}`);
            } else {
              // g04 assimilation
              contentJson = JSON.stringify({ mode: "mode_a_listen_choose", qtype: "choose-assimilation", sentence: s.sentence, ipa: s.ipa ?? "", assimilationType: s.assimilationType ?? "", original: s.assimOriginal ?? "", result: s.assimResult ?? "", audioUrl: null });
              answer = s.assimResult ?? "";
              options.push(s.assimResult ?? "", s.assimOriginal ?? "");
            }

            await prisma.question.upsert({
              where: { id: questionId },
              update: { name: `Q${qIdx}`, content: contentJson, answer, score: 10, status: "ACTIVE", typeId: qtypeMap[cd4QtypeId].id },
              create: { id: questionId, name: `Q${qIdx}`, content: contentJson, answer, score: 10, status: "ACTIVE", typeId: qtypeMap[cd4QtypeId].id, exerciseId },
            });
            await prisma.answerOption.deleteMany({ where: { questionId } });
            for (const opt of options) {
              await prisma.answerOption.create({ data: { content: opt, questionId } });
            }
            qIdx++;
            totalQuestions++;
          }
        }

        const countA = qIdx - 1;
        await prisma.exercise.update({ where: { id: exerciseId }, data: { questionCount: countA, status: countA > 0 ? "ACTIVE" : "DRAFT" } });
        console.log(`   ✓ ${sg.id} mode_a: ${countA} câu`);
        continue; // skip nhánh bank — CĐ4 không qua QuestionBankItem
      }

      // === v2 CĐ4 Mode B (mode_b_speak_match): đọc từ/câu, acceptedAnswers multi (g02) ===
      if (mode.id === "mode_b_speak_match" && sg.topicId === "topic-4-stress-connected") {
        await prisma.question.deleteMany({ where: { exerciseId } }); // idempotent
        let qIdx = 1;

        if (sg.id === "map-t4-g01-word-stress") {
          // Đọc từ đúng trọng âm
          for (const w of content.words) {
            const wordItem = await prisma.wordItem.findFirst({ where: { word: w.word, ipa: w.ipa } });
            if (!wordItem) continue;
            const questionId = generateQuestionId(exerciseId, qIdx);
            const contentJson = JSON.stringify({
              mode: "mode_b_speak_match",
              word: w.word,
              ipa: w.ipa,
              syllables: w.syllables ?? [],
              stressIndex: w.stressIndex ?? 0,
              audioUrl: wordItem.audioUrl ?? null,
            });
            await prisma.question.upsert({
              where: { id: questionId },
              update: { name: `Q${qIdx}`, content: contentJson, answer: w.word, score: 15, status: "ACTIVE", typeId: qtypeMap["qtype-2-voice"].id, acceptedAnswers: null },
              create: { id: questionId, name: `Q${qIdx}`, content: contentJson, answer: w.word, score: 15, status: "ACTIVE", typeId: qtypeMap["qtype-2-voice"].id, exerciseId, acceptedAnswers: null },
            });
            qIdx++;
            totalQuestions++;
          }
        } else {
          // g02/3/4: đọc câu, acceptedAnswers multi (g02) hoặc đơn (g03/4 → null)
          for (const s of content.sentences) {
            const questionId = generateQuestionId(exerciseId, qIdx);
            const contentJson = JSON.stringify({
              mode: "mode_b_speak_match",
              sentence: s.sentence,
              ipa: s.ipa ?? "",
              acceptedAnswers: s.acceptedAnswers ?? undefined,
            });
            const accepted = s.acceptedAnswers && s.acceptedAnswers.length > 0
              ? JSON.parse(JSON.stringify(s.acceptedAnswers))
              : null;
            await prisma.question.upsert({
              where: { id: questionId },
              update: { name: `Q${qIdx}`, content: contentJson, answer: s.sentence, score: 20, status: "ACTIVE", typeId: qtypeMap["qtype-2-voice"].id, acceptedAnswers: accepted },
              create: { id: questionId, name: `Q${qIdx}`, content: contentJson, answer: s.sentence, score: 20, status: "ACTIVE", typeId: qtypeMap["qtype-2-voice"].id, exerciseId, acceptedAnswers: accepted },
            });
            qIdx++;
            totalQuestions++;
          }
        }

        const countB = qIdx - 1;
        await prisma.exercise.update({ where: { id: exerciseId }, data: { questionCount: countB, status: countB > 0 ? "ACTIVE" : "DRAFT" } });
        console.log(`   ✓ ${sg.id} mode_b: ${countB} câu`);
        continue; // skip nhánh bank
      }
```

- [ ] **Step 7: Verify tsc**
```bash
npx tsc --noEmit
```
Expected: 0 error. (Nếu lỗi `acceptedAnswers` type Json null — thử thay `null` bằng `Prisma.DbNull`: import `{ Prisma }` đã có qua `@prisma/client`? Hiện file import `PrismaClient` only. Nếu cần, thêm `acceptedAnswers: accepted === null ? (Prisma.DbNull as unknown as null) : accepted` — nhưng `null` thường OK cho Json?. Engineer verify theo output tsc.)

- [ ] **Step 8: Verify test không regression**
```bash
npx tsx --test "src/lib/__tests__/lesson-content.test.ts"
```
Expected: ALL pass (sửa seed không đụng lesson-content.ts test).

- [ ] **Step 9: Checkpoint review với user**

Báo user: seed_lessons.ts sửa xong (CD4_QTYPE_BY_GROUP + hasContent ×3 + seedWordItems +3 field + 2 nhánh generateQuestions mode A/B), tsc 0 error, test pass. Review rồi tiếp Task 6 (re-seed + verify).

---

### Task 6: Re-seed + rút audio local + quality gate (Batch 1 verify)

**Files:**
- Chạy (không sửa): `prisma/db_cleanup.ts`, `prisma/seed_lessons.ts`, `prisma/seed_audio_local.ts`

- [ ] **Step 1: Verify schema**
```bash
npx prisma validate
```
Expected: "schema valid". (Không sửa schema SP3d, chỉ verify.)

- [ ] **Step 2: Clean DB + re-seed**
```bash
npx tsx prisma/db_cleanup.ts
npm run db:seed:lessons
```
Expected: `db_cleanup` truncate tất cả bảng (idempotent). `seed_lessons` chạy — log: `📝 Lesson Content loaded: N Sound Groups with data` — N phải >= 26 (24 cũ + 2 CD4 Batch 1). generateExercises flip g01/g02 DRAFT→ACTIVE (g03/g04 vẫn DRAFT — content rỗng). generateQuestions log `✓ map-t4-g01-word-stress mode_a: 8 câu` (sau khi có audio) + `mode_b: 8 câu`, `✓ map-t4-g02-weak-forms mode_a: 8 câu` + `mode_b: 8 câu`. g03/g04 log `mode_a: 0 câu` + `mode_b: 0 câu` → DRAFT (đúng — Batch 2).

Lưu ý: g01 mode_a cần từ ACTIVE (có audio) — nếu seed_lessons chạy TRƯỚC seed_audio_local, từ g01 chưa có audio local → `wordItem.audioUrl` là URL remote (Free Dictionary API, fetch trong seedWordItems) → vẫn ACTIVE (seedWordItems set ACTIVE nếu fetchAudioUrl thành công). mode_a dùng `wordItem.audioUrl` (remote hoặc local). Sau Step 3 (audio local) → audioUrl = local. OK.

Nếu log N < 26 → có nhóm CD4 chưa vào map. Kiểm tra Task 3/4 Step 2 đã thêm 2 entry.

- [ ] **Step 3: Rút audio local cho 8 từ g01**
```bash
npx tsx prisma/seed_audio_local.ts
```
Expected: Script query `WordItem sourceType="FREE_API"` (gồm 8 từ g01 mới + ~240 từ CD1/CD2 cũ). Skip file đã có (CD1/CD2), fetch Free Dictionary API cho 8 từ g01 → tải `/audio/{word}.mp3`, update DB audioUrl local. Log: "✓ X từ tải mới, Y skip, Z fail". 8 từ g01 đa số thành công (photograph/photographer/balloon/guitar/hotel/tomorrow/banana/computer — từ common, API có audio). Nếu vài fail → NEEDS_REVIEW, mode_a skip từ đó (mode_b vẫn hoạt động).

- [ ] **Step 4: Re-seed lại 1 lần (update audioUrl local vào Question contentJson)**

Vì Task 5 nhánh mode_a đọc `wordItem.audioUrl` lúc seed (Step 2) — lúc đó có thể là remote URL. Sau Step 3 audioUrl = local. Chạy lại seed để Question.contentJson cập nhật audioUrl local:
```bash
npm run db:seed:lessons
```
Expected: re-seed idempotent, Question g01 mode_a contentJson `audioUrl` giờ = `/audio/{word}.mp3` (local). Log giống Step 2.

- [ ] **Step 5: Verify DB CĐ4 Batch 1 (smoke check)**
```bash
npx prisma studio
```
Mở table:
- `SoundGroup` → filter `topicId="topic-4-stress-connected"` → 4 nhóm. g01/g02 status=ACTIVE, g03/g04 status=DRAFT (Batch 2).
- `WordItem` → filter `soundGroupId="map-t4-g01-word-stress"` → 8 từ, `syllables`/`stressIndex`/`wordStressType` có giá trị, đa số `audioUrl="/audio/...mp3"` (local).
- `Exercise` → filter CD4 → 8 exercise (4 nhóm × 2 mode). g01/g02 mode_a + mode_b status=ACTIVE, questionCount=8. g03/g04 DRAFT, questionCount=0.
- `Question` → filter exercise g01 mode_a → 8 question, `content` JSON có `qtype:"tap-stress"`, `syllables`, `stressIndex`, `audioUrl`. g02 mode_b → 8 question, `acceptedAnswers` có giá trị (câu 1/4/6/7) hoặc null (câu 2/3/5/8).
- `AnswerOption` → g01 mode_a mỗi question có N option (N = số âm tiết). g02 mode_a mỗi question có option = từ trong câu.

(Hoặc verify qua app UI: `npm run dev` → /learning_map → CĐ4 (chưa unlock gating — SP6, nhưng click trực tiếp group) → g01/g02 hiện, làm mode_a → render fallback generic (UI đầy đủ = SP4).)

- [ ] **Step 6: Quality gate — test full + tsc + build**
```bash
npm test
npx tsc --noEmit
npm run build
```
Expected:
- `npm test`: ALL pass (test cũ + 3 test Batch 1). Không regression.
- `tsc`: 0 error.
- `build`: Next.js build success.

- [ ] **Step 7: Checkpoint Batch 1 review với user**

Báo user: **Batch 1 hoàn tất**. g01 Word Stress (8 từ, audio local) + g02 Weak Forms (8 câu) content + re-seed done. 8 exercise g01/g02 ACTIVE (mode_a + mode_b, 8 câu mỗi exercise). Quality gate pass. g03/g04 DRAFT (Batch 2). User review + commit Batch 1 khi convenient. Sau đó tiếp Batch 2.

---

## Batch 2 — g03 Linking + g04 Assimilation

### Task 7: Test TDD Batch 2 — g03 + g04 + all-4-in-map (fail trước)

**Files:**
- Modify: `src/lib/__tests__/lesson-content.test.ts`

- [ ] **Step 1: Thêm `CD4_GROUPS` array + 2 test Batch 2 vào cuối file**

Thêm vào cuối `src/lib/__tests__/lesson-content.test.ts` (sau 3 test Batch 1):
```ts
// ===== SP3d Batch 2: CĐ4 (g03 Linking + g04 Assimilation + all-4 verify) =====

const CD4_GROUPS = [
  "map-t4-g01-word-stress",
  "map-t4-g02-weak-forms",
  "map-t4-g03-linking",
  "map-t4-g04-assimilation",
];

test("4 nhóm CĐ4 có trong LESSON_CONTENT_BY_SOUND_GROUP", () => {
  for (const id of CD4_GROUPS) {
    assert.ok(LESSON_CONTENT_BY_SOUND_GROUP[id as keyof typeof LESSON_CONTENT_BY_SOUND_GROUP], `Thiếu nhóm ${id}`);
  }
});

test("Linking + Assimilation (g03/g04): mỗi nhóm 8 câu, có ipa bắt đầu /", () => {
  for (const id of ["map-t4-g03-linking", "map-t4-g04-assimilation"]) {
    const content = getContentBySoundGroup(id);
    assert.ok(content, `${id} phải có content`);
    assert.ok(content!.sentences.length >= 8, `${id} sentences >= 8 (hiện ${content!.sentences.length})`);
    for (const s of content!.sentences) {
      assert.ok(s.ipa, `${id} sentence "${s.sentence}" thiếu ipa`);
      assert.ok(s.ipa!.startsWith("/"), `${id} ipa "${s.ipa}" phải bắt đầu /`);
    }
  }
});
```

- [ ] **Step 2: Chạy test verify fail**
```bash
npx tsx --test "src/lib/__tests__/lesson-content.test.ts"
```
Expected: 2 test mới FAIL — "4 nhóm CĐ4 có trong" fail ở g03 (undefined), "Linking + Assimilation" fail (g03/g04 chưa content). Test Batch 1 + cũ pass.

- [ ] **Step 3: Checkpoint review với user**

Báo user: 2 test Batch 2 thêm, fail đúng. Review rồi tiếp Task 8.

---

### Task 8: Content g03 Linking (8 câu) + entry map

**Files:**
- Modify: `prisma/lesson-content.ts` (thêm block `SENTENCES_T4_G03_LINKING` + entry map)

**Context:** g03 dùng SentenceItems. `linkingPairs` = cặp `[wordA, wordB]` có nối âm consonant-vowel (đáp án Mode A). `targetPhonemes: []` (catalog g03 set `[]`). `targetWords` = linking pairs flat. Mode B đơn trị (không `acceptedAnswers`).

- [ ] **Step 1: Thêm block g03 trước `// EXPORTS`** (sau block g02)
```ts
// ============================================================================
// TOPIC 4 - NHÓM 3: Linking (CĐ4) — Mode A: choose-linking / Mode B: đọc câu
// ============================================================================

export const SENTENCES_T4_G03_LINKING: SentenceItemData[] = [
  { sentence: "Turn off the light.", soundGroupId: "map-t4-g03-linking", targetWords: ["Turn","off"], targetPhonemes: [], difficulty: 5, ipa: "/ˈtɜrn ˈɔf ðə ˈlaɪt/", translation: "Tắt đèn.", status: "ACTIVE", sourceType: "MANUAL", linkingPairs: [["Turn","off"]], reviewNote: "C+V linking: /n/+/ɔ/ → /tɜrnˈɔf/" },
  { sentence: "Pick it up.", soundGroupId: "map-t4-g03-linking", targetWords: ["Pick","it","up"], targetPhonemes: [], difficulty: 5, ipa: "/ˈpɪk ɪt ˈʌp/", translation: "Nhấc nó lên.", status: "ACTIVE", sourceType: "MANUAL", linkingPairs: [["Pick","it"],["it","up"]], reviewNote: "/k/+/ɪ/, /t/+/ʌ/ linking" },
  { sentence: "Look at this.", soundGroupId: "map-t4-g03-linking", targetWords: ["Look","at"], targetPhonemes: [], difficulty: 4, ipa: "/ˈlʊk ət ˈðɪs/", translation: "Nhìn cái này.", status: "ACTIVE", sourceType: "MANUAL", linkingPairs: [["Look","at"]], reviewNote: "/k/+/ə/ linking" },
  { sentence: "Stop it now.", soundGroupId: "map-t4-g03-linking", targetWords: ["Stop","it"], targetPhonemes: [], difficulty: 4, ipa: "/ˈstɑp ɪt ˈnaʊ/", translation: "Dừng lại ngay.", status: "ACTIVE", sourceType: "MANUAL", linkingPairs: [["Stop","it"]], reviewNote: "/p/+/ɪ/ linking" },
  { sentence: "Come in and sit down.", soundGroupId: "map-t4-g03-linking", targetWords: ["Come","in","and"], targetPhonemes: [], difficulty: 6, ipa: "/ˈkʌm ɪn ən ˈsɪt ˈdaʊn/", translation: "Vào và ngồi xuống.", status: "ACTIVE", sourceType: "MANUAL", linkingPairs: [["Come","in"],["in","and"]], reviewNote: "/m/+/ɪ/, /n/+/ə/ linking" },
  { sentence: "Hold on a second.", soundGroupId: "map-t4-g03-linking", targetWords: ["Hold","on"], targetPhonemes: [], difficulty: 5, ipa: "/ˈhoʊld ˈɑn ə ˈsɛkənd/", translation: "Đợi một chút.", status: "ACTIVE", sourceType: "MANUAL", linkingPairs: [["Hold","on"]], reviewNote: "/d/+/ɑ/ linking" },
  { sentence: "Take an apple.", soundGroupId: "map-t4-g03-linking", targetWords: ["Take","an","apple"], targetPhonemes: [], difficulty: 5, ipa: "/ˈteɪk ən ˈæpəl/", translation: "Lấy một quả táo.", status: "ACTIVE", sourceType: "MANUAL", linkingPairs: [["Take","an"],["an","apple"]], reviewNote: "/k/+/ə/, /n/+/æ/ linking" },
  { sentence: "Wash up before dinner.", soundGroupId: "map-t4-g03-linking", targetWords: ["Wash","up"], targetPhonemes: [], difficulty: 6, ipa: "/ˈwɑʃ ˈʌp bɪˈfɔr ˈdɪnər/", translation: "Rửa tay trước bữa tối.", status: "ACTIVE", sourceType: "MANUAL", linkingPairs: [["Wash","up"]], reviewNote: "/ʃ/+/ʌ/ linking" },
];
```

- [ ] **Step 2: Thêm entry g03 vào `LESSON_CONTENT_BY_SOUND_GROUP`** (sau entry g02)
```ts
  "map-t4-g03-linking": {
    words: [],
    minimalPairs: [],
    sentences: SENTENCES_T4_G03_LINKING,
  },
```

- [ ] **Step 3: Chạy test verify g03 pass**
```bash
npx tsx --test "src/lib/__tests__/lesson-content.test.ts"
```
Expected: test "Linking + Assimilation (g03/g04)" — g03 pass, g04 vẫn fail. test "4 nhóm CĐ4 có trong" — g03 pass, g04 fail. Tiến độ đúng (Task 8 chỉ thêm g03).

- [ ] **Step 4: Verify tsc**
```bash
npx tsc --noEmit
```
Expected: 0 error.

- [ ] **Step 5: Checkpoint review với user**

Báo user: g03 Linking (8 câu) content done, test g03 pass. Review rồi tiếp Task 9.

---

### Task 9: Content g04 Assimilation & Elision (8 câu) + entry map

**Files:**
- Modify: `prisma/lesson-content.ts` (thêm block `SENTENCES_T4_G04_ASSIM` + entry map)

**Context:** g04 dùng SentenceItems. `assimilationType` = mô tả biến âm (`dj→dʒ`, `tj→tʃ`, `elision-t`). `assimOriginal` = cụm gốc, `assimResult` = phát âm biến âm (đáp án Mode A). `ipa` = phiên âm đã biến âm (GA no length mark). `targetPhonemes: []` (catalog g04 set `[]`). `targetWords` = original split.

- [ ] **Step 1: Thêm block g04 trước `// EXPORTS`** (sau block g03)
```ts
// ============================================================================
// TOPIC 4 - NHÓM 4: Assimilation & Elision (CĐ4) — Mode A: choose-assimilation / Mode B: đọc câu
// ============================================================================

export const SENTENCES_T4_G04_ASSIM: SentenceItemData[] = [
  { sentence: "Did you see it?", soundGroupId: "map-t4-g04-assimilation", targetWords: ["Did","you"], targetPhonemes: [], difficulty: 6, ipa: "/dɪdʒu si ɪt/", translation: "Bạn có thấy nó không?", status: "ACTIVE", sourceType: "MANUAL", assimilationType: "dj→dʒ", assimOriginal: "did you", assimResult: "didʒu", reviewNote: "/d/+/j/→/dʒ/: did you → didja" },
  { sentence: "Nice to meet you.", soundGroupId: "map-t4-g04-assimilation", targetWords: ["meet","you"], targetPhonemes: [], difficulty: 6, ipa: "/naɪs tə mitʃu/", translation: "Vui được gặp bạn.", status: "ACTIVE", sourceType: "MANUAL", assimilationType: "tj→tʃ", assimOriginal: "meet you", assimResult: "mitʃu", reviewNote: "/t/+/j/→/tʃ/: meet you → meetcha" },
  { sentence: "Would you like tea?", soundGroupId: "map-t4-g04-assimilation", targetWords: ["Would","you"], targetPhonemes: [], difficulty: 6, ipa: "/wʊdʒu laɪk ti/", translation: "Bạn có muốn trà không?", status: "ACTIVE", sourceType: "MANUAL", assimilationType: "dj→dʒ", assimOriginal: "would you", assimResult: "wʊdʒu", reviewNote: "/d/+/j/→/dʒ/: would you → wouldja" },
  { sentence: "I got your back.", soundGroupId: "map-t4-g04-assimilation", targetWords: ["got","your"], targetPhonemes: [], difficulty: 6, ipa: "/aɪ ɡɑtʃər bæk/", translation: "Tôi ủng hộ bạn.", status: "ACTIVE", sourceType: "MANUAL", assimilationType: "tj→tʃ", assimOriginal: "got your", assimResult: "ɡɑtʃər", reviewNote: "/t/+/j/→/tʃ/: got your → gotcha" },
  { sentence: "Next day, we leave.", soundGroupId: "map-t4-g04-assimilation", targetWords: ["Next","day"], targetPhonemes: [], difficulty: 7, ipa: "/nɛks deɪ wi liv/", translation: "Hôm sau, chúng tôi rời đi.", status: "ACTIVE", sourceType: "MANUAL", assimilationType: "elision-t", assimOriginal: "next day", assimResult: "nɛks deɪ", reviewNote: "Elision: drop /t/ in 'next' before /d/" },
  { sentence: "Just you and me.", soundGroupId: "map-t4-g04-assimilation", targetWords: ["Just","you"], targetPhonemes: [], difficulty: 6, ipa: "/dʒʌs tʃu ən mi/", translation: "Chỉ bạn và tôi.", status: "ACTIVE", sourceType: "MANUAL", assimilationType: "tj→tʃ", assimOriginal: "just you", assimResult: "dʒʌs tʃu", reviewNote: "/t/+/j/→/tʃ/ + elision overlap" },
  { sentence: "Hand your coat over.", soundGroupId: "map-t4-g04-assimilation", targetWords: ["Hand","your"], targetPhonemes: [], difficulty: 7, ipa: "/hændʒər koʊt oʊvər/", translation: "Đưa áo khoác lại đây.", status: "ACTIVE", sourceType: "MANUAL", assimilationType: "dj→dʒ", assimOriginal: "hand your", assimResult: "hændʒər", reviewNote: "/d/+/j/→/dʒ/: hand your → handjer" },
  { sentence: "Last chance, go!", soundGroupId: "map-t4-g04-assimilation", targetWords: ["Last","chance"], targetPhonemes: [], difficulty: 7, ipa: "/læs tʃæns ɡoʊ/", translation: "Cơ hội cuối, đi đi!", status: "ACTIVE", sourceType: "MANUAL", assimilationType: "elision-t", assimOriginal: "last chance", assimResult: "læs tʃæns", reviewNote: "Elision: drop /t/ in 'last' before /tʃ/" },
];
```

- [ ] **Step 2: Thêm entry g04 vào `LESSON_CONTENT_BY_SOUND_GROUP`** (sau entry g03)
```ts
  "map-t4-g04-assimilation": {
    words: [],
    minimalPairs: [],
    sentences: SENTENCES_T4_G04_ASSIM,
  },
```

- [ ] **Step 3: Chạy test verify Batch 2 test pass**
```bash
npx tsx --test "src/lib/__tests__/lesson-content.test.ts"
```
Expected: TẤC CẢ test pass (cũ + 3 Batch 1 + 2 Batch 2 = 5 test CĐ4). test "4 nhóm CĐ4 có trong" PASS (cả 4 có content). test "Linking + Assimilation (g03/g04)" PASS.

- [ ] **Step 4: Verify tsc**
```bash
npx tsc --noEmit
```
Expected: 0 error.

- [ ] **Step 5: Checkpoint review với user**

Báo user: g04 Assimilation (8 câu) content done, 5 test CĐ4 pass. Review rồi tiếp Task 10 (re-seed Batch 2).

---

### Task 10: Re-seed + quality gate (Batch 2 verify)

**Files:**
- Chạy (không sửa): `prisma/seed_lessons.ts`

- [ ] **Step 1: Clean DB + re-seed**
```bash
npx tsx prisma/db_cleanup.ts
npm run db:seed:lessons
```
Expected: `📝 Lesson Content loaded: N Sound Groups with data` — N >= 28 (24 cũ + 4 CD4). generateExercises flip g03/g04 DRAFT→ACTIVE (giờ có sentences). generateQuestions log `✓ map-t4-g03-linking mode_a: 8 câu` + `mode_b: 8 câu`, `✓ map-t4-g04-assimilation mode_a: 8 câu` + `mode_b: 8 câu`. g01/g02 vẫn ACTIVE (8 câu mỗi mode).

- [ ] **Step 2: Rút audio local (idempotent — g01 đã có, chỉ verify không mất)**
```bash
npx tsx prisma/seed_audio_local.ts
```
Expected: 8 từ g01 đã có file local (skip). Không tải mới (g03/g04 là câu, không WordItem). Log: "0 tải mới, N skip, 0 fail".

- [ ] **Step 3: Verify DB CĐ4 full (smoke check)**
```bash
npx prisma studio
```
Mở table:
- `SoundGroup` → filter `topicId="topic-4-stress-connected"` → 4 nhóm, **tất cả status=ACTIVE**.
- `Exercise` → filter CD4 → 8 exercise, **tất cả status=ACTIVE**, questionCount=8 mỗi exercise (4 nhóm × 2 mode × 8 câu).
- `Question` → g03 mode_a → 8 question, `content` JSON có `qtype:"choose-linking"`, `linkingPairs`. g04 mode_a → 8 question, `qtype:"choose-assimilation"`, `assimilationType`/`original`/`result`. g02 mode_b → `acceptedAnswers` có giá trị (câu 1/4/6/7) / null (câu 2/3/5/8). g03/g04 mode_b → `acceptedAnswers` null.
- `AnswerOption` → g03 mode_a mỗi question option = cặp `wordA→wordB`. g04 mode_a mỗi question 2 option (result + original).

- [ ] **Step 4: Quality gate — test full + tsc + build**
```bash
npm test
npx tsc --noEmit
npm run build
```
Expected:
- `npm test`: ALL pass (test cũ + 5 test CĐ4). Không regression.
- `tsc`: 0 error.
- `build`: Next.js build success.

- [ ] **Step 5: Checkpoint Batch 2 final review với user**

Báo user: **SP3d hoàn tất**. 4 nhóm CĐ4 content (8 từ g01 + 24 câu g02/3/4 = 32 item) + re-seed + sửa seed + audio local done. 8 exercise CĐ4 ACTIVE (4 nhóm × 2 mode × 8 câu). Quality gate pass. 30/30 nhóm có content. User review + commit Batch 2 khi convenient. **UI render 4 dạng CĐ4 = SP4 (defer).**

---

## Self-Review

### 1. Spec coverage
- **Spec "Mục tiêu"** (content 4 nhóm + re-seed + sinh Question 2 mode + audio g01): Task 3-4 (g01/g02) + Task 8-9 (g03/g04) + Task 5 (seed) + Task 6/10 (re-seed + audio). ✓
- **Spec section 1 (hiện trạng)**: catalog 4 nhóm + 6 mode + 4 qtype đã có (plan không sửa catalog/qtype). Schema field CĐ4 đã có (plan không migration). Pattern content rõ (plan theo template). ✓
- **Spec section 1.1 (3 phát hiện verify)**: (1) WordItem.phonemeId bắt buộc → g01 targetPhonemes[0] len PHONEMES (Task 3 content + test Task 2 check targetPhonemes.length > 0). (2) CD4 không content-driven → sửa seed 3 điểm + 2 nhánh (Task 5). (3) cap cùng chính tả audio mơ hồ → g01 dùng chính tả riêng biệt (Task 3 content note). ✓
- **Spec section 2 (data shape 4 nhóm)**: Task 1 type extension (WordItemData +3, SentenceItemData +6) + content shape khớp spec 2.1-2.4 (contentJson Mode A/B build trong seed Task 5). ✓
- **Spec section 3 (seed flow 3 sửa)**: Task 5 Step 2-6 (sửa 1 hasContent ×3, sửa 2 CD4_QTYPE + 2 nhánh, sửa 3 seedWordItems +3 field). Re-seed pipeline Task 6/10. ✓
- **Spec section 4 (test design 5 test)**: Task 2 (3 test Batch 1) + Task 7 (2 test Batch 2) = 5 test, chia batch để quality gate xanh từng batch. Code khớp spec section 4 (g01 syllables/stressIndex/wordStressType, g02/3/4 8 câu ipa, g02 /ə/, total >= 26, all-4-in-map). ✓
- **Spec section 5 (scope/edge cases)**: UI SP4 defer (header + Task 10 note), g01 phonemeId (Task 3 note), g01 audio mơ hồ (Task 3 note), g02/3/4 sentences-only hasContent (Task 5 sửa 1), CĐ4 không 3-stage (Task 5 note guard), audio câu speechSynthesis runtime (Task 5 contentJson audioUrl null), acceptedAnswers g02 multi/g01-3-4 đơn (Task 5 nhánh B). ✓
- **Spec section 6 (file)**: sửa lesson-content.ts + seed_lessons.ts + test, chạy db_cleanup/seed/audio (không sửa). ✓
- **Spec section 7 (behavior)**: 4 nhóm DRAFT→ACTIVE, 8 exercise có Question, audio g01 local, không đụng XP/engine/catalog. ✓
- **Spec section 8 (rủi ro)**: g01 phoneme symbol (Task 3 + test), g01 audio mơ hồ (Task 3 note), contentJson shape (test + spec + verify studio), sửa seed regression (guard topic-4 + hasContent chỉ thêm sentences), cmudict stress (Task 3 reviewNote), không playtest (header note), 2 đợt (Batch 1/2), audio fail NEEDS_REVIEW (Task 6 note). ✓

**Gap phát hiện & xử lý:**
- Spec "không thêm field type" cho SentenceItemData → plan refinement (header ⚠️): thêm 6 optional authoring field (không DB column) để seed build contentJson. Flag ở Task 1 checkpoint.
- Spec test 5 test gộp → plan chia 2 batch (3 + 2) để quality gate mỗi batch xanh (g03/g04 test chỉ thêm khi content có).
- Spec không nói "re-seed 2 lần" (Task 6 Step 2 + Step 4) → plan thêm Step 4 re-seed lại sau audio local để Question.contentJson audioUrl = local (g01 mode_a). Verify cần thiết.
- Spec không nói orphan bank items (seedQuestionBankItems tạo lc/sw/ss cho CD4 group nhưng CD4 exercise bypass bank) → harmless, note trong header context. Không block.

### 2. Placeholder scan
- Không có "TBD"/"TODO"/"implement later"/"similar to Task N".
- Mỗi task có code đầy đủ: Task 1 (type), Task 2/7 (test), Task 3/4/8/9 (content arrays 8 item verbatim), Task 5 (seed code hoàn chỉnh 2 nhánh ~90 dòng), Task 6/10 (commands).
- Content arrays đầy đủ (8 từ g01 + 8 câu × 3 nhóm = 32 item, IPA/syllables/stressIndex/weakWords/linkingPairs/assimilation fields verbatim).
- Seed branch code hoàn chỉnh (contentJson shape, AnswerOption, acceptedAnswers).

### 3. Type consistency
- `WordItemData` (Task 1): +`syllables?: string[]` +`stressIndex?: number` +`wordStressType?: "WORD_STRESS"|"WEAK_FORM"|"LINKING"|"ASSIMILATION"` khớp schema `WordItem.syllables Json? / stressIndex Int? / wordStressType String?`. ✓
- `SentenceItemData` (Task 1): +`weakWords?: string[]` +`linkingPairs?: string[][]` +`assimilationType?: string` +`assimOriginal?: string` +`assimResult?: string` +`acceptedAnswers?: string[]`. Seed branch (Task 5) đọc `s.weakWords`/`s.linkingPairs`/`s.assimilationType`/`s.assimOriginal`/`s.assimResult`/`s.acceptedAnswers` — khớp. ✓
- Content (Task 3/4/8/9): g01 word dùng `syllables`/`stressIndex`/`wordStressType:"WORD_STRESS"`; g02 sentence dùng `weakWords`/`acceptedAnswers`; g03 dùng `linkingPairs`; g04 dùng `assimilationType`/`assimOriginal`/`assimResult`. Khớp type + seed branch. ✓
- `soundGroupId` value (Task 3/4/8/9) khớp catalog `lesson-catalog.ts:203-208` (map-t4-g01-word-stress → map-t4-g04-assimilation). ✓
- `CD4_QTYPE_BY_GROUP` (Task 5) key khớp 4 soundGroupId, value khớp `seedQuestionTypes` `seed_lessons.ts:128-147` (qtype-4-tap-stress → qtype-7-choose-assimilation). ✓
- Test `CD4_GROUPS` (Task 7) khớp 4 soundGroupId. ✓
- Seed branch `qtypeMap[cd4QtypeId].id` — `qtypeMap` từ `prisma.questionType.findMany()` (line 775-776), `cd4QtypeId` = qtype id string. ✓
- `targetPhonemes` g01 = symbol `PHONEMES` (`/əʊ/` `/ɑː/` `/uː/` `/e/` `/ɔː/` `/æ/`) — verify tồn tại `lesson-catalog.ts:214-262`. ✓
- `acceptedAnswers` Question field (Prisma `Json?`) — Task 5 nhánh B set `null` (đơn) hoặc `JSON.parse(JSON.stringify([...]))` (multi). Note Task 5 Step 7 fallback `Prisma.DbNull` nếu tsc lỗi. ✓

No type drift found.

### Note cho engineer
- **Refinement SentenceItemData** (header ⚠️): thêm 6 optional field — nếu user không OK ở Task 1 checkpoint, dừng và thảo luận approach Y (lookup riêng) trước khi tiếp.
- **Sửa 1b (hasContent line 694)**: có 2 dòng `const hasContent = Boolean(content && content.words.length > 0);` giống hệt (662, 694). Sửa cả 2 (replace_all hoặc context unique).
- **Task 6 Step 4 re-seed lần 2**: cần thiết để Question g01 mode_a audioUrl = local (sau seed_audio_local). Đừng bỏ.
- **acceptedAnswers Prisma null**: nếu `null` gây tsc lỗi, dùng `Prisma.DbNull` (import `Prisma` từ `@prisma/client` nếu chưa có).
- **g01 mode_a cần từ ACTIVE + audioUrl**: nếu seed_audio_local fail vài từ g01 → mode_a skip (NEEDS_REVIEW), mode_b vẫn 8 câu. Verify studio Task 6 Step 5.

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-19-sp3d-content-cd4.md`. Two execution options:

**1. Subagent-Driven (recommended)** — Tôi dispatch fresh subagent per task, review giữa task, iteration nhanh. Phù hợp: 10 task (Batch 1: Task 1-6, Batch 2: Task 7-10), mỗi task self-contained. Task 5 (sửa seed) rủi ro cao → review kỹ.

**2. Inline Execution** — Execute tasks trong session này bằng executing-plans, batch + checkpoint.

**Git policy:** Engineer không tự commit (user handles). Mỗi task kết thúc checkpoint review với user. 2 commit: Batch 1 (sau Task 6), Batch 2 (sau Task 10).

Which approach?
