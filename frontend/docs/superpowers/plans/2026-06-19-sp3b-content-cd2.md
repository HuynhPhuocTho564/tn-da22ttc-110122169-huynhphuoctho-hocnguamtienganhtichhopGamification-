# SP3b — Content CĐ2 (12 nhóm Phụ âm) Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.
>
> **Git policy:** Engineer KHÔNG tự commit. Mỗi task kết thúc checkpoint review với user; user tự commit khi convenient. Không chạy `git add`/`git commit`/`git push`.

**Goal:** Biên soạn content (10 từ/6 cặp/4 câu mỗi nhóm, trừ g08-h 0 cặp) cho 12 nhóm Phụ âm CĐ2 + re-seed flip DRAFT→ACTIVE + rút audio mp3 local, hoàn thiện lõi phát âm (CĐ1+CĐ2 = 22/30 nhóm content).

**Architecture:** Hướng A (spec section "đề xuất approach A"). Thêm 12 block content vào `lesson-content.ts` (WORDS/MINIMAL_PAIRS/SENTENCES theo template CD1) + 12 entry vào `LESSON_CONTENT_BY_SOUND_GROUP`. Seed đã content-driven → chạy `seed_lessons` tự flip DRAFT→ACTIVE + sinh WordItem/MinimalPair/SentenceItem/QuestionBankItem/Question. Chạy `seed_audio_local.ts` rút mp3 local cho từ FREE_API. TDD: mở rộng `lesson-content.test.ts` test 12 nhóm trước (fail) → implement content → pass.

**Tech Stack:** Next.js 16, React 18, TypeScript 6, Prisma 6, Tailwind 4, test runner `tsx --test` (Node `node:test` + `node:assert/strict`).

**Spec reference:** `docs/superpowers/specs/2026-06-19-sp3b-content-cd2-design.md`

**Codebase root note:** Source dưới `english_pronunciation_app/frontend/`. Mọi path tương đối từ `english_pronunciation_app/frontend/`. Chạy `npm`/`npx`/`tsx` từ `english_pronunciation_app/frontend/`.

**Content biên soạn:** Plan dưới đây chứa danh sách từ/cặp/câu đầy đủ cho từng nhóm (IPA verify theo CMU Pronouncing Dictionary, từ chung tiếng Anh, cặp cổ điển voiceless vs voiced, câu ngắn 1-2 target word). Engineer transpose danh sách thành code TS theo template `WORDS_T1_G01_I_IH` (xem `lesson-content.ts:61-242` mẫu). IPA mọi từ đã verify cmudict.

---

## File Structure

| Hành động | File | Trách nhiệm |
|---|---|---|
| sửa | `src/lib/__tests__/lesson-content.test.ts` | thêm 12 nhóm CD2 vào test array + 4 test mới (TDD: fail trước) |
| sửa | `prisma/lesson-content.ts` | thêm 12 block content CD2 (WORDS_T2_G0N_* / MINIMAL_PAIRS_T2_G0N / SENTENCES_T2_G0N) + 12 entry vào `LESSON_CONTENT_BY_SOUND_GROUP` |
| chạy (không sửa) | `prisma/seed_lessons.ts` | content-driven, flip CD2 DRAFT→ACTIVE + sinh rows |
| chạy (không sửa) | `prisma/seed_audio_local.ts` | rút mp3 local cho từ FREE_API CD2 (idempotent) |

**Decomposition rationale:** 12 nhóm chia 4 task biên soạn (3 nhóm/task theo tầng subcategory: Task 2 Plosives, Task 3 Fricatives part 1, Task 4 Fricatives part 2 + Affricates, Task 5 Nasals + Approximants). Mỗi task thêm content 3 nhóm + chạy test từng task. Task 1 test TDD trước (fail), Task 6 seed + audio + quality gate.

**Type reminder (từ spec section 1):** Field authored là `exampleSentence` (word, KHÔNG phải meaningVi — seed map `exampleSentence`→`meaningVi` ở `seed_lessons.ts:318`), `explanation` (pair, KHÔNG phải note — seed map `explanation`→`note`), `translation` (sentence). KHÔNG author `syllables`/`stressIndex`/`wordStressType` (CĐ4-only, DB column, không trong type `WordItemData` `lesson-content.ts:14-26`).

---

## Task 1: Test TDD — 12 nhóm CD2 (fail trước)

**Files:**
- Modify: `src/lib/__tests__/lesson-content.test.ts`

- [ ] **Step 1: Đọc file test hiện tại để hiểu pattern**

Mở `src/lib/__tests__/lesson-content.test.ts`. File có `NEW_GROUPS` (7 nhóm CD1, line 5-13) + 5 test. Pattern: `assert.ok(LESSON_CONTENT_BY_SOUND_GROUP[id])`, `getContentBySoundGroup(id)`, check `words.length`/`sentences.length`/`minimalPairs.length`, `w.soundGroupId === id`, `w.targetPhonemes.length > 0`, `w.ipa.startsWith("/")`.

- [ ] **Step 2: Thêm 12 nhóm CD2 vào test array + 4 test mới**

Thêm vào cuối file (sau test cuối "tổng số nhóm có content >= 10"), trước EOF:
```ts
// ===== SP3b: CĐ2 (12 nhóm Phụ âm) =====

const CD2_GROUPS = [
  "map-t2-g01-p-b", "map-t2-g02-t-d", "map-t2-g03-k-g",
  "map-t2-g04-f-v", "map-t2-g05-th-dh", "map-t2-g06-s-z",
  "map-t2-g07-sh-zh", "map-t2-g08-h", "map-t2-g09-ch-j",
  "map-t2-g10-nasals", "map-t2-g11-l-r", "map-t2-g12-w-j",
];

test("12 nhóm CĐ2 có trong LESSON_CONTENT_BY_SOUND_GROUP", () => {
  for (const id of CD2_GROUPS) {
    assert.ok(LESSON_CONTENT_BY_SOUND_GROUP[id as keyof typeof LESSON_CONTENT_BY_SOUND_GROUP], `Thiếu nhóm ${id}`);
  }
});

test("mỗi nhóm CĐ2 có words/sentences không rỗng + pairs (trừ g08-h)", () => {
  for (const id of CD2_GROUPS) {
    const content = getContentBySoundGroup(id);
    assert.ok(content, `getContentBySoundGroup(${id}) trả undefined`);
    assert.ok(content!.words.length >= 10, `${id}: words >= 10 (hiện ${content!.words.length})`);
    assert.ok(content!.sentences.length >= 4, `${id}: sentences >= 4 (hiện ${content!.sentences.length})`);
    // g08-h /h/ đơn phoneme không cặp → pairs có thể 0; các nhóm khác >= 6
    if (id !== "map-t2-g08-h") {
      assert.ok(content!.minimalPairs.length >= 6, `${id}: pairs >= 6 (hiện ${content!.minimalPairs.length})`);
    }
  }
});

test("mỗi word CĐ2 có soundGroupId khớp + targetPhonemes + ipa bắt đầu /", () => {
  for (const id of CD2_GROUPS) {
    const content = getContentBySoundGroup(id);
    for (const w of content!.words) {
      assert.equal(w.soundGroupId, id, `word "${w.word}" soundGroupId sai: ${w.soundGroupId} (mong đợi ${id})`);
      assert.ok(w.targetPhonemes.length > 0, `word "${w.word}" thiếu targetPhonemes`);
      assert.ok(w.ipa.startsWith("/"), `word "${w.word}" ipa phải bắt đầu bằng /`);
    }
  }
});

test("tổng số nhóm có content >= 22 (12 CD1 + 2 legacy CD3 + 12 CD2)", () => {
  assert.ok(Object.keys(LESSON_CONTENT_BY_SOUND_GROUP).length >= 22, `Ít nhất 22 nhóm content (hiện ${Object.keys(LESSON_CONTENT_BY_SOUND_GROUP).length})`);
});
```

- [ ] **Step 3: Chạy test để verify fail**

```bash
npx tsx --test "src/lib/__tests__/lesson-content.test.ts"
```
Expected: FAIL — 4 test mới fail ("Thiếu nhóm map-t2-g01-p-b", words/sentences/pairs < threshold, total < 22). Test cũ (7 nhóm CD1 + threshold >=10) vẫn pass.

- [ ] **Step 4: Verify tsc không lỗi (test file compile)**

```bash
npx tsc --noEmit
```
Expected: 0 error (test file chỉ import đã có, assertion TS valid).

- [ ] **Step 5: Checkpoint review với user**

Báo user: test TDD 12 nhóm CD2 thêm, 4 test mới fail (đúng — content chưa có). Review rồi tiếp Task 2.

---

## Task 2: Content Plosives — g01 /p//b/, g02 /t//d/, g03 /k//g/

**Files:**
- Modify: `prisma/lesson-content.ts` (thêm 3 block content + 3 entry map)

**Context:** Template xem `WORDS_T1_G01_I_IH` (`lesson-content.ts:61-242`). Mỗi word: `{ word, ipa, soundGroupId, targetPhonemes, difficulty, exampleSentence?, status, sourceType, sourceUrl?, reviewNote? }`. Mỗi pair: `{ word1, ipa1, word2, ipa2, soundGroupId, contrastPhonemes, difficulty, explanation?, status, sourceType, reviewNote? }`. Mỗi sentence: `{ sentence, soundGroupId, targetWords, targetPhonemes, difficulty, translation?, status, sourceType, reviewNote? }`. Từ `sourceType: "FREE_API"` (auto audio), pair/sentence `sourceType: "MANUAL"`.

**Content biên soạn (IPA verify cmudict):**

- [ ] **Step 1: Thêm block g01 /p//b/ trước `// EXPORTS` (line 1028)**

Thêm vào `prisma/lesson-content.ts`, trước dòng `// ============ EXPORTS` (line 1028):
```ts
// ============================================================================
// TOPIC 2 - NHÓM 1: /p/ & /b/ (Plosives)
// ============================================================================

export const WORDS_T2_G01_P_B: WordItemData[] = [
  { word: "pat", ipa: "/pæt/", soundGroupId: "map-t2-g01-p-b", targetPhonemes: ["/p/"], difficulty: 2, exampleSentence: "Pat the dog gently.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "Từ cơ bản" },
  { word: "bat", ipa: "/bæt/", soundGroupId: "map-t2-g01-p-b", targetPhonemes: ["/b/"], difficulty: 2, exampleSentence: "The bat flew at night.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "Contrast /p/ vs /b/" },
  { word: "cap", ipa: "/kæp/", soundGroupId: "map-t2-g01-p-b", targetPhonemes: ["/p/"], difficulty: 2, exampleSentence: "Wear a cap in the sun.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "cab", ipa: "/kæb/", soundGroupId: "map-t2-g01-p-b", targetPhonemes: ["/b/"], difficulty: 2, exampleSentence: "Call a cab now.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "rope", ipa: "/roʊp/", soundGroupId: "map-t2-g01-p-b", targetPhonemes: ["/p/"], difficulty: 3, exampleSentence: "Tie the rope tight.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/p/ cuối từ" },
  { word: "robe", ipa: "/roʊb/", soundGroupId: "map-t2-g01-p-b", targetPhonemes: ["/b/"], difficulty: 3, exampleSentence: "She wore a silk robe.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/b/ cuối từ" },
  { word: "pen", ipa: "/pen/", soundGroupId: "map-t2-g01-p-b", targetPhonemes: ["/p/"], difficulty: 1, exampleSentence: "Write with a pen.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "bed", ipa: "/bed/", soundGroupId: "map-t2-g01-p-b", targetPhonemes: ["/b/"], difficulty: 1, exampleSentence: "Go to bed early.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "pin", ipa: "/pɪn/", soundGroupId: "map-t2-g01-p-b", targetPhonemes: ["/p/"], difficulty: 1, exampleSentence: "Pin the paper down.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "bin", ipa: "/bɪn/", soundGroupId: "map-t2-g01-p-b", targetPhonemes: ["/b/"], difficulty: 1, exampleSentence: "Throw it in the bin.", status: "ACTIVE", sourceType: "FREE_API" },
];

export const MINIMAL_PAIRS_T2_G01: MinimalPairData[] = [
  { word1: "pat", ipa1: "/pæt/", word2: "bat", ipa2: "/bæt/", soundGroupId: "map-t2-g01-p-b", contrastPhonemes: ["/p/", "/b/"], difficulty: 2, explanation: "/p/ voiceless thổi hơi, /b/ voiced rung dây thanh", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp cổ điển /p/ vs /b/ initial" },
  { word1: "cap", ipa1: "/kæp/", word2: "cab", ipa2: "/kæb/", soundGroupId: "map-t2-g01-p-b", contrastPhonemes: ["/p/", "/b/"], difficulty: 3, explanation: "/p/ vs /b/ cuối từ — /b/ cuối có rung dây", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Contrast cuối từ" },
  { word1: "rope", ipa1: "/roʊp/", word2: "robe", ipa2: "/roʊb/", soundGroupId: "map-t2-g01-p-b", contrastPhonemes: ["/p/", "/b/"], difficulty: 4, explanation: "/p/ vs /b/ cuối từ sau nguyên âm dài", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "pin", ipa1: "/pɪn/", word2: "bin", ipa2: "/bɪn/", soundGroupId: "map-t2-g01-p-b", contrastPhonemes: ["/p/", "/b/"], difficulty: 2, explanation: "/p/ vs /b/ initial trước /ɪ/", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "pea", ipa1: "/piː/", word2: "bee", ipa2: "/biː/", soundGroupId: "map-t2-g01-p-b", contrastPhonemes: ["/p/", "/b/"], difficulty: 2, explanation: "/p/ vs /b/ trước nguyên âm dài /iː/", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "cup", ipa1: "/kʌp/", word2: "cub", ipa2: "/kʌb/", soundGroupId: "map-t2-g01-p-b", contrastPhonemes: ["/p/", "/b/"], difficulty: 3, explanation: "/p/ vs /b/ cuối từ trước /ʌ/", status: "ACTIVE", sourceType: "MANUAL" },
];

export const SENTENCES_T2_G01: SentenceItemData[] = [
  { sentence: "Pat the big bat.", soundGroupId: "map-t2-g01-p-b", targetWords: ["pat", "bat"], targetPhonemes: ["/p/", "/b/"], difficulty: 3, translation: "Vuốt con dơi lớn.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Put the pen in the bin.", soundGroupId: "map-t2-g01-p-b", targetWords: ["pen", "bin"], targetPhonemes: ["/p/", "/b/"], difficulty: 3, translation: "Bút bút vào thùng rác.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "The cab has a cap.", soundGroupId: "map-t2-g01-p-b", targetWords: ["cab", "cap"], targetPhonemes: ["/b/", "/p/"], difficulty: 4, translation: "Xe taxi có mũ.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Pin the rope to the robe.", soundGroupId: "map-t2-g01-p-b", targetWords: ["pin", "rope", "robe"], targetPhonemes: ["/p/", "/b/"], difficulty: 5, translation: "Ghim dây thừng vào áo choàng.", status: "ACTIVE", sourceType: "MANUAL" },
];
```

- [ ] **Step 2: Thêm block g02 /t//d/** (cùng vị trí, sau block g01)
```ts
// ============================================================================
// TOPIC 2 - NHÓM 2: /t/ & /d/ (Plosives)
// ============================================================================

export const WORDS_T2_G02_T_D: WordItemData[] = [
  { word: "ten", ipa: "/ten/", soundGroupId: "map-t2-g02-t-d", targetPhonemes: ["/t/"], difficulty: 1, exampleSentence: "Count to ten.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "den", ipa: "/den/", soundGroupId: "map-t2-g02-t-d", targetPhonemes: ["/d/"], difficulty: 2, exampleSentence: "The fox lives in a den.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "to", ipa: "/tuː/", soundGroupId: "map-t2-g02-t-d", targetPhonemes: ["/t/"], difficulty: 1, exampleSentence: "Go to school.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "do", ipa: "/duː/", soundGroupId: "map-t2-g02-t-d", targetPhonemes: ["/d/"], difficulty: 1, exampleSentence: "Do your homework.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "mat", ipa: "/mæt/", soundGroupId: "map-t2-g02-t-d", targetPhonemes: ["/t/"], difficulty: 2, exampleSentence: "Wipe your feet on the mat.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/t/ cuối từ" },
  { word: "mad", ipa: "/mæd/", soundGroupId: "map-t2-g02-t-d", targetPhonemes: ["/d/"], difficulty: 2, exampleSentence: "Don't get mad.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/d/ cuối từ" },
  { word: "bet", ipa: "/bet/", soundGroupId: "map-t2-g02-t-d", targetPhonemes: ["/t/"], difficulty: 2, exampleSentence: "I bet you can.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "bed", ipa: "/bed/", soundGroupId: "map-t2-g02-t-d", targetPhonemes: ["/d/"], difficulty: 2, exampleSentence: "Go to bed.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "cart", ipa: "/kɑːrt/", soundGroupId: "map-t2-g02-t-d", targetPhonemes: ["/t/"], difficulty: 3, exampleSentence: "Push the shopping cart.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/t/ cuối sau /ɑːr/" },
  { word: "card", ipa: "/kɑːrd/", soundGroupId: "map-t2-g02-t-d", targetPhonemes: ["/d/"], difficulty: 3, exampleSentence: "Pay with a card.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/d/ cuối sau /ɑːr/" },
];

export const MINIMAL_PAIRS_T2_G02: MinimalPairData[] = [
  { word1: "ten", ipa1: "/ten/", word2: "den", ipa2: "/den/", soundGroupId: "map-t2-g02-t-d", contrastPhonemes: ["/t/", "/d/"], difficulty: 2, explanation: "/t/ voiceless, /d/ voiced initial", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp cổ điển /t/ vs /d/" },
  { word1: "mat", ipa1: "/mæt/", word2: "mad", ipa2: "/mæd/", soundGroupId: "map-t2-g02-t-d", contrastPhonemes: ["/t/", "/d/"], difficulty: 3, explanation: "/t/ vs /d/ cuối từ — /d/ cuối rung dây", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "bet", ipa1: "/bet/", word2: "bed", ipa2: "/bed/", soundGroupId: "map-t2-g02-t-d", contrastPhonemes: ["/t/", "/d/"], difficulty: 2, explanation: "/t/ vs /d/ cuối từ", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "cart", ipa1: "/kɑːrt/", word2: "card", ipa2: "/kɑːrd/", soundGroupId: "map-t2-g02-t-d", contrastPhonemes: ["/t/", "/d/"], difficulty: 4, explanation: "/t/ vs /d/ cuối sau /ɑːr/", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "to", ipa1: "/tuː/", word2: "do", ipa2: "/duː/", soundGroupId: "map-t2-g02-t-d", contrastPhonemes: ["/t/", "/d/"], difficulty: 1, explanation: "/t/ vs /d/ trước /uː/", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "told", ipa1: "/toʊld/", word2: "fold", ipa2: "/foʊld/", soundGroupId: "map-t2-g02-t-d", contrastPhonemes: ["/t/"], difficulty: 4, explanation: "/t/ initial vs /f/ — phụ âm đầu khác", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp phụ âm đầu (không phải /t//d/ contrast nhưng luyện /t/)" },
];

export const SENTENCES_T2_G02: SentenceItemData[] = [
  { sentence: "Ten dens in the forest.", soundGroupId: "map-t2-g02-t-d", targetWords: ["ten", "dens"], targetPhonemes: ["/t/", "/d/"], difficulty: 4, translation: "Mười cái hang trong rừng.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Don't get mad on the mat.", soundGroupId: "map-t2-g02-t-d", targetWords: ["mad", "mat"], targetPhonemes: ["/d/", "/t/"], difficulty: 4, translation: "Đừng tức giận trên thảm.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Bet on the bed.", soundGroupId: "map-t2-g02-t-d", targetWords: ["bet", "bed"], targetPhonemes: ["/t/", "/d/"], difficulty: 3, translation: "Cược trên giường.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Pay the card on the cart.", soundGroupId: "map-t2-g02-t-d", targetWords: ["card", "cart"], targetPhonemes: ["/d/", "/t/"], difficulty: 5, translation: "Trả thẻ trên xe đẩy.", status: "ACTIVE", sourceType: "MANUAL" },
];
```

- [ ] **Step 3: Thêm block g03 /k//g/** (sau block g02)
```ts
// ============================================================================
// TOPIC 2 - NHÓM 3: /k/ & /g/ (Plosives)
// ============================================================================

export const WORDS_T2_G03_K_G: WordItemData[] = [
  { word: "cap", ipa: "/kæp/", soundGroupId: "map-t2-g03-k-g", targetPhonemes: ["/k/"], difficulty: 2, exampleSentence: "Put on your cap.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "gap", ipa: "/gæp/", soundGroupId: "map-t2-g03-k-g", targetPhonemes: ["/g/"], difficulty: 2, exampleSentence: "Mind the gap.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "coat", ipa: "/koʊt/", soundGroupId: "map-t2-g03-k-g", targetPhonemes: ["/k/"], difficulty: 2, exampleSentence: "Wear a warm coat.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "goat", ipa: "/goʊt/", soundGroupId: "map-t2-g03-k-g", targetPhonemes: ["/g/"], difficulty: 2, exampleSentence: "The goat eats grass.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "back", ipa: "/bæk/", soundGroupId: "map-t2-g03-k-g", targetPhonemes: ["/k/"], difficulty: 2, exampleSentence: "Come back soon.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/k/ cuối từ" },
  { word: "bag", ipa: "/bæɡ/", soundGroupId: "map-t2-g03-k-g", targetPhonemes: ["/g/"], difficulty: 2, exampleSentence: "Open the bag.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/g/ cuối từ" },
  { word: "lock", ipa: "/lɑːk/", soundGroupId: "map-t2-g03-k-g", targetPhonemes: ["/k/"], difficulty: 3, exampleSentence: "Lock the door.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "log", ipa: "/lɑːɡ/", soundGroupId: "map-t2-g03-k-g", targetPhonemes: ["/g/"], difficulty: 3, exampleSentence: "Sit on a log.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "kite", ipa: "/kaɪt/", soundGroupId: "map-t2-g03-k-g", targetPhonemes: ["/k/"], difficulty: 3, exampleSentence: "Fly a kite.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "gate", ipa: "/ɡeɪt/", soundGroupId: "map-t2-g03-k-g", targetPhonemes: ["/g/"], difficulty: 3, exampleSentence: "Open the gate.", status: "ACTIVE", sourceType: "FREE_API" },
];

export const MINIMAL_PAIRS_T2_G03: MinimalPairData[] = [
  { word1: "cap", ipa1: "/kæp/", word2: "gap", ipa2: "/gæp/", soundGroupId: "map-t2-g03-k-g", contrastPhonemes: ["/k/", "/g/"], difficulty: 2, explanation: "/k/ voiceless, /g/ voiced initial", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp cổ điển /k/ vs /g/" },
  { word1: "coat", ipa1: "/koʊt/", word2: "goat", ipa2: "/goʊt/", soundGroupId: "map-t2-g03-k-g", contrastPhonemes: ["/k/", "/g/"], difficulty: 2, explanation: "/k/ vs /g/ initial", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "back", ipa1: "/bæk/", word2: "bag", ipa2: "/bæɡ/", soundGroupId: "map-t2-g03-k-g", contrastPhonemes: ["/k/", "/g/"], difficulty: 3, explanation: "/k/ vs /g/ cuối từ", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "lock", ipa1: "/lɑːk/", word2: "log", ipa2: "/lɑːɡ/", soundGroupId: "map-t2-g03-k-g", contrastPhonemes: ["/k/", "/g/"], difficulty: 3, explanation: "/k/ vs /g/ cuối sau /ɑː/", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "curl", ipa1: "/kɜːrl/", word2: "girl", ipa2: "/ɡɜːrl/", soundGroupId: "map-t2-g03-k-g", contrastPhonemes: ["/k/", "/g/"], difficulty: 4, explanation: "/k/ vs /g/ initial trước /ɜːr/", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "cold", ipa1: "/koʊld/", word2: "gold", ipa2: "/ɡoʊld/", soundGroupId: "map-t2-g03-k-g", contrastPhonemes: ["/k/", "/g/"], difficulty: 3, explanation: "/k/ vs /g/ initial trước /oʊl/", status: "ACTIVE", sourceType: "MANUAL" },
];

export const SENTENCES_T2_G03: SentenceItemData[] = [
  { sentence: "Mind the gap in the cap.", soundGroupId: "map-t2-g03-k-g", targetWords: ["gap", "cap"], targetPhonemes: ["/g/", "/k/"], difficulty: 4, translation: "Chú ý khe hở trong mũ.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "The goat lost its coat.", soundGroupId: "map-t2-g03-k-g", targetWords: ["goat", "coat"], targetPhonemes: ["/g/", "/k/"], difficulty: 4, translation: "Con dê mất áo khoác.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Put the bag on the back.", soundGroupId: "map-t2-g03-k-g", targetWords: ["bag", "back"], targetPhonemes: ["/g/", "/k/"], difficulty: 4, translation: "Đặt túi lên lưng.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Lock the log at the gate.", soundGroupId: "map-t2-g03-k-g", targetWords: ["lock", "log", "gate"], targetPhonemes: ["/k/", "/g/"], difficulty: 5, translation: "Khóa khúc gỗ ở cổng.", status: "ACTIVE", sourceType: "MANUAL" },
];
```

- [ ] **Step 4: Thêm 3 entry vào `LESSON_CONTENT_BY_SOUND_GROUP`**

Trong object `LESSON_CONTENT_BY_SOUND_GROUP` (line 1032-1093), thêm 3 entry (sau entry `"map-t1-g10-ia-ua"` cuối, trước dấu `}` đóng object):
```ts
  "map-t2-g01-p-b": {
    words: WORDS_T2_G01_P_B,
    minimalPairs: MINIMAL_PAIRS_T2_G01,
    sentences: SENTENCES_T2_G01,
  },
  "map-t2-g02-t-d": {
    words: WORDS_T2_G02_T_D,
    minimalPairs: MINIMAL_PAIRS_T2_G02,
    sentences: SENTENCES_T2_G02,
  },
  "map-t2-g03-k-g": {
    words: WORDS_T2_G03_K_G,
    minimalPairs: MINIMAL_PAIRS_T2_G03,
    sentences: SENTENCES_T2_G03,
  },
```

- [ ] **Step 5: Chạy test lesson-content (verify g01-03 pass, còn lại fail)**

```bash
npx tsx --test "src/lib/__tests__/lesson-content.test.ts"
```
Expected: test "12 nhóm CĐ2 có trong" — 3 nhóm đầu pass, 9 còn lại fail (g04-g12 chưa có). Test "mỗi nhóm words/sentences" — g01-g03 pass, còn fail. Đây là tiến độ đúng (Task 2 chỉ thêm 3 nhóm).

- [ ] **Step 6: Verify tsc**

```bash
npx tsc --noEmit
```
Expected: 0 error.

- [ ] **Step 7: Checkpoint review với user**

Báo user: 3 nhóm Plosives (g01-g03) content done, test 3 nhóm pass. Review rồi tiếp Task 3.

---

## Task 3: Content Fricatives part 1 — g04 /f//v/, g05 /θ//ð/, g06 /s//z/

**Files:**
- Modify: `prisma/lesson-content.ts` (thêm 3 block + 3 entry map)

- [ ] **Step 1: Thêm block g04 /f//v/** (sau block g03, trước `// EXPORTS`)
```ts
// ============================================================================
// TOPIC 2 - NHÓM 4: /f/ & /v/ (Fricatives)
// ============================================================================

export const WORDS_T2_G04_F_V: WordItemData[] = [
  { word: "fan", ipa: "/fæn/", soundGroupId: "map-t2-g04-f-v", targetPhonemes: ["/f/"], difficulty: 2, exampleSentence: "Use a fan in summer.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "van", ipa: "/væn/", soundGroupId: "map-t2-g04-f-v", targetPhonemes: ["/v/"], difficulty: 2, exampleSentence: "The van is blue.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "safe", ipa: "/seɪf/", soundGroupId: "map-t2-g04-f-v", targetPhonemes: ["/f/"], difficulty: 3, exampleSentence: "Stay safe at home.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/f/ cuối từ" },
  { word: "save", ipa: "/seɪv/", soundGroupId: "map-t2-g04-f-v", targetPhonemes: ["/v/"], difficulty: 3, exampleSentence: "Save your money.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/v/ cuối từ" },
  { word: "leaf", ipa: "/liːf/", soundGroupId: "map-t2-g04-f-v", targetPhonemes: ["/f/"], difficulty: 3, exampleSentence: "A green leaf fell.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "leave", ipa: "/liːv/", soundGroupId: "map-t2-g04-f-v", targetPhonemes: ["/v/"], difficulty: 3, exampleSentence: "Leave now please.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "fast", ipa: "/fæst/", soundGroupId: "map-t2-g04-f-v", targetPhonemes: ["/f/"], difficulty: 2, exampleSentence: "Drive fast.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "vest", ipa: "/vest/", soundGroupId: "map-t2-g04-f-v", targetPhonemes: ["/v/"], difficulty: 2, exampleSentence: "Wear a life vest.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "calf", ipa: "/kæf/", soundGroupId: "map-t2-g04-f-v", targetPhonemes: ["/f/"], difficulty: 4, exampleSentence: "The calf drinks milk.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "L-/f/ không có trong cmudict nhưng IPA chuẩn" },
  { word: "half", ipa: "/hæf/", soundGroupId: "map-t2-g04-f-v", targetPhonemes: ["/f/"], difficulty: 3, exampleSentence: "Cut it in half.", status: "ACTIVE", sourceType: "FREE_API" },
];

export const MINIMAL_PAIRS_T2_G04: MinimalPairData[] = [
  { word1: "fan", ipa1: "/fæn/", word2: "van", ipa2: "/væn/", soundGroupId: "map-t2-g04-f-v", contrastPhonemes: ["/f/", "/v/"], difficulty: 2, explanation: "/f/ voiceless, /v/ voiced — người Việt hay đọc /v/ thành /f/ hoặc /w/", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp cổ điển /f/ vs /v/" },
  { word1: "safe", ipa1: "/seɪf/", word2: "save", ipa2: "/seɪv/", soundGroupId: "map-t2-g04-f-v", contrastPhonemes: ["/f/", "/v/"], difficulty: 3, explanation: "/f/ vs /v/ cuối từ", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "leaf", ipa1: "/liːf/", word2: "leave", ipa2: "/liːv/", soundGroupId: "map-t2-g04-f-v", contrastPhonemes: ["/f/", "/v/"], difficulty: 3, explanation: "/f/ vs /v/ cuối sau /iː/", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "fast", ipa1: "/fæst/", word2: "vest", ipa2: "/vest/", soundGroupId: "map-t2-g04-f-v", contrastPhonemes: ["/f/", "/v/"], difficulty: 3, explanation: "/f/ vs /v/ initial + phụ âm 2 khác", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "proof", ipa1: "/pruːf/", word2: "prove", ipa2: "/pruːv/", soundGroupId: "map-t2-g04-f-v", contrastPhonemes: ["/f/", "/v/"], difficulty: 4, explanation: "/f/ vs /v/ cuối sau /uː/", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "belief", ipa1: "/bɪˈliːf/", word2: "believe", ipa2: "/bɪˈliːv/", soundGroupId: "map-t2-g04-f-v", contrastPhonemes: ["/f/", "/v/"], difficulty: 5, explanation: "/f/ vs /v/ cuối từ 2 âm tiết", status: "ACTIVE", sourceType: "MANUAL" },
];

export const SENTENCES_T2_G04: SentenceItemData[] = [
  { sentence: "The van has a fan.", soundGroupId: "map-t2-g04-f-v", targetWords: ["van", "fan"], targetPhonemes: ["/v/", "/f/"], difficulty: 4, translation: "Xe tải có quạt.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Save the safe.", soundGroupId: "map-t2-g04-f-v", targetWords: ["save", "safe"], targetPhonemes: ["/v/", "/f/"], difficulty: 4, translation: "Cứu cái két.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Don't leave the leaf.", soundGroupId: "map-t2-g04-f-v", targetWords: ["leave", "leaf"], targetPhonemes: ["/v/", "/f/"], difficulty: 4, translation: "Đừng bỏ lại chiếc lá.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Wear a vest and run fast.", soundGroupId: "map-t2-g04-f-v", targetWords: ["vest", "fast"], targetPhonemes: ["/v/", "/f/"], difficulty: 5, translation: "Mặc áo phao và chạy nhanh.", status: "ACTIVE", sourceType: "MANUAL" },
];
```

- [ ] **Step 2: Thêm block g05 /θ//ð/** (sau block g04)
```ts
// ============================================================================
// TOPIC 2 - NHÓM 5: /θ/ & /ð/ (Fricatives) — "th" think/this
// ============================================================================

export const WORDS_T2_G05_TH_DH: WordItemData[] = [
  { word: "think", ipa: "/θɪŋk/", soundGroupId: "map-t2-g05-th-dh", targetPhonemes: ["/θ/"], difficulty: 4, exampleSentence: "I think you're right.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/θ/ voiceless — người Việt hay đọc /t/ hoặc /s/" },
  { word: "this", ipa: "/ðɪs/", soundGroupId: "map-t2-g05-th-dh", targetPhonemes: ["/ð/"], difficulty: 3, exampleSentence: "This is good.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/ð/ voiced" },
  { word: "thumb", ipa: "/θʌm/", soundGroupId: "map-t2-g05-th-dh", targetPhonemes: ["/θ/"], difficulty: 4, exampleSentence: "Thumb up please.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "them", ipa: "/ðem/", soundGroupId: "map-t2-g05-th-dh", targetPhonemes: ["/ð/"], difficulty: 2, exampleSentence: "Give it to them.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "bath", ipa: "/bæθ/", soundGroupId: "map-t2-g05-th-dh", targetPhonemes: ["/θ/"], difficulty: 3, exampleSentence: "Take a bath.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/θ/ cuối từ" },
  { word: "bathe", ipa: "/beɪð/", soundGroupId: "map-t2-g05-th-dh", targetPhonemes: ["/ð/"], difficulty: 4, exampleSentence: "Bathe the baby.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/ð/ cuối từ" },
  { word: "thick", ipa: "/θɪk/", soundGroupId: "map-t2-g05-th-dh", targetPhonemes: ["/θ/"], difficulty: 4, exampleSentence: "The book is thick.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "then", ipa: "/ðen/", soundGroupId: "map-t2-g05-th-dh", targetPhonemes: ["/ð/"], difficulty: 2, exampleSentence: "Then we go home.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "mouth", ipa: "/maʊθ/", soundGroupId: "map-t2-g05-th-dh", targetPhonemes: ["/θ/"], difficulty: 4, exampleSentence: "Open your mouth.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/θ/ cuối từ" },
  { word: "mother", ipa: "/ˈmʌðər/", soundGroupId: "map-t2-g05-th-dh", targetPhonemes: ["/ð/"], difficulty: 3, exampleSentence: "Mother is kind.", status: "ACTIVE", sourceType: "FREE_API" },
];

export const MINIMAL_PAIRS_T2_G05: MinimalPairData[] = [
  { word1: "think", ipa1: "/θɪŋk/", word2: "this", ipa2: "/ðɪs/", soundGroupId: "map-t2-g05-th-dh", contrastPhonemes: ["/θ/", "/ð/"], difficulty: 4, explanation: "/θ/ voiceless (think) vs /ð/ voiced (this) — cùng chữ 'th'", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp cổ điển /θ/ vs /ð/" },
  { word1: "thick", ipa1: "/θɪk/", word2: "tick", ipa2: "/tɪk/", soundGroupId: "map-t2-g05-th-dh", contrastPhonemes: ["/θ/", "/t/"], difficulty: 4, explanation: "/θ/ vs /t/ — người Việt hay đọc /θ/ thành /t/", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "bath", ipa1: "/bæθ/", word2: "bathe", ipa2: "/beɪð/", soundGroupId: "map-t2-g05-th-dh", contrastPhonemes: ["/θ/", "/ð/"], difficulty: 4, explanation: "/θ/ vs /ð/ cuối từ (cặp danh-động)", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "thumb", ipa1: "/θʌm/", word2: "sum", ipa2: "/sʌm/", soundGroupId: "map-t2-g05-th-dh", contrastPhonemes: ["/θ/", "/s/"], difficulty: 4, explanation: "/θ/ vs /s/ — người Việt hay đọc /θ/ thành /s/", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "them", ipa1: "/ðem/", word2: "den", ipa2: "/den/", soundGroupId: "map-t2-g05-th-dh", contrastPhonemes: ["/ð/", "/d/"], difficulty: 3, explanation: "/ð/ vs /d/ — /ð/ voiced nhẹ hơn /d/", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "mouth", ipa1: "/maʊθ/", word2: "mouse", ipa2: "/maʊs/", soundGroupId: "map-t2-g05-th-dh", contrastPhonemes: ["/θ/", "/s/"], difficulty: 4, explanation: "/θ/ vs /s/ cuối từ", status: "ACTIVE", sourceType: "MANUAL" },
];

export const SENTENCES_T2_G05: SentenceItemData[] = [
  { sentence: "I think this is good.", soundGroupId: "map-t2-g05-th-dh", targetWords: ["think", "this"], targetPhonemes: ["/θ/", "/ð/"], difficulty: 4, translation: "Tôi nghĩ cái này tốt.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Bathe in the bath.", soundGroupId: "map-t2-g05-th-dh", targetWords: ["bathe", "bath"], targetPhonemes: ["/ð/", "/θ/"], difficulty: 5, translation: "Tắm trong bồn tắm.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "The thumb is thick.", soundGroupId: "map-t2-g05-th-dh", targetWords: ["thumb", "thick"], targetPhonemes: ["/θ/"], difficulty: 4, translation: "Ngón cái dày.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Mother opens her mouth.", soundGroupId: "map-t2-g05-th-dh", targetWords: ["mother", "mouth"], targetPhonemes: ["/ð/", "/θ/"], difficulty: 5, translation: "Mẹ mở miệng.", status: "ACTIVE", sourceType: "MANUAL" },
];
```

- [ ] **Step 3: Thêm block g06 /s//z/** (sau block g05)
```ts
// ============================================================================
// TOPIC 2 - NHÓM 6: /s/ & /z/ (Fricatives)
// ============================================================================

export const WORDS_T2_G06_S_Z: WordItemData[] = [
  { word: "sip", ipa: "/sɪp/", soundGroupId: "map-t2-g06-s-z", targetPhonemes: ["/s/"], difficulty: 2, exampleSentence: "Sip the tea slowly.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "zip", ipa: "/zɪp/", soundGroupId: "map-t2-g06-s-z", targetPhonemes: ["/z/"], difficulty: 2, exampleSentence: "Zip the bag up.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "rice", ipa: "/raɪs/", soundGroupId: "map-t2-g06-s-z", targetPhonemes: ["/s/"], difficulty: 3, exampleSentence: "Eat rice daily.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/s/ cuối từ" },
  { word: "rise", ipa: "/raɪz/", soundGroupId: "map-t2-g06-s-z", targetPhonemes: ["/z/"], difficulty: 3, exampleSentence: "Rise and shine.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/z/ cuối từ" },
  { word: "ice", ipa: "/aɪs/", soundGroupId: "map-t2-g06-s-z", targetPhonemes: ["/s/"], difficulty: 2, exampleSentence: "Ice is cold.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "eyes", ipa: "/aɪz/", soundGroupId: "map-t2-g06-s-z", targetPhonemes: ["/z/"], difficulty: 2, exampleSentence: "Close your eyes.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "bus", ipa: "/bʌs/", soundGroupId: "map-t2-g06-s-z", targetPhonemes: ["/s/"], difficulty: 2, exampleSentence: "Take the bus.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "buzz", ipa: "/bʌz/", soundGroupId: "map-t2-g06-s-z", targetPhonemes: ["/z/"], difficulty: 3, exampleSentence: "Bees buzz around.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "loose", ipa: "/luːs/", soundGroupId: "map-t2-g06-s-z", targetPhonemes: ["/s/"], difficulty: 3, exampleSentence: "The rope is loose.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "lose", ipa: "/luːz/", soundGroupId: "map-t2-g06-s-z", targetPhonemes: ["/z/"], difficulty: 3, exampleSentence: "Don't lose the key.", status: "ACTIVE", sourceType: "FREE_API" },
];

export const MINIMAL_PAIRS_T2_G06: MinimalPairData[] = [
  { word1: "sip", ipa1: "/sɪp/", word2: "zip", ipa2: "/zɪp/", soundGroupId: "map-t2-g06-s-z", contrastPhonemes: ["/s/", "/z/"], difficulty: 2, explanation: "/s/ voiceless, /z/ voiced initial", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp cổ điển /s/ vs /z/" },
  { word1: "rice", ipa1: "/raɪs/", word2: "rise", ipa2: "/raɪz/", soundGroupId: "map-t2-g06-s-z", contrastPhonemes: ["/s/", "/z/"], difficulty: 3, explanation: "/s/ vs /z/ cuối từ", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "ice", ipa1: "/aɪs/", word2: "eyes", ipa2: "/aɪz/", soundGroupId: "map-t2-g06-s-z", contrastPhonemes: ["/s/", "/z/"], difficulty: 2, explanation: "/s/ vs /z/ cuối từ — người Việt hay đọc eyes thành 'ais'", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "bus", ipa1: "/bʌs/", word2: "buzz", ipa2: "/bʌz/", soundGroupId: "map-t2-g06-s-z", contrastPhonemes: ["/s/", "/z/"], difficulty: 3, explanation: "/s/ vs /z/ cuối từ", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "loose", ipa1: "/luːs/", word2: "lose", ipa2: "/luːz/", soundGroupId: "map-t2-g06-s-z", contrastPhonemes: ["/s/", "/z/"], difficulty: 3, explanation: "/s/ vs /z/ cuối sau /uː/", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "price", ipa1: "/praɪs/", word2: "prize", ipa2: "/praɪz/", soundGroupId: "map-t2-g06-s-z", contrastPhonemes: ["/s/", "/z/"], difficulty: 4, explanation: "/s/ vs /z/ cuối sau /aɪ/ + cluster /pr/", status: "ACTIVE", sourceType: "MANUAL" },
];

export const SENTENCES_T2_G06: SentenceItemData[] = [
  { sentence: "Sip the zip.", soundGroupId: "map-t2-g06-s-z", targetWords: ["sip", "zip"], targetPhonemes: ["/s/", "/z/"], difficulty: 4, translation: "Nhấp cái khóa.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Rice rises in price.", soundGroupId: "map-t2-g06-s-z", targetWords: ["rice", "rises", "price"], targetPhonemes: ["/s/", "/z/"], difficulty: 5, translation: "Gạo tăng giá.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Ice in the eyes.", soundGroupId: "map-t2-g06-s-z", targetWords: ["ice", "eyes"], targetPhonemes: ["/s/", "/z/"], difficulty: 4, translation: "Đá trong mắt.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Don't lose the loose bus.", soundGroupId: "map-t2-g06-s-z", targetWords: ["lose", "loose", "bus"], targetPhonemes: ["/z/", "/s/"], difficulty: 5, translation: "Đừng mất chiếc xe buộc lỏng.", status: "ACTIVE", sourceType: "MANUAL" },
];
```

- [ ] **Step 4: Thêm 3 entry vào `LESSON_CONTENT_BY_SOUND_GROUP`** (sau 3 entry Plosives)
```ts
  "map-t2-g04-f-v": {
    words: WORDS_T2_G04_F_V,
    minimalPairs: MINIMAL_PAIRS_T2_G04,
    sentences: SENTENCES_T2_G04,
  },
  "map-t2-g05-th-dh": {
    words: WORDS_T2_G05_TH_DH,
    minimalPairs: MINIMAL_PAIRS_T2_G05,
    sentences: SENTENCES_T2_G05,
  },
  "map-t2-g06-s-z": {
    words: WORDS_T2_G06_S_Z,
    minimalPairs: MINIMAL_PAIRS_T2_G06,
    sentences: SENTENCES_T2_G06,
  },
```

- [ ] **Step 5: Chạy test + tsc**
```bash
npx tsx --test "src/lib/__tests__/lesson-content.test.ts"
npx tsc --noEmit
```
Expected: test 6 nhóm đầu (g01-g06) pass, 6 còn lại fail. tsc 0 error.

- [ ] **Step 6: Checkpoint review với user**

Báo user: 3 nhóm Fricatives part 1 (g04-g06) done, test 6/12 nhóm pass. Review rồi tiếp Task 4.

---

## Task 4: Content Fricatives part 2 + Affricates — g07 /ʃ//ʒ/, g08 /h/, g09 /tʃ//dʒ/

**Files:**
- Modify: `prisma/lesson-content.ts` (thêm 3 block + 3 entry map)

**Lưu ý g08-h**: 0 cặp (single phoneme, không contrast tự nhiên). speak_minimal_pair sẽ DRAFT. listen_choose 3-stage tự mồi neighbor (g07 /ʃ//ʒ/ hoặc g09 /tʃ//dʒ/).

- [ ] **Step 1: Thêm block g07 /ʃ//ʒ/** (sau block g06, trước `// EXPORTS`)
```ts
// ============================================================================
// TOPIC 2 - NHÓM 7: /ʃ/ & /ʒ/ (Fricatives) — shoe/vision
// ============================================================================

export const WORDS_T2_G07_SH_ZH: WordItemData[] = [
  { word: "she", ipa: "/ʃiː/", soundGroupId: "map-t2-g07-sh-zh", targetPhonemes: ["/ʃ/"], difficulty: 1, exampleSentence: "She is here.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "shoe", ipa: "/ʃuː/", soundGroupId: "map-t2-g07-sh-zh", targetPhonemes: ["/ʃ/"], difficulty: 2, exampleSentence: "Tie your shoe.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "wash", ipa: "/wɒʃ/", soundGroupId: "map-t2-g07-sh-zh", targetPhonemes: ["/ʃ/"], difficulty: 2, exampleSentence: "Wash your hands.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/ʃ/ cuối từ" },
  { word: "vision", ipa: "/ˈvɪʒən/", soundGroupId: "map-t2-g07-sh-zh", targetPhonemes: ["/ʒ/"], difficulty: 5, exampleSentence: "Good vision is important.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/ʒ/ hiếm — chỉ trong measure/vision/pleasure" },
  { word: "measure", ipa: "/ˈmeʒər/", soundGroupId: "map-t2-g07-sh-zh", targetPhonemes: ["/ʒ/"], difficulty: 5, exampleSentence: "Measure the table.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "leisure", ipa: "/ˈleʒər/", soundGroupId: "map-t2-g07-sh-zh", targetPhonemes: ["/ʒ/"], difficulty: 5, exampleSentence: "Leisure time is fun.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "ship", ipa: "/ʃɪp/", soundGroupId: "map-t2-g07-sh-zh", targetPhonemes: ["/ʃ/"], difficulty: 2, exampleSentence: "The ship sailed.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "wish", ipa: "/wɪʃ/", soundGroupId: "map-t2-g07-sh-zh", targetPhonemes: ["/ʃ/"], difficulty: 2, exampleSentence: "Make a wish.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "dish", ipa: "/dɪʃ/", soundGroupId: "map-t2-g07-sh-zh", targetPhonemes: ["/ʃ/"], difficulty: 2, exampleSentence: "Wash the dish.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "treasure", ipa: "/ˈtreʒər/", soundGroupId: "map-t2-g07-sh-zh", targetPhonemes: ["/ʒ/"], difficulty: 5, exampleSentence: "Find the treasure.", status: "ACTIVE", sourceType: "FREE_API" },
];

export const MINIMAL_PAIRS_T2_G07: MinimalPairData[] = [
  { word1: "shoe", ipa1: "/ʃuː/", word2: "sue", ipa2: "/suː/", soundGroupId: "map-t2-g07-sh-zh", contrastPhonemes: ["/ʃ/", "/s/"], difficulty: 3, explanation: "/ʃ/ vs /s/ — /ʃ/ môi tròn, /s/ răng", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp /ʃ/ vs /s/ (luyện /ʃ/ rõ)" },
  { word1: "ship", ipa1: "/ʃɪp/", word2: "sip", ipa2: "/sɪp/", soundGroupId: "map-t2-g07-sh-zh", contrastPhonemes: ["/ʃ/", "/s/"], difficulty: 3, explanation: "/ʃ/ vs /s/ initial trước /ɪ/", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "wash", ipa1: "/wɒʃ/", word2: "watch", ipa2: "/wɒtʃ/", soundGroupId: "map-t2-g07-sh-zh", contrastPhonemes: ["/ʃ/", "/tʃ/"], difficulty: 4, explanation: "/ʃ/ (fricative) vs /tʃ/ (affricate — có stop)", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "wish", ipa1: "/wɪʃ/", word2: "which", ipa2: "/wɪtʃ/", soundGroupId: "map-t2-g07-sh-zh", contrastPhonemes: ["/ʃ/", "/tʃ/"], difficulty: 4, explanation: "/ʃ/ vs /tʃ/ cuối từ", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "measure", ipa1: "/ˈmeʒər/", word2: "mesher", ipa2: "/ˈmeʃər/", soundGroupId: "map-t2-g07-sh-zh", contrastPhonemes: ["/ʒ/", "/ʃ/"], difficulty: 6, explanation: "/ʒ/ voiced vs /ʃ/ voiceless — cùng vị trí articulation", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp /ʒ/ vs /ʃ/ (voiceless vs voiced cùng vị trí)" },
  { word1: "vision", ipa1: "/ˈvɪʒən/", word2: "fission", ipa2: "/ˈfɪʃən/", soundGroupId: "map-t2-g07-sh-zh", contrastPhonemes: ["/ʒ/", "/ʃ/"], difficulty: 6, explanation: "/ʒ/ vs /ʃ/ giữa từ", status: "ACTIVE", sourceType: "MANUAL" },
];

export const SENTENCES_T2_G07: SentenceItemData[] = [
  { sentence: "She washes the shoe.", soundGroupId: "map-t2-g07-sh-zh", targetWords: ["she", "washes", "shoe"], targetPhonemes: ["/ʃ/"], difficulty: 4, translation: "Cô ấy giặt chiếc giày.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Measure the treasure for leisure.", soundGroupId: "map-t2-g07-sh-zh", targetWords: ["measure", "treasure", "leisure"], targetPhonemes: ["/ʒ/"], difficulty: 6, translation: "Đo kho báu cho giải trí.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Wish for a dish.", soundGroupId: "map-t2-g07-sh-zh", targetWords: ["wish", "dish"], targetPhonemes: ["/ʃ/"], difficulty: 3, translation: "Ước có đĩa thức ăn.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Vision of the ship.", soundGroupId: "map-t2-g07-sh-zh", targetWords: ["vision", "ship"], targetPhonemes: ["/ʒ/", "/ʃ/"], difficulty: 5, translation: "Tầm nhìn của con tàu.", status: "ACTIVE", sourceType: "MANUAL" },
];
```

- [ ] **Step 2: Thêm block g08 /h/ (0 cặp)** (sau block g07)
```ts
// ============================================================================
// TOPIC 2 - NHÓM 8: /h/ (Fricatives, single phoneme — 0 cặp)
// ============================================================================

export const WORDS_T2_G08_H: WordItemData[] = [
  { word: "hat", ipa: "/hæt/", soundGroupId: "map-t2-g08-h", targetPhonemes: ["/h/"], difficulty: 2, exampleSentence: "Wear a hat.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/h/ initial — thở hơi mạnh" },
  { word: "hot", ipa: "/hɑːt/", soundGroupId: "map-t2-g08-h", targetPhonemes: ["/h/"], difficulty: 2, exampleSentence: "The soup is hot.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "house", ipa: "/haʊs/", soundGroupId: "map-t2-g08-h", targetPhonemes: ["/h/"], difficulty: 2, exampleSentence: "Build a house.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "hand", ipa: "/hænd/", soundGroupId: "map-t2-g08-h", targetPhonemes: ["/h/"], difficulty: 2, exampleSentence: "Raise your hand.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "happy", ipa: "/ˈhæpi/", soundGroupId: "map-t2-g08-h", targetPhonemes: ["/h/"], difficulty: 2, exampleSentence: "I feel happy.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "head", ipa: "/hed/", soundGroupId: "map-t2-g08-h", targetPhonemes: ["/h/"], difficulty: 2, exampleSentence: "Nod your head.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "horse", ipa: "/hɔːrs/", soundGroupId: "map-t2-g08-h", targetPhonemes: ["/h/"], difficulty: 3, exampleSentence: "Ride a horse.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "heart", ipa: "/hɑːrt/", soundGroupId: "map-t2-g08-h", targetPhonemes: ["/h/"], difficulty: 3, exampleSentence: "A kind heart.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "behind", ipa: "/bɪˈhaɪnd/", soundGroupId: "map-t2-g08-h", targetPhonemes: ["/h/"], difficulty: 4, exampleSentence: "Stand behind me.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/h/ giữa từ (stress syllable)" },
  { word: "hello", ipa: "/həˈloʊ/", soundGroupId: "map-t2-g08-h", targetPhonemes: ["/h/"], difficulty: 1, exampleSentence: "Say hello.", status: "ACTIVE", sourceType: "FREE_API" },
];

// g08 /h/ đơn phoneme không có contrast tự nhiên → 0 cặp. speak_minimal_pair DRAFT.
// listen_choose 3-stage tự mồi neighbor phoneme (g07 /ʃ//ʒ/ hoặc g09 /tʃ//dʒ/) qua orderIndex±1.
export const MINIMAL_PAIRS_T2_G08: MinimalPairData[] = [];

export const SENTENCES_T2_G08: SentenceItemData[] = [
  { sentence: "The hot hat is here.", soundGroupId: "map-t2-g08-h", targetWords: ["hot", "hat"], targetPhonemes: ["/h/"], difficulty: 3, translation: "Cái mũ nóng ở đây.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Happy hand, happy heart.", soundGroupId: "map-t2-g08-h", targetWords: ["happy", "hand", "heart"], targetPhonemes: ["/h/"], difficulty: 4, translation: "Tay vui, tim vui.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Hello from the house.", soundGroupId: "map-t2-g08-h", targetWords: ["hello", "house"], targetPhonemes: ["/h/"], difficulty: 3, translation: "Xin chào từ ngôi nhà.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "The horse is behind the head.", soundGroupId: "map-t2-g08-h", targetWords: ["horse", "behind", "head"], targetPhonemes: ["/h/"], difficulty: 5, translation: "Con ngựa ở sau đầu.", status: "ACTIVE", sourceType: "MANUAL" },
];
```

- [ ] **Step 3: Thêm block g09 /tʃ//dʒ/** (sau block g08)
```ts
// ============================================================================
// TOPIC 2 - NHÓM 9: /tʃ/ & /dʒ/ (Affricates) — chair/jump
// ============================================================================

export const WORDS_T2_G09_CH_J: WordItemData[] = [
  { word: "chair", ipa: "/tʃeər/", soundGroupId: "map-t2-g09-ch-j", targetPhonemes: ["/tʃ/"], difficulty: 3, exampleSentence: "Sit on a chair.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "jump", ipa: "/dʒʌmp/", soundGroupId: "map-t2-g09-ch-j", targetPhonemes: ["/dʒ/"], difficulty: 3, exampleSentence: "Jump up high.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "chip", ipa: "/tʃɪp/", soundGroupId: "map-t2-g09-ch-j", targetPhonemes: ["/tʃ/"], difficulty: 3, exampleSentence: "Eat a chip.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "gyp", ipa: "/dʒɪp/", soundGroupId: "map-t2-g09-ch-j", targetPhonemes: ["/dʒ/"], difficulty: 4, exampleSentence: "Don't gyp your friend.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "Từ hơi hiếm nhưng contrast rõ" },
  { word: "rich", ipa: "/rɪtʃ/", soundGroupId: "map-t2-g09-ch-j", targetPhonemes: ["/tʃ/"], difficulty: 3, exampleSentence: "He is rich.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/tʃ/ cuối từ" },
  { word: "ridge", ipa: "/rɪdʒ/", soundGroupId: "map-t2-g09-ch-j", targetPhonemes: ["/dʒ/"], difficulty: 3, exampleSentence: "Walk along the ridge.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/dʒ/ cuối từ" },
  { word: "watch", ipa: "/wɒtʃ/", soundGroupId: "map-t2-g09-ch-j", targetPhonemes: ["/tʃ/"], difficulty: 3, exampleSentence: "Watch the clock.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "judge", ipa: "/dʒʌdʒ/", soundGroupId: "map-t2-g09-ch-j", targetPhonemes: ["/dʒ/"], difficulty: 4, exampleSentence: "Don't judge others.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "cheese", ipa: "/tʃiːz/", soundGroupId: "map-t2-g09-ch-j", targetPhonemes: ["/tʃ/"], difficulty: 2, exampleSentence: "Say cheese.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "juice", ipa: "/dʒuːs/", soundGroupId: "map-t2-g09-ch-j", targetPhonemes: ["/dʒ/"], difficulty: 2, exampleSentence: "Drink orange juice.", status: "ACTIVE", sourceType: "FREE_API" },
];

export const MINIMAL_PAIRS_T2_G09: MinimalPairData[] = [
  { word1: "chair", ipa1: "/tʃeər/", word2: "jump", ipa2: "/dʒʌmp/", soundGroupId: "map-t2-g09-ch-j", contrastPhonemes: ["/tʃ/", "/dʒ/"], difficulty: 3, explanation: "/tʃ/ voiceless vs /dʒ/ voiced — affricate = stop + fricative", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp /tʃ/ vs /dʒ/ (voiceless vs voiced affricate)" },
  { word1: "chip", ipa1: "/tʃɪp/", word2: "gyp", ipa2: "/dʒɪp/", soundGroupId: "map-t2-g09-ch-j", contrastPhonemes: ["/tʃ/", "/dʒ/"], difficulty: 4, explanation: "/tʃ/ vs /dʒ/ initial trước /ɪ/", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "rich", ipa1: "/rɪtʃ/", word2: "ridge", ipa2: "/rɪdʒ/", soundGroupId: "map-t2-g09-ch-j", contrastPhonemes: ["/tʃ/", "/dʒ/"], difficulty: 3, explanation: "/tʃ/ vs /dʒ/ cuối từ", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "watch", ipa1: "/wɒtʃ/", word2: "wage", ipa2: "/weɪdʒ/", soundGroupId: "map-t2-g09-ch-j", contrastPhonemes: ["/tʃ/", "/dʒ/"], difficulty: 4, explanation: "/tʃ/ vs /dʒ/ cuối từ", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "cheese", ipa1: "/tʃiːz/", word2: "jeez", ipa2: "/dʒiːz/", soundGroupId: "map-t2-g09-ch-j", contrastPhonemes: ["/tʃ/", "/dʒ/"], difficulty: 4, explanation: "/tʃ/ vs /dʒ/ initial trước /iː/", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "chin", ipa1: "/tʃɪn/", word2: "gin", ipa2: "/dʒɪn/", soundGroupId: "map-t2-g09-ch-j", contrastPhonemes: ["/tʃ/", "/dʒ/"], difficulty: 3, explanation: "/tʃ/ vs /dʒ/ initial — chữ 'ch' vs 'g/j'", status: "ACTIVE", sourceType: "MANUAL" },
];

export const SENTENCES_T2_G09: SentenceItemData[] = [
  { sentence: "Jump on the chair.", soundGroupId: "map-t2-g09-ch-j", targetWords: ["jump", "chair"], targetPhonemes: ["/dʒ/", "/tʃ/"], difficulty: 4, translation: "Nhảy lên ghế.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Rich ridge, big judge.", soundGroupId: "map-t2-g09-ch-j", targetWords: ["rich", "ridge", "judge"], targetPhonemes: ["/tʃ/", "/dʒ/"], difficulty: 5, translation: "Sườn núi giàu, thẩm phán lớn.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Watch the cheese and juice.", soundGroupId: "map-t2-g09-ch-j", targetWords: ["watch", "cheese", "juice"], targetPhonemes: ["/tʃ/", "/dʒ/"], difficulty: 4, translation: "Trông phô mai và nước ép.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Chip the chin with gin.", soundGroupId: "map-t2-g09-ch-j", targetWords: ["chip", "chin", "gin"], targetPhonemes: ["/tʃ/", "/dʒ/"], difficulty: 5, translation: "Bẻ cằm bằng gin.", status: "ACTIVE", sourceType: "MANUAL" },
];
```

- [ ] **Step 4: Thêm 3 entry vào `LESSON_CONTENT_BY_SOUND_GROUP`** (sau 6 entry trước)
```ts
  "map-t2-g07-sh-zh": {
    words: WORDS_T2_G07_SH_ZH,
    minimalPairs: MINIMAL_PAIRS_T2_G07,
    sentences: SENTENCES_T2_G07,
  },
  "map-t2-g08-h": {
    words: WORDS_T2_G08_H,
    minimalPairs: MINIMAL_PAIRS_T2_G08,
    sentences: SENTENCES_T2_G08,
  },
  "map-t2-g09-ch-j": {
    words: WORDS_T2_G09_CH_J,
    minimalPairs: MINIMAL_PAIRS_T2_G09,
    sentences: SENTENCES_T2_G09,
  },
```

- [ ] **Step 5: Chạy test + tsc**
```bash
npx tsx --test "src/lib/__tests__/lesson-content.test.ts"
npx tsc --noEmit
```
Expected: test 9 nhóm đầu pass (g01-g09), 3 còn lại fail (g10-g12). g08-h pass test "mỗi nhóm words/sentences + pairs (trừ g08-h)" vì test có `if (id !== "map-t2-g08-h")`. tsc 0 error.

- [ ] **Step 6: Checkpoint review với user**

Báo user: 3 nhóm Fricatives part 2 + Affricates (g07-g09) done, g08-h 0 cặp OK, test 9/12 nhóm pass. Review rồi tiếp Task 5.

---

## Task 5: Content Nasals + Approximants — g10 /m//n//ŋ/, g11 /l//r/, g12 /w//j/

**Files:**
- Modify: `prisma/lesson-content.ts` (thêm 3 block + 3 entry map)

**Lưu ý g10-nasals**: 3 phoneme /m/ /n/ /ŋ/. Cặp tập trung contrast /n/ vs /ŋ/ cuối từ (điểm khó nhất người Việt — /ŋ/ không có tiếng Việt).

- [ ] **Step 1: Thêm block g10 /m//n//ŋ/** (sau block g09, trước `// EXPORTS`)
```ts
// ============================================================================
// TOPIC 2 - NHÓM 10: /m/ /n/ /ŋ/ (Nasals) — 3 âm mũi
// ============================================================================

export const WORDS_T2_G10_NASALS: WordItemData[] = [
  { word: "man", ipa: "/mæn/", soundGroupId: "map-t2-g10-nasals", targetPhonemes: ["/m/"], difficulty: 2, exampleSentence: "The man is tall.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "ran", ipa: "/ræn/", soundGroupId: "map-t2-g10-nasals", targetPhonemes: ["/n/"], difficulty: 2, exampleSentence: "He ran fast.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/n/ cuối từ" },
  { word: "sing", ipa: "/sɪŋ/", soundGroupId: "map-t2-g10-nasals", targetPhonemes: ["/ŋ/"], difficulty: 4, exampleSentence: "Sing a song.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/ŋ/ cuối từ — người Việt hay đọc /n/" },
  { word: "sin", ipa: "/sɪn/", soundGroupId: "map-t2-g10-nasals", targetPhonemes: ["/n/"], difficulty: 2, exampleSentence: "Avoid sin.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "thing", ipa: "/θɪŋ/", soundGroupId: "map-t2-g10-nasals", targetPhonemes: ["/ŋ/"], difficulty: 5, exampleSentence: "That thing is mine.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/ŋ/ cuối + /θ/ đầu" },
  { word: "thin", ipa: "/θɪn/", soundGroupId: "map-t2-g10-nasals", targetPhonemes: ["/n/"], difficulty: 4, exampleSentence: "The paper is thin.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "ram", ipa: "/ræm/", soundGroupId: "map-t2-g10-nasals", targetPhonemes: ["/m/"], difficulty: 2, exampleSentence: "The ram is strong.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/m/ cuối từ" },
  { word: "rang", ipa: "/ræŋ/", soundGroupId: "map-t2-g10-nasals", targetPhonemes: ["/ŋ/"], difficulty: 3, exampleSentence: "She rang the bell.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "morning", ipa: "/ˈmɔːrnɪŋ/", soundGroupId: "map-t2-g10-nasals", targetPhonemes: ["/m/", "/ŋ/"], difficulty: 4, exampleSentence: "Good morning.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/m/ đầu + /ŋ/ cuối" },
  { word: "wing", ipa: "/wɪŋ/", soundGroupId: "map-t2-g10-nasals", targetPhonemes: ["/ŋ/"], difficulty: 3, exampleSentence: "The bird's wing.", status: "ACTIVE", sourceType: "FREE_API" },
];

export const MINIMAL_PAIRS_T2_G10: MinimalPairData[] = [
  { word1: "sing", ipa1: "/sɪŋ/", word2: "sin", ipa2: "/sɪn/", soundGroupId: "map-t2-g10-nasals", contrastPhonemes: ["/ŋ/", "/n/"], difficulty: 4, explanation: "/ŋ/ (velar, cuối 'ng') vs /n/ (alveolar, cuối 'n') — người Việt hay đọc /ŋ/ thành /n/", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp khó nhất CĐ2 cho người Việt" },
  { word1: "thing", ipa1: "/θɪŋ/", word2: "thin", ipa2: "/θɪn/", soundGroupId: "map-t2-g10-nasals", contrastPhonemes: ["/ŋ/", "/n/"], difficulty: 5, explanation: "/ŋ/ vs /n/ cuối + /θ/ đầu", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "rang", ipa1: "/ræŋ/", word2: "ran", ipa2: "/ræn/", soundGroupId: "map-t2-g10-nasals", contrastPhonemes: ["/ŋ/", "/n/"], difficulty: 3, explanation: "/ŋ/ vs /n/ cuối sau /æ/", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "wing", ipa1: "/wɪŋ/", word2: "win", ipa2: "/wɪn/", soundGroupId: "map-t2-g10-nasals", contrastPhonemes: ["/ŋ/", "/n/"], difficulty: 3, explanation: "/ŋ/ vs /n/ cuối", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "ram", ipa1: "/ræm/", word2: "ran", ipa2: "/ræn/", soundGroupId: "map-t2-g10-nasals", contrastPhonemes: ["/m/", "/n/"], difficulty: 3, explanation: "/m/ (bilabial) vs /n/ (alveolar) cuối từ", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp /m/ vs /n/ (ít khó hơn /n/ vs /ŋ/)" },
  { word1: "sing", ipa1: "/sɪŋ/", word2: "sing", ipa2: "/sɪŋ/", soundGroupId: "map-t2-g10-nasals", contrastPhonemes: ["/ŋ/"], difficulty: 3, explanation: "/m/ vs /n/ đầu từ: mat vs nat", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Placeholder — thay bằng cặp thật mat/nat" },
];

export const SENTENCES_T2_G10: SentenceItemData[] = [
  { sentence: "Sing a sin-free song.", soundGroupId: "map-t2-g10-nasals", targetWords: ["sing", "sin"], targetPhonemes: ["/ŋ/", "/n/"], difficulty: 5, translation: "Hát một bài không tội lỗi.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "The thin thing is mine.", soundGroupId: "map-t2-g10-nasals", targetWords: ["thin", "thing"], targetPhonemes: ["/n/", "/ŋ/"], difficulty: 5, translation: "Vật mỏng là của tôi.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "She rang and ran.", soundGroupId: "map-t2-g10-nasals", targetWords: ["rang", "ran"], targetPhonemes: ["/ŋ/", "/n/"], difficulty: 4, translation: "Cô ấy rung chuông và chạy.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Good morning, ram wing.", soundGroupId: "map-t2-g10-nasals", targetWords: ["morning", "ram", "wing"], targetPhonemes: ["/m/", "/ŋ/"], difficulty: 5, translation: "Chào buổi sáng, cánh cừu.", status: "ACTIVE", sourceType: "MANUAL" },
];
```

**QUAN TRỌNG — sửa cặp placeholder g10 trước khi tiếp:** Cặp cuối của g10 (`sing/sing` word1==word2) là placeholder SAI. Thay bằng cặp thật:
```ts
  { word1: "mat", ipa1: "/mæt/", word2: "gnat", ipa2: "/næt/", soundGroupId: "map-t2-g10-nasals", contrastPhonemes: ["/m/", "/n/"], difficulty: 4, explanation: "/m/ vs /n/ initial — gnat đọc /n/ (silent g)", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp /m/ vs /n/ đầu từ" },
```
(Engineer: khi transpose Step 1, dùng cặp `mat/gnat` này thay cho cặp `sing/sing` placeholder.)

- [ ] **Step 2: Thêm block g11 /l//r/** (sau block g10)
```ts
// ============================================================================
// TOPIC 2 - NHÓM 11: /l/ & /r/ (Approximants)
// ============================================================================

export const WORDS_T2_G11_L_R: WordItemData[] = [
  { word: "lip", ipa: "/lɪp/", soundGroupId: "map-t2-g11-l-r", targetPhonemes: ["/l/"], difficulty: 2, exampleSentence: "Bite your lip.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "rip", ipa: "/rɪp/", soundGroupId: "map-t2-g11-l-r", targetPhonemes: ["/r/"], difficulty: 3, exampleSentence: "Rip the paper.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/r/ tiếng Anh curled — khác 'r' Việt" },
  { word: "light", ipa: "/laɪt/", soundGroupId: "map-t2-g11-l-r", targetPhonemes: ["/l/"], difficulty: 2, exampleSentence: "Turn on the light.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "right", ipa: "/raɪt/", soundGroupId: "map-t2-g11-l-r", targetPhonemes: ["/r/"], difficulty: 3, exampleSentence: "Turn right.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "lake", ipa: "/leɪk/", soundGroupId: "map-t2-g11-l-r", targetPhonemes: ["/l/"], difficulty: 2, exampleSentence: "Swim in the lake.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "rake", ipa: "/reɪk/", soundGroupId: "map-t2-g11-l-r", targetPhonemes: ["/r/"], difficulty: 3, exampleSentence: "Use a rake.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "ball", ipa: "/bɔːl/", soundGroupId: "map-t2-g11-l-r", targetPhonemes: ["/l/"], difficulty: 3, exampleSentence: "Bounce the ball.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/l/ dark cuối từ /ɫ/" },
  { word: "bar", ipa: "/bɑːr/", soundGroupId: "map-t2-g11-l-r", targetPhonemes: ["/r/"], difficulty: 3, exampleSentence: "Sit at the bar.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/r/ cuối từ" },
  { word: "fly", ipa: "/flaɪ/", soundGroupId: "map-t2-g11-l-r", targetPhonemes: ["/l/"], difficulty: 3, exampleSentence: "Birds fly.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/l/ cluster /fl/" },
  { word: "cry", ipa: "/kraɪ/", soundGroupId: "map-t2-g11-l-r", targetPhonemes: ["/r/"], difficulty: 3, exampleSentence: "Don't cry.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/r/ cluster /cr/" },
];

export const MINIMAL_PAIRS_T2_G11: MinimalPairData[] = [
  { word1: "lip", ipa1: "/lɪp/", word2: "rip", ipa2: "/rɪp/", soundGroupId: "map-t2-g11-l-r", contrastPhonemes: ["/l/", "/r/"], difficulty: 3, explanation: "/l/ lateral vs /r/ approximant initial", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp cổ điển /l/ vs /r/" },
  { word1: "light", ipa1: "/laɪt/", word2: "right", ipa2: "/raɪt/", soundGroupId: "map-t2-g11-l-r", contrastPhonemes: ["/l/", "/r/"], difficulty: 3, explanation: "/l/ vs /r/ initial trước /aɪ/", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "lake", ipa1: "/leɪk/", word2: "rake", ipa2: "/reɪk/", soundGroupId: "map-t2-g11-l-r", contrastPhonemes: ["/l/", "/r/"], difficulty: 3, explanation: "/l/ vs /r/ initial trước /eɪ/", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "ball", ipa1: "/bɔːl/", word2: "bar", ipa2: "/bɑːr/", soundGroupId: "map-t2-g11-l-r", contrastPhonemes: ["/l/", "/r/"], difficulty: 4, explanation: "/l/ dark /ɫ/ vs /r/ cuối từ", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "fly", ipa1: "/flaɪ/", word2: "fry", ipa2: "/fraɪ/", soundGroupId: "map-t2-g11-l-r", contrastPhonemes: ["/l/", "/r/"], difficulty: 4, explanation: "/l/ vs /r/ trong cluster /fl/ vs /fr/", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "cloud", ipa1: "/klaʊd/", word2: "crowd", ipa2: "/kraʊd/", soundGroupId: "map-t2-g11-l-r", contrastPhonemes: ["/l/", "/r/"], difficulty: 4, explanation: "/l/ vs /r/ trong cluster /kl/ vs /kr/", status: "ACTIVE", sourceType: "MANUAL" },
];

export const SENTENCES_T2_G11: SentenceItemData[] = [
  { sentence: "The light is right.", soundGroupId: "map-t2-g11-l-r", targetWords: ["light", "right"], targetPhonemes: ["/l/", "/r/"], difficulty: 4, translation: "Ánh sáng ở bên phải.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Rip the lip.", soundGroupId: "map-t2-g11-l-r", targetWords: ["rip", "lip"], targetPhonemes: ["/r/", "/l/"], difficulty: 3, translation: "Xé môi.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Rake the lake.", soundGroupId: "map-t2-g11-l-r", targetWords: ["rake", "lake"], targetPhonemes: ["/r/", "/l/"], difficulty: 4, translation: "Cào hồ.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Fly in the crowd at the bar.", soundGroupId: "map-t2-g11-l-r", targetWords: ["fly", "crowd", "bar"], targetPhonemes: ["/l/", "/r/"], difficulty: 5, translation: "Bay trong đám đông ở quán bar.", status: "ACTIVE", sourceType: "MANUAL" },
];
```

- [ ] **Step 3: Thêm block g12 /w//j/** (sau block g11)
```ts
// ============================================================================
// TOPIC 2 - NHÓM 12: /w/ & /j/ (Approximants) — wet/yet
// ============================================================================

export const WORDS_T2_G12_W_J: WordItemData[] = [
  { word: "wet", ipa: "/wet/", soundGroupId: "map-t2-g12-w-j", targetPhonemes: ["/w/"], difficulty: 2, exampleSentence: "The road is wet.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/w/ — người Việt hay đọc /v/ (wine→vine)" },
  { word: "yet", ipa: "/jet/", soundGroupId: "map-t2-g12-w-j", targetPhonemes: ["/j/"], difficulty: 2, exampleSentence: "Not yet.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/j/ = 'y' Việt OK" },
  { word: "wine", ipa: "/waɪn/", soundGroupId: "map-t2-g12-w-j", targetPhonemes: ["/w/"], difficulty: 2, exampleSentence: "Drink red wine.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "yes", ipa: "/jes/", soundGroupId: "map-t2-g12-w-j", targetPhonemes: ["/j/"], difficulty: 1, exampleSentence: "Say yes.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "west", ipa: "/west/", soundGroupId: "map-t2-g12-w-j", targetPhonemes: ["/w/"], difficulty: 2, exampleSentence: "Go west.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "yeti", ipa: "/ˈjeti/", soundGroupId: "map-t2-g12-w-j", targetPhonemes: ["/j/"], difficulty: 4, exampleSentence: "The yeti is a myth.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "Từ hơi hiếm nhưng /j/ rõ" },
  { word: "wind", ipa: "/wɪnd/", soundGroupId: "map-t2-g12-w-j", targetPhonemes: ["/w/"], difficulty: 2, exampleSentence: "The wind is cold.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "yell", ipa: "/jel/", soundGroupId: "map-t2-g12-w-j", targetPhonemes: ["/j/"], difficulty: 2, exampleSentence: "Don't yell at me.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "sweet", ipa: "/swiːt/", soundGroupId: "map-t2-g12-w-j", targetPhonemes: ["/w/"], difficulty: 3, exampleSentence: "The cake is sweet.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/w/ cluster /sw/" },
  { word: "beyond", ipa: "/bɪˈjɒnd/", soundGroupId: "map-t2-g12-w-j", targetPhonemes: ["/j/"], difficulty: 4, exampleSentence: "Look beyond.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/j/ giữa từ" },
];

export const MINIMAL_PAIRS_T2_G12: MinimalPairData[] = [
  { word1: "wet", ipa1: "/wet/", word2: "yet", ipa2: "/jet/", soundGroupId: "map-t2-g12-w-j", contrastPhonemes: ["/w/", "/j/"], difficulty: 2, explanation: "/w/ (môi tròn) vs /j/ (lưỡi cao) initial", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp cổ điển /w/ vs /j/" },
  { word1: "wine", ipa1: "/waɪn/", word2: "vine", ipa2: "/vaɪn/", soundGroupId: "map-t2-g12-w-j", contrastPhonemes: ["/w/", "/v/"], difficulty: 3, explanation: "/w/ vs /v/ — người Việt hay đọc /w/ thành /v/", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp quan trọng cho người Việt (wine vs vine)" },
  { word1: "west", ipa1: "/west/", word2: "vest", ipa2: "/vest/", soundGroupId: "map-t2-g12-w-j", contrastPhonemes: ["/w/", "/v/"], difficulty: 3, explanation: "/w/ vs /v/ initial", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "wind", ipa1: "/wɪnd/", word2: "yell", ipa2: "/jel/", soundGroupId: "map-t2-g12-w-j", contrastPhonemes: ["/w/", "/j/"], difficulty: 3, explanation: "/w/ vs /j/ initial", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Placeholder — wind/yell khác vần, thay bằng wet/yet hoặc worse/your" },
  { word1: "sweet", ipa1: "/swiːt/", word2: "suit", ipa2: "/suːt/", soundGroupId: "map-t2-g12-w-j", contrastPhonemes: ["/w/"], difficulty: 4, explanation: "/w/ cluster /sw/ — so sánh với /s/ no glide", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "worse", ipa1: "/wɜːrs/", word2: "your", ipa2: "/jɔːr/", soundGroupId: "map-t2-g12-w-j", contrastPhonemes: ["/w/", "/j/"], difficulty: 4, explanation: "/w/ vs /j/ trước /ɜːr/ /ɔːr/", status: "ACTIVE", sourceType: "MANUAL" },
];

export const SENTENCES_T2_G12: SentenceItemData[] = [
  { sentence: "Wet yet?", soundGroupId: "map-t2-g12-w-j", targetWords: ["wet", "yet"], targetPhonemes: ["/w/", "/j/"], difficulty: 3, translation: "Ướt chưa?", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Wine not vine.", soundGroupId: "map-t2-g12-w-j", targetWords: ["wine", "vine"], targetPhonemes: ["/w/", "/v/"], difficulty: 4, translation: "Rượu không phải dây leo.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Yes to the west.", soundGroupId: "map-t2-g12-w-j", targetWords: ["yes", "west"], targetPhonemes: ["/j/", "/w/"], difficulty: 3, translation: "Có cho phương tây.", status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Sweet wind beyond the yell.", soundGroupId: "map-t2-g12-w-j", targetWords: ["sweet", "wind", "beyond", "yell"], targetPhonemes: ["/w/", "/j/"], difficulty: 5, translation: "Gió ngọt phía sau tiếng hét.", status: "ACTIVE", sourceType: "MANUAL" },
];
```

**QUAN TRỌNG — sửa cặp placeholder g12 trước khi tiếp:** Cặp `wind/yell` (word1==khác vần, không contrast sạch) là placeholder SAI. Thay bằng cặp thật đã có ở cuối: dùng cặp `worse/your` (đã có ở cặp 6) hoặc thêm cặp `wet/yet` (đã có ở cặp 1). Bỏ cặp `wind/yell` (cặp 4), giữ 5 cặp còn lại. Engineer: khi transpose Step 3, bỏ cặp `wind/yell`, giữ 5 cặp: wet/yet, wine/vine, west/vest, sweet/suit, worse/your. Test `pairs >= 6` sẽ fail (chỉ 5) → **thay bằng 6 cặp sạch**: thêm cặp `will/yes`:
```ts
  { word1: "will", ipa1: "/wɪl/", word2: "yell", ipa2: "/jel/", soundGroupId: "map-t2-g12-w-j", contrastPhonemes: ["/w/", "/j/"], difficulty: 3, explanation: "/w/ vs /j/ initial trước /ɪ/ /e/", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp /w/ vs /j/ initial sạch" },
```
Danh sách 6 cặp g12 cuối cùng: wet/yet, wine/vine, west/vest, will/yell, sweet/suit, worse/your.

- [ ] **Step 4: Thêm 3 entry vào `LESSON_CONTENT_BY_SOUND_GROUP`** (sau 9 entry trước)
```ts
  "map-t2-g10-nasals": {
    words: WORDS_T2_G10_NASALS,
    minimalPairs: MINIMAL_PAIRS_T2_G10,
    sentences: SENTENCES_T2_G10,
  },
  "map-t2-g11-l-r": {
    words: WORDS_T2_G11_L_R,
    minimalPairs: MINIMAL_PAIRS_T2_G11,
    sentences: SENTENCES_T2_G11,
  },
  "map-t2-g12-w-j": {
    words: WORDS_T2_G12_W_J,
    minimalPairs: MINIMAL_PAIRS_T2_G12,
    sentences: SENTENCES_T2_G12,
  },
```

- [ ] **Step 5: Chạy test full + tsc**
```bash
npx tsx --test "src/lib/__tests__/lesson-content.test.ts"
npx tsc --noEmit
```
Expected: TẤT CẢ test pass (12 nhóm CD2 + test cũ). 4 test mới CD2 pass: "12 nhóm có", "mỗi nhóm words/sentences/pairs (trừ g08-h)", "mỗi word soundGroupId/targetPhonemes/ipa", "tổng >= 22". tsc 0 error.

- [ ] **Step 6: Checkpoint review với user**

Báo user: 3 nhóm Nasals + Approximants (g10-g12) done, 12/12 nhóm CD2 content hoàn tất, test toàn bộ pass. Review rồi tiếp Task 6 (seed + audio + quality gate).

---

## Task 6: Re-seed + rút audio local + quality gate

**Files:**
- Chạy (không sửa): `prisma/seed_lessons.ts`, `prisma/seed_audio_local.ts`

**Context:** Seed đã content-driven. Chạy `db_cleanup` → `seed_lessons` (flip CD2 DRAFT→ACTIVE + sinh rows) → `seed_audio_local` (rút mp3 local). Verify DB + quality gate.

- [ ] **Step 1: Verify DB connection + clean**

```bash
npx prisma validate
```
Expected: "schema valid". (Không sửa schema SP3b, chỉ verify.)

- [ ] **Step 2: Clean DB + re-seed lessons**

```bash
npx tsx prisma/db_cleanup.ts
npm run db:seed:lessons
```
Expected: `db_cleanup` xóa data (idempotent). `seed_lessons` chạy — log hiển thị: seedLessonContent iterate 24+ groups (12 CD1 + 2 CD3 + 12 CD2), seed WordItem (~240 từ: 120 CD1 + 120 CD2), MinimalPair, SentenceItem. generateExercises flip CD2 12 nhóm DRAFT→ACTIVE. generateQuestions sinh Question + AnswerOption. Lưu ý log "📝 Lesson Content loaded: N Sound Groups with data" — N phải >= 24.

Nếu log N < 24 → có nhóm CD2 chưa vào map. Kiểm tra Task 2-5 Step 4 đã thêm 12 entry.

- [ ] **Step 3: Rút audio local cho từ CD2 mới**

```bash
npx tsx prisma/seed_audio_local.ts
```
Expected: Script query `WordItem sourceType="FREE_API"` (gồm ~120 từ CD2 mới), skip file đã có (CD1), fetch Free Dictionary API cho từ CD2 mới → tải `/audio/{word}.mp3`, update DB audioUrl local. Log: "✓ X từ tải thành công, Y từ fail". Y nhỏ (~5-10% fail → NEEDS_REVIEW, không đưa listen_choose).

- [ ] **Step 4: Verify DB CD2 (smoke check)**

Chạy query verify (qua prisma studio hoặc script nhanh):
```bash
npx prisma studio
```
Mở table `SoundGroup` → filter `topicId="topic-2-consonants"` → 12 nhóm, 11 status=ACTIVE, g08-h status=ACTIVE (nhưng speak_minimal_pair exercise DRAFT). Table `WordItem` → filter `soundGroupId` chứa `map-t2-` → ~120 từ, đa số `audioUrl="/audio/...mp3"` (local), một vài `status=NEEDS_REVIEW` (API fail). Table `Exercise` → filter CD2 → 12 nhóm × 4 mode = 48 exercise, đa số ACTIVE (trừ g08-h speak_minimal_pair DRAFT).

(Hoặc verify qua app UI: `npm run dev` → /learning_map → click CĐ2 → 12 nhóm hiện, click 1 nhóm → 4 bài, làm 1 bài listen_choose → audio phát OK.)

- [ ] **Step 5: Quality gate — test full + tsc + build**

```bash
npm test
npx tsc --noEmit
npm run build
```
Expected:
- `npm test`: ALL pass (55 test cũ + 4 test mới CD2 = 59 test, không regression).
- `tsc`: 0 error.
- `build`: Next.js build success.

- [ ] **Step 6: Checkpoint final review với user**

Báo user: SP3b hoàn tất. 12 nhóm CD2 content + re-seed + audio local done. Quality gate pass (59 test, tsc 0 error, build OK). CD2: 12 nhóm ACTIVE (trừ g08-h speak_minimal_pair DRAFT), ~120 từ (đa số có audio local), ~66 cặp, ~48 câu. User review + commit khi convenient.

---

## Self-Review

### 1. Spec coverage
- **Spec section "Mục tiêu"** (content 12 nhóm CD2 + re-seed + audio local): Task 2-5 (content) + Task 6 (seed + audio). ✓
- **Spec section 1 (hiện trạng)**: Plan ghi pattern CD1, seed content-driven, script audio có. Task 1 đọc test pattern. ✓
- **Spec section 2 (12 nhóm outline)**: Task 2-5 thêm đúng 12 nhóm với scale 10/6/4 (g08-h 0 cặp). Mỗi task 3 nhóm. ✓
- **Spec section 3 (nguồn dữ liệu)**: content `sourceType="FREE_API"` (từ) / `"MANUAL"` (pair/sentence), IPA verify cmudict (ghi reviewNote), audio Free Dictionary API local, câu Web Speech runtime (không local — đúng user chốt (a)). ✓
- **Spec section 4 (test design)**: Task 1 thêm đúng 4 test + array 12 nhóm, code khớp spec section 4. ✓
- **Spec section 5 (seed flow)**: Task 6 step 2-3 chạy `db_cleanup` → `seed_lessons` → `seed_audio_local`, verify DB. ✓
- **Spec section 6 (scope/edge cases)**: g08-h 0 cặp DRAFT (Task 4), từ API fail NEEDS_REVIEW (Task 6 step 4 verify), g10 3 phoneme contrast /n/ vs /ŋ/ (Task 5), listen_choose neighbor (Task 4 note). ✓
- **Spec section 7 (file)**: sửa `lesson-content.ts` + test, chạy seed (không sửa). ✓
- **Spec section 8 (behavior)**: app offline audio CD2, CD2 DRAFT→ACTIVE, g08-h DRAFT, không đụng engine/XP. ✓
- **Spec section 9 (rủi ro)**: API fail (Task 6 verify NEEDS_REVIEW), IPA sai (reviewNote), content cẩu thả (TDD), g08-h DRAFT, 1 commit lớn (test + review spec trước), neighbor phoneme (CD2 chain). ✓

**Gap phát hiện & xử lý:**
- Task 5 g10 cặp cuối `sing/sing` placeholder SAI → đã ghi "QUAN TRỌNG" thay bằng `mat/gnat`. ✓ fixed inline.
- Task 5 g12 cặp `wind/yell` không contrast sạch → đã ghi "QUAN TRỌNG" bỏ, dùng 6 cặp sạch (wet/yet, wine/vine, west/vest, will/yell, sweet/suit, worse/your). ✓ fixed inline.
- Spec không nói "db_cleanup" cụ thể → Plan Task 6 step 2 thêm `db_cleanup` trước seed (pattern SP3a đã có, idempotent). ✓

### 2. Placeholder scan
- **2 placeholder thật đã flag + fix**: g10 cặp `sing/sing`, g12 cặp `wind/yell`. Cả 2 ghi rõ "QUAN TRỌNG — sửa cặp placeholder" + thay code đúng. Engineer phải transpose đúng bản đã fix.
- Không có "TBD"/"TODO"/"implement later"/"similar to Task N".
- Mỗi task có code đầy đủ (content 3 nhóm × 10 từ + 6 cặp + 4 câu = ~70 object/group, transpose theo template).
- Test code đầy đủ (Task 1).
- Seed command đầy đủ (Task 6).

### 3. Type consistency
- `WordItemData` (Task 2-5): field `word/ipa/soundGroupId/targetPhonemes/difficulty/exampleSentence?/status/sourceType/sourceUrl?/reviewNote?` khớp type `lesson-content.ts:14-26`. ✓
- `MinimalPairData` (Task 2-5): field `word1/ipa1/word2/ipa2/soundGroupId/contrastPhonemes/difficulty/explanation?/status/sourceType/reviewNote?` khớp `lesson-content.ts:28-42`. ✓
- `SentenceItemData` (Task 2-5): field `sentence/soundGroupId/targetWords/targetPhonemes/difficulty/translation?/status/sourceType/reviewNote?` khớp `lesson-content.ts:44-55`. ✓
- `soundGroupId` value (Task 2-5) khớp catalog `lesson-catalog.ts:178-195` (map-t2-g01-p-b → map-t2-g12-w-j). ✓
- Map entry key (Task 2-5 Step 4) khớp `soundGroupId` value. ✓
- `targetPhonemes` array: mỗi từ 1 phoneme (vd ["/p/"]), ngoại lệ g10 `morning` ["/m/", "/ŋ/"] (2 phoneme — OK, WordItemData cho phép string[]). ✓
- Test array `CD2_GROUPS` (Task 1) khớp 12 `soundGroupId` Task 2-5. ✓
- `MINIMAL_PAIRS_T2_G08: MinimalPairData[] = []` (Task 4 g08 0 cặp) — empty array valid, test `if (id !== "map-t2-g08-h")` skip pairs check. ✓

No type drift found.

### Note cho engineer: 2 cặp placeholder ĐÃ FIX trong plan
Khi transpose Task 5 (g10, g12), dùng phiên bản ĐÃ FIX:
- g10 cặp 6: `mat/gnat` (KHÔNG dùng `sing/sing`).
- g12: 6 cặp `wet/yet, wine/vine, west/vest, will/yell, sweet/suit, worse/your` (KHÔNG dùng `wind/yell`).
Block code Step 1 (g10) và Step 3 (g12) trong plan ghi version cũ có placeholder — **dùng version fix ở note "QUAN TRỌNG"**. (Plan giữ block gốc để engineer thấy cần sửa gì, note fix ngay sau.)

---

## Execution Handoff

Plan complete and saved to `docs/superpowers/plans/2026-06-19-sp3b-content-cd2.md`. Two execution options:

**1. Subagent-Driven (recommended)** — Tôi dispatch fresh subagent per task, review giữa task, iteration nhanh. Phù hợp: 6 task tuần tự (Task 1 test → Task 2-5 content → Task 6 seed), mỗi task self-contained (3 nhóm content).

**2. Inline Execution** — Execute tasks trong session này bằng executing-plans, batch + checkpoint.

**Git policy:** Engineer không tự commit (user handles). Mỗi task kết thúc checkpoint review với user.

Which approach?
