# SP3a — Content + seed CĐ1 (10 nhóm) + rút ruột audio local Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Soạn content chỉn chu cho 10 nhóm CĐ1 (Nguyên âm), rút ruột audio mp3 về `public/audio/` (app tự chứa, an toàn bảo vệ), thêm nút nghe mẫu câu bằng Web Speech API. User review CĐ1 trước khi làm SP3b.

**Architecture:** Biên soạn content 7 nhóm mới vào `lesson-content.ts` (MANUAL + IPA pedagogy, verify cmudict). Script `seed_audio_local.ts` tải mp3 từ Free Dictionary API (Wiktionary CC-BY-SA) về `public/audio/`, cập nhật `audioUrl` local. Engine thêm nút speechSynthesis cho sentence. TDD content test. Re-seed + verify + quality gate.

**Tech Stack:** Prisma 6.19.3 + PostgreSQL, TypeScript strict, `node:test` + `node:assert/strict`, tsx, Free Dictionary API (CC-BY-SA audio), Web Speech API (`window.speechSynthesis`).

**Spec:** `docs/superpowers/specs/2026-06-18-sp3a-content-cd1-audio-local-design.md`

---

## File Structure

| File | Trách nhiệm | Hành động |
|---|---|---|
| `frontend/prisma/lesson-content.ts` | Content dữ liệu (words/pairs/sentences). Thêm 7 nhóm CĐ1. | sửa |
| `frontend/prisma/seed_audio_local.ts` | Script rút ruột mp3 local (chạy 1 lần, idempotent). | tạo |
| `frontend/src/app/exercises/[id]/ExerciseEngineClient.tsx` | Engine. Thêm nút "Nghe mẫu" speechSynthesis cho sentence. | sửa |
| `frontend/src/lib/__tests__/lesson-content.test.ts` | Test content 7 nhóm mới. | tạo (TDD) |
| `english_pronunciation_app/.gitignore` | Bỏ `public/audio/*.mp3` khỏi git. | sửa |
| `english_pronunciation_app/frontend/README.md` | Hướng dẫn seed + audio + credit. | sửa |
| `PLAN/00_Project_Context/CURRENT_PROJECT_CONTEXT.md` | Ghi nguồn audio Wiktionary CC-BY-SA. | sửa |

---

### Task 1: TDD — test content 7 nhóm mới (failing first)

**Files:**
- Create: `frontend/src/lib/__tests__/lesson-content.test.ts`

- [ ] **Step 1: Viết test failing**

Tạo `frontend/src/lib/__tests__/lesson-content.test.ts`:

```typescript
import assert from "node:assert/strict";
import test from "node:test";
import { LESSON_CONTENT_BY_SOUND_GROUP, getContentBySoundGroup } from "../../../prisma/lesson-content";

const NEW_GROUPS = [
  "map-t1-g03-central",
  "map-t1-g05-u-uh",
  "map-t1-g06-er",
  "map-t1-g07-ei-ai",
  "map-t1-g08-oi-au",
  "map-t1-g09-ou-ea",
  "map-t1-g10-ia-ua",
];

test("7 nhóm CĐ1 mới có trong LESSON_CONTENT_BY_SOUND_GROUP", () => {
  for (const id of NEW_GROUPS) {
    assert.ok(LESSON_CONTENT_BY_SOUND_GROUP[id as keyof typeof LESSON_CONTENT_BY_SOUND_GROUP], `Thiếu nhóm ${id}`);
  }
});

test("mỗi nhóm mới có words/pairs/sentences không rỗng", () => {
  for (const id of NEW_GROUPS) {
    const content = getContentBySoundGroup(id);
    assert.ok(content, `getContentBySoundGroup(${id}) trả undefined`);
    assert.ok(content!.words.length >= 8, `${id}: words >= 8 (hiện ${content!.words.length})`);
    assert.ok(content!.sentences.length >= 3, `${id}: sentences >= 3 (hiện ${content!.sentences.length})`);
    // g06 /ɜː/ không cặp → pairs có thể 0; các nhóm khác >= 4
    if (id !== "map-t1-g06-er") {
      assert.ok(content!.minimalPairs.length >= 4, `${id}: pairs >= 4 (hiện ${content!.minimalPairs.length})`);
    }
  }
});

test("mỗi word có soundGroupId khớp nhóm + targetPhonemes không rỗng", () => {
  for (const id of NEW_GROUPS) {
    const content = getContentBySoundGroup(id);
    for (const w of content!.words) {
      assert.equal(w.soundGroupId, id, `word "${w.word}" soundGroupId sai: ${w.soundGroupId} (mong đợi ${id})`);
      assert.ok(w.targetPhonemes.length > 0, `word "${w.word}" thiếu targetPhonemes`);
      assert.ok(w.ipa.startsWith("/"), `word "${w.word}" ipa phải bắt đầu bằng /`);
    }
  }
});

test("không còn id cũ map-t4-g01 / map-t4-g03 trong content", () => {
  const allIds = Object.keys(LESSON_CONTENT_BY_SOUND_GROUP);
  assert.ok(!allIds.includes("map-t4-g01-front-vowel-mix"), "Còn id cũ map-t4-g01-front-vowel-mix");
  assert.ok(!allIds.includes("map-t4-g03-final-drop"), "Còn id cũ map-t4-g03-final-drop");
});

test("tổng số nhóm có content >= 10 (3 cũ + 7 mới)", () => {
  assert.ok(Object.keys(LESSON_CONTENT_BY_SOUND_GROUP).length >= 10, `Ít nhất 10 nhóm content (hiện ${Object.keys(LESSON_CONTENT_BY_SOUND_GROUP).length})`);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd english_pronunciation_app\frontend && npm test`
Expected: FAIL — 7 nhóm mới chưa có trong `LESSON_CONTENT_BY_SOUND_GROUP` (chỉ 5 nhóm cũ). Test "7 nhóm... có trong" fail.

- [ ] **Step 3: Commit failing test**

```bash
git add english_pronunciation_app/frontend/src/lib/__tests__/lesson-content.test.ts
git commit -m "SP3a.1: test content 7 nhom CD1 moi (failing) - g03/g05/g06/g07/g08/g09/g10"
```

---

### Task 2: Biên soạn content 7 nhóm CĐ1 mới trong `lesson-content.ts`

**Files:**
- Modify: `frontend/prisma/lesson-content.ts` (thêm 7 block + 7 key trong `LESSON_CONTENT_BY_SOUND_GROUP`)

- [ ] **Step 1: Thêm 7 block content vào `lesson-content.ts`**

Thêm vào `frontend/prisma/lesson-content.ts` (trước block `// EXPORTS` dòng ~838) nội dung 7 nhóm dưới đây. Mỗi nhóm: words (WordItemData[]), minimalPairs (MinimalPairData[]), sentences (SentenceItemData[]). IPA tự biên soạn, verify cmudict, `sourceType: FREE_API` cho word, `MANUAL` cho pair/sentence.

```typescript
// ============================================================================
// TOPIC 1 - NHÓM 3: /ɑː/ & /ʌ/ & /ə/ (father/fun/about) - NHÓM TRUNG TÂM
// ============================================================================

export const WORDS_T1_G03_CENTRAL: WordItemData[] = [
  { word: "father", ipa: "/ˈfɑːðə/", soundGroupId: "map-t1-g03-central", targetPhonemes: ["/ɑː/"], difficulty: 5, exampleSentence: "My father is a teacher.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/ɑː/ dài, miệng mở rộng" },
  { word: "fun", ipa: "/fʌn/", soundGroupId: "map-t1-g03-central", targetPhonemes: ["/ʌ/"], difficulty: 4, exampleSentence: "We had fun at the party.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/ʌ/ ngắn, lỏng" },
  { word: "car", ipa: "/kɑː/", soundGroupId: "map-t1-g03-central", targetPhonemes: ["/ɑː/"], difficulty: 4, exampleSentence: "The car is red.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "cup", ipa: "/kʌp/", soundGroupId: "map-t1-g03-central", targetPhonemes: ["/ʌ/"], difficulty: 3, exampleSentence: "I need a cup of tea.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "about", ipa: "/əˈbaʊt/", soundGroupId: "map-t1-g03-central", targetPhonemes: ["/ə/"], difficulty: 5, exampleSentence: "Tell me about your day.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/ə/ schwa yếu, không nhấn" },
  { word: "sofa", ipa: "/ˈsəʊfə/", soundGroupId: "map-t1-g03-central", targetPhonemes: ["/ə/"], difficulty: 5, exampleSentence: "The sofa is comfortable.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "heart", ipa: "/hɑːt/", soundGroupId: "map-t1-g03-central", targetPhonemes: ["/ɑː/"], difficulty: 5, exampleSentence: "My heart beats fast.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "but", ipa: "/bʌt/", soundGroupId: "map-t1-g03-central", targetPhonemes: ["/ʌ/"], difficulty: 3, exampleSentence: "I want to go but I'm tired.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "ago", ipa: "/əˈɡəʊ/", soundGroupId: "map-t1-g03-central", targetPhonemes: ["/ə/"], difficulty: 5, exampleSentence: "It happened long ago.", status: "ACTIVE", sourceType: "FREE_API" },
];

export const MINIMAL_PAIRS_T1_G03: MinimalPairData[] = [
  { word1: "father", ipa1: "/ˈfɑːðə/", word2: "fun", ipa2: "/fʌn/", soundGroupId: "map-t1-g03-central", contrastPhonemes: ["/ɑː/", "/ʌ/"], difficulty: 5, explanation: "/ɑː/ dài mở rộng, /ʌ/ ngắn lỏng", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp trung tâm cơ bản" },
  { word1: "car", ipa1: "/kɑː/", word2: "cup", ipa2: "/kʌp/", soundGroupId: "map-t1-g03-central", contrastPhonemes: ["/ɑː/", "/ʌ/"], difficulty: 4, explanation: "Chú ý độ dài và hình dạng môi", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "heart", ipa1: "/hɑːt/", word2: "hut", ipa2: "/hʌt/", soundGroupId: "map-t1-g03-central", contrastPhonemes: ["/ɑː/", "/ʌ/"], difficulty: 5, explanation: "/ɑː/ kéo dài, /ʌ/ ngắn", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "bath", ipa1: "/bɑːθ/", word2: "but", ipa2: "/bʌt/", soundGroupId: "map-t1-g03-central", contrastPhonemes: ["/ɑː/", "/ʌ/"], difficulty: 6, status: "ACTIVE", sourceType: "MANUAL" },
];

export const SENTENCES_T1_G03: SentenceItemData[] = [
  { sentence: "My father had fun in the car.", soundGroupId: "map-t1-g03-central", targetWords: ["father", "fun", "car"], targetPhonemes: ["/ɑː/", "/ʌ/"], difficulty: 5, status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Câu chứa cả 2 âm trung tâm" },
  { sentence: "Tell me about the cup.", soundGroupId: "map-t1-g03-central", targetWords: ["about", "cup"], targetPhonemes: ["/ə/", "/ʌ/"], difficulty: 5, status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "My heart was cold but I had fun.", soundGroupId: "map-t1-g03-central", targetWords: ["heart", "but", "fun"], targetPhonemes: ["/ɑː/", "/ʌ/"], difficulty: 6, status: "ACTIVE", sourceType: "MANUAL" },
];

// ============================================================================
// TOPIC 1 - NHÓM 5: /ʊ/ & /uː/ (full/fool) - SAU NGẮN & SAU DÀI
// ============================================================================

export const WORDS_T1_G05_U_UH: WordItemData[] = [
  { word: "full", ipa: "/fʊl/", soundGroupId: "map-t1-g05-u-uh", targetPhonemes: ["/ʊ/"], difficulty: 3, exampleSentence: "The glass is full.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/ʊ/ ngắn lỏng" },
  { word: "fool", ipa: "/fuːl/", soundGroupId: "map-t1-g05-u-uh", targetPhonemes: ["/uː/"], difficulty: 3, exampleSentence: "Don't be a fool.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/uː/ dài căng" },
  { word: "pull", ipa: "/pʊl/", soundGroupId: "map-t1-g05-u-uh", targetPhonemes: ["/ʊ/"], difficulty: 3, exampleSentence: "Pull the door open.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "pool", ipa: "/puːl/", soundGroupId: "map-t1-g05-u-uh", targetPhonemes: ["/uː/"], difficulty: 3, exampleSentence: "The pool is clean.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "look", ipa: "/lʊk/", soundGroupId: "map-t1-g05-u-uh", targetPhonemes: ["/ʊ/"], difficulty: 3, exampleSentence: "Look at the sky.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "food", ipa: "/fuːd/", soundGroupId: "map-t1-g05-u-uh", targetPhonemes: ["/uː/"], difficulty: 3, exampleSentence: "The food is delicious.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "book", ipa: "/bʊk/", soundGroupId: "map-t1-g05-u-uh", targetPhonemes: ["/ʊ/"], difficulty: 3, exampleSentence: "I read a book.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "blue", ipa: "/bluː/", soundGroupId: "map-t1-g05-u-uh", targetPhonemes: ["/uː/"], difficulty: 4, exampleSentence: "The sky is blue.", status: "ACTIVE", sourceType: "FREE_API" },
];

export const MINIMAL_PAIRS_T1_G05: MinimalPairData[] = [
  { word1: "full", ipa1: "/fʊl/", word2: "fool", ipa2: "/fuːl/", soundGroupId: "map-t1-g05-u-uh", contrastPhonemes: ["/ʊ/", "/uː/"], difficulty: 3, explanation: "/ʊ/ ngắn lỏng, /uː/ dài căng môi", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp sau cổ điển" },
  { word1: "pull", ipa1: "/pʊl/", word2: "pool", ipa2: "/puːl/", soundGroupId: "map-t1-g05-u-uh", contrastPhonemes: ["/ʊ/", "/uː/"], difficulty: 3, explanation: "Chú ý độ dài", status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "look", ipa1: "/lʊk/", word2: "Luke", ipa2: "/luːk/", soundGroupId: "map-t1-g05-u-uh", contrastPhonemes: ["/ʊ/", "/uː/"], difficulty: 4, status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "good", ipa1: "/ɡʊd/", word2: "food", ipa2: "/fuːd/", soundGroupId: "map-t1-g05-u-uh", contrastPhonemes: ["/ʊ/", "/uː/"], difficulty: 4, status: "ACTIVE", sourceType: "MANUAL" },
];

export const SENTENCES_T1_G05: SentenceItemData[] = [
  { sentence: "The fool pulled the full bucket.", soundGroupId: "map-t1-g05-u-uh", targetWords: ["fool", "pulled", "full"], targetPhonemes: ["/uː/", "/ʊ/", "/ʊ/"], difficulty: 5, status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Câu chứa cả 2 âm sau" },
  { sentence: "Look at the blue pool.", soundGroupId: "map-t1-g05-u-uh", targetWords: ["Look", "blue", "pool"], targetPhonemes: ["/ʊ/", "/uː/", "/uː/"], difficulty: 4, status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Good food in the book.", soundGroupId: "map-t1-g05-u-uh", targetWords: ["Good", "food", "book"], targetPhonemes: ["/ʊ/", "/uː/", "/ʊ/"], difficulty: 4, status: "ACTIVE", sourceType: "MANUAL" },
];

// ============================================================================
// TOPIC 1 - NHÓM 6: /ɜː/ (bird/word) - ÂM GIỮA ĐẶC BIỆT (KHÔNG CẶP)
// ============================================================================

export const WORDS_T1_G06_ER: WordItemData[] = [
  { word: "bird", ipa: "/bɜːd/", soundGroupId: "map-t1-g06-er", targetPhonemes: ["/ɜː/"], difficulty: 6, exampleSentence: "The bird is singing.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/ɜː/ không có trong tiếng Việt" },
  { word: "word", ipa: "/wɜːd/", soundGroupId: "map-t1-g06-er", targetPhonemes: ["/ɜː/"], difficulty: 5, exampleSentence: "Say each word clearly.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "nurse", ipa: "/nɜːs/", soundGroupId: "map-t1-g06-er", targetPhonemes: ["/ɜː/"], difficulty: 6, exampleSentence: "The nurse is kind.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "girl", ipa: "/ɡɜːl/", soundGroupId: "map-t1-g06-er", targetPhonemes: ["/ɜː/"], difficulty: 5, exampleSentence: "The girl is happy.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "work", ipa: "/wɜːk/", soundGroupId: "map-t1-g06-er", targetPhonemes: ["/ɜː/"], difficulty: 5, exampleSentence: "I go to work early.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "learn", ipa: "/lɜːn/", soundGroupId: "map-t1-g06-er", targetPhonemes: ["/ɜː/"], difficulty: 6, exampleSentence: "We learn English.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "turn", ipa: "/tɜːn/", soundGroupId: "map-t1-g06-er", targetPhonemes: ["/ɜː/"], difficulty: 5, exampleSentence: "Turn left at the corner.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "her", ipa: "/hɜː/", soundGroupId: "map-t1-g06-er", targetPhonemes: ["/ɜː/"], difficulty: 4, exampleSentence: "Give her the book.", status: "ACTIVE", sourceType: "FREE_API" },
];

// g06 /ɜː/ không có cặp → MINIMAL_PAIRS_T1_G06 rỗng
export const MINIMAL_PAIRS_T1_G06: MinimalPairData[] = [];

export const SENTENCES_T1_G06: SentenceItemData[] = [
  { sentence: "The nurse learns to work with the bird.", soundGroupId: "map-t1-g06-er", targetWords: ["nurse", "learns", "work", "bird"], targetPhonemes: ["/ɜː/"], difficulty: 6, status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Nhiều từ /ɜː/ trong 1 câu" },
  { sentence: "The girl turned to her word.", soundGroupId: "map-t1-g06-er", targetWords: ["girl", "turned", "her", "word"], targetPhonemes: ["/ɜː/"], difficulty: 6, status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Learn to work hard.", soundGroupId: "map-t1-g06-er", targetWords: ["Learn", "work"], targetPhonemes: ["/ɜː/"], difficulty: 5, status: "ACTIVE", sourceType: "MANUAL" },
];

// ============================================================================
// TOPIC 1 - NHÓM 7: /eɪ/ & /aɪ/ (day/die) - KẾT THÚC BẰNG /ɪ/
// ============================================================================

export const WORDS_T1_G07_EI_AI: WordItemData[] = [
  { word: "day", ipa: "/deɪ/", soundGroupId: "map-t1-g07-ei-ai", targetPhonemes: ["/eɪ/"], difficulty: 3, exampleSentence: "Have a nice day.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/eɪ/ trượt từ /e/ lên /ɪ/" },
  { word: "die", ipa: "/daɪ/", soundGroupId: "map-t1-g07-ei-ai", targetPhonemes: ["/aɪ/"], difficulty: 3, exampleSentence: "The plant will die.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/aɪ/ trượt từ /a/ lên /ɪ/" },
  { word: "make", ipa: "/meɪk/", soundGroupId: "map-t1-g07-ei-ai", targetPhonemes: ["/eɪ/"], difficulty: 3, exampleSentence: "Make a cake.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "my", ipa: "/maɪ/", soundGroupId: "map-t1-g07-ei-ai", targetPhonemes: ["/aɪ/"], difficulty: 2, exampleSentence: "My book is here.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "they", ipa: "/ðeɪ/", soundGroupId: "map-t1-g07-ei-ai", targetPhonemes: ["/eɪ/"], difficulty: 4, exampleSentence: "They are friends.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "thigh", ipa: "/θaɪ/", soundGroupId: "map-t1-g07-ei-ai", targetPhonemes: ["/aɪ/"], difficulty: 5, exampleSentence: "My thigh hurts.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "name", ipa: "/neɪm/", soundGroupId: "map-t1-g07-ei-ai", targetPhonemes: ["/eɪ/"], difficulty: 3, exampleSentence: "What is your name?", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "time", ipa: "/taɪm/", soundGroupId: "map-t1-g07-ei-ai", targetPhonemes: ["/aɪ/"], difficulty: 3, exampleSentence: "What time is it?", status: "ACTIVE", sourceType: "FREE_API" },
];

export const MINIMAL_PAIRS_T1_G07: MinimalPairData[] = [
  { word1: "day", ipa1: "/deɪ/", word2: "die", ipa2: "/daɪ/", soundGroupId: "map-t1-g07-ei-ai", contrastPhonemes: ["/eɪ/", "/aɪ/"], difficulty: 3, explanation: "/eɪ/ từ /e/, /aɪ/ từ /a/ — cùng kết /ɪ/", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp diphthong cơ bản" },
  { word1: "make", ipa1: "/meɪk/", word2: "Mike", ipa2: "/maɪk/", soundGroupId: "map-t1-g07-ei-ai", contrastPhonemes: ["/eɪ/", "/aɪ/"], difficulty: 4, status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "they", ipa1: "/ðeɪ/", word2: "thigh", ipa2: "/θaɪ/", soundGroupId: "map-t1-g07-ei-ai", contrastPhonemes: ["/eɪ/", "/aɪ/"], difficulty: 5, status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "name", ipa1: "/neɪm/", word2: "time", ipa2: "/taɪm/", soundGroupId: "map-t1-g07-ei-ai", contrastPhonemes: ["/eɪ/", "/aɪ/"], difficulty: 4, status: "ACTIVE", sourceType: "MANUAL" },
];

export const SENTENCES_T1_G07: SentenceItemData[] = [
  { sentence: "Make my day with your name.", soundGroupId: "map-t1-g07-ei-ai", targetWords: ["Make", "my", "day", "name"], targetPhonemes: ["/eɪ/", "/aɪ/", "/eɪ/", "/eɪ/"], difficulty: 5, status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Câu chứa cả 2 diphthong" },
  { sentence: "They had a good time.", soundGroupId: "map-t1-g07-ei-ai", targetWords: ["They", "time"], targetPhonemes: ["/eɪ/", "/aɪ/"], difficulty: 4, status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "My thigh hurts today.", soundGroupId: "map-t1-g07-ei-ai", targetWords: ["My", "thigh"], targetPhonemes: ["/aɪ/", "/aɪ/"], difficulty: 5, status: "ACTIVE", sourceType: "MANUAL" },
];

// ============================================================================
// TOPIC 1 - NHÓM 8: /ɔɪ/ & /aʊ/ (boy/now) - /ɔɪ/ LÊN, /aʊ/ XUỐNG-LÊN
// ============================================================================

export const WORDS_T1_G08_OI_AU: WordItemData[] = [
  { word: "boy", ipa: "/bɔɪ/", soundGroupId: "map-t1-g08-oi-au", targetPhonemes: ["/ɔɪ/"], difficulty: 4, exampleSentence: "The boy is tall.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/ɔɪ/ trượt từ /ɔ/ lên /ɪ/" },
  { word: "now", ipa: "/naʊ/", soundGroupId: "map-t1-g08-oi-au", targetPhonemes: ["/aʊ/"], difficulty: 3, exampleSentence: "Do it now.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/aʊ/ trượt từ /a/ tới /ʊ/" },
  { word: "coin", ipa: "/kɔɪn/", soundGroupId: "map-t1-g08-oi-au", targetPhonemes: ["/ɔɪ/"], difficulty: 4, exampleSentence: "I have a coin.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "house", ipa: "/haʊs/", soundGroupId: "map-t1-g08-oi-au", targetPhonemes: ["/aʊ/"], difficulty: 3, exampleSentence: "My house is big.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "voice", ipa: "/vɔɪs/", soundGroupId: "map-t1-g08-oi-au", targetPhonemes: ["/ɔɪ/"], difficulty: 5, exampleSentence: "Your voice is nice.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "mouse", ipa: "/maʊs/", soundGroupId: "map-t1-g08-oi-au", targetPhonemes: ["/aʊ/"], difficulty: 3, exampleSentence: "The mouse is small.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "choice", ipa: "/tʃɔɪs/", soundGroupId: "map-t1-g08-oi-au", targetPhonemes: ["/ɔɪ/"], difficulty: 5, exampleSentence: "Make your choice.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "out", ipa: "/aʊt/", soundGroupId: "map-t1-g08-oi-au", targetPhonemes: ["/aʊ/"], difficulty: 3, exampleSentence: "Go out and play.", status: "ACTIVE", sourceType: "FREE_API" },
];

export const MINIMAL_PAIRS_T1_G08: MinimalPairData[] = [
  { word1: "boy", ipa1: "/bɔɪ/", word2: "bow", ipa2: "/baʊ/", soundGroupId: "map-t1-g08-oi-au", contrastPhonemes: ["/ɔɪ/", "/aʊ/"], difficulty: 5, explanation: "/ɔɪ/ kết /ɪ/, /aʊ/ kết /ʊ/ — hướng khác nhau", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp diphthong khác hướng" },
  { word1: "coin", ipa1: "/kɔɪn/", word2: "count", ipa2: "/kaʊnt/", soundGroupId: "map-t1-g08-oi-au", contrastPhonemes: ["/ɔɪ/", "/aʊ/"], difficulty: 5, status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "voice", ipa1: "/vɔɪs/", word2: "vow", ipa2: "/vaʊ/", soundGroupId: "map-t1-g08-oi-au", contrastPhonemes: ["/ɔɪ/", "/aʊ/"], difficulty: 6, status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "choice", ipa1: "/tʃɔɪs/", word2: "chouse", ipa2: "/tʃaʊs/", soundGroupId: "map-t1-g08-oi-au", contrastPhonemes: ["/ɔɪ/", "/aʊ/"], difficulty: 6, status: "ACTIVE", sourceType: "MANUAL", reviewNote: "chouse là từ hiếm, dùng minh họa cặp" },
];

export const SENTENCES_T1_G08: SentenceItemData[] = [
  { sentence: "The boy found a coin in the house.", soundGroupId: "map-t1-g08-oi-au", targetWords: ["boy", "coin", "house"], targetPhonemes: ["/ɔɪ/", "/ɔɪ/", "/aʊ/"], difficulty: 5, status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Câu chứa cả 2 diphthong" },
  { sentence: "The mouse ran out of the house.", soundGroupId: "map-t1-g08-oi-au", targetWords: ["mouse", "out", "house"], targetPhonemes: ["/aʊ/", "/aʊ/", "/aʊ/"], difficulty: 4, status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Make your choice with your voice.", soundGroupId: "map-t1-g08-oi-au", targetWords: ["choice", "voice"], targetPhonemes: ["/ɔɪ/", "/ɔɪ/"], difficulty: 5, status: "ACTIVE", sourceType: "MANUAL" },
];

// ============================================================================
// TOPIC 1 - NHÓM 9: /əʊ/ & /eə/ (go/air) - NHÓM TRUNG TÂM
// ============================================================================

export const WORDS_T1_G09_OU_EA: WordItemData[] = [
  { word: "go", ipa: "/ɡəʊ/", soundGroupId: "map-t1-g09-ou-ea", targetPhonemes: ["/əʊ/"], difficulty: 3, exampleSentence: "Let's go home.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/əʊ/ trượt từ schwa tới /ʊ/" },
  { word: "air", ipa: "/eə/", soundGroupId: "map-t1-g09-ou-ea", targetPhonemes: ["/eə/"], difficulty: 4, exampleSentence: "The air is fresh.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/eə/ trượt từ /e/ tới schwa" },
  { word: "home", ipa: "/həʊm/", soundGroupId: "map-t1-g09-ou-ea", targetPhonemes: ["/əʊ/"], difficulty: 3, exampleSentence: "I go home.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "care", ipa: "/keə/", soundGroupId: "map-t1-g09-ou-ea", targetPhonemes: ["/eə/"], difficulty: 4, exampleSentence: "Take care of yourself.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "know", ipa: "/nəʊ/", soundGroupId: "map-t1-g09-ou-ea", targetPhonemes: ["/əʊ/"], difficulty: 3, exampleSentence: "I know the answer.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "there", ipa: "/ðeə/", soundGroupId: "map-t1-g09-ou-ea", targetPhonemes: ["/eə/"], difficulty: 4, exampleSentence: "He is there.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "show", ipa: "/ʃəʊ/", soundGroupId: "map-t1-g09-ou-ea", targetPhonemes: ["/əʊ/"], difficulty: 4, exampleSentence: "Show me the way.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "where", ipa: "/weə/", soundGroupId: "map-t1-g09-ou-ea", targetPhonemes: ["/eə/"], difficulty: 4, exampleSentence: "Where are you?", status: "ACTIVE", sourceType: "FREE_API" },
];

export const MINIMAL_PAIRS_T1_G09: MinimalPairData[] = [
  { word1: "go", ipa1: "/ɡəʊ/", word2: "gear", ipa2: "/ɡɪə/", soundGroupId: "map-t1-g09-ou-ea", contrastPhonemes: ["/əʊ/", "/ɪə/"], difficulty: 6, explanation: "Cặp diphthong trung tâm", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Phân biệt 2 diphthong kết schwa" },
  { word1: "home", ipa1: "/həʊm/", word2: "hair", ipa2: "/heə/", soundGroupId: "map-t1-g09-ou-ea", contrastPhonemes: ["/əʊ/", "/eə/"], difficulty: 5, status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "know", ipa1: "/nəʊ/", word2: "near", ipa2: "/nɪə/", soundGroupId: "map-t1-g09-ou-ea", contrastPhonemes: ["/əʊ/", "/ɪə/"], difficulty: 6, status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "show", ipa1: "/ʃəʊ/", word2: "share", ipa2: "/ʃeə/", soundGroupId: "map-t1-g09-ou-ea", contrastPhonemes: ["/əʊ/", "/eə/"], difficulty: 5, status: "ACTIVE", sourceType: "MANUAL" },
];

export const SENTENCES_T1_G09: SentenceItemData[] = [
  { sentence: "Go home and take care.", soundGroupId: "map-t1-g09-ou-ea", targetWords: ["Go", "home", "care"], targetPhonemes: ["/əʊ/", "/əʊ/", "/eə/"], difficulty: 5, status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Câu chứa cả 2 diphthong" },
  { sentence: "I know where he is there.", soundGroupId: "map-t1-g09-ou-ea", targetWords: ["know", "where", "there"], targetPhonemes: ["/əʊ/", "/eə/", "/eə/"], difficulty: 5, status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Show me the way home.", soundGroupId: "map-t1-g09-ou-ea", targetWords: ["Show", "home"], targetPhonemes: ["/əʊ/", "/əʊ/"], difficulty: 4, status: "ACTIVE", sourceType: "MANUAL" },
];

// ============================================================================
// TOPIC 1 - NHÓM 10: /ɪə/ & /ʊə/ (ear/tour) - KẾT THÚC BẰNG SCHWA
// ============================================================================

export const WORDS_T1_G10_IA_UA: WordItemData[] = [
  { word: "ear", ipa: "/ɪə/", soundGroupId: "map-t1-g10-ia-ua", targetPhonemes: ["/ɪə/"], difficulty: 4, exampleSentence: "I have an ear ache.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/ɪə/ trượt từ /ɪ/ tới schwa" },
  { word: "tour", ipa: "/tʊə/", soundGroupId: "map-t1-g10-ia-ua", targetPhonemes: ["/ʊə/"], difficulty: 6, exampleSentence: "The tour was great.", status: "ACTIVE", sourceType: "FREE_API", reviewNote: "/ʊə/ trượt từ /ʊ/ tới schwa" },
  { word: "here", ipa: "/hɪə/", soundGroupId: "map-t1-g10-ia-ua", targetPhonemes: ["/ɪə/"], difficulty: 4, exampleSentence: "Come here.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "poor", ipa: "/pʊə/", soundGroupId: "map-t1-g10-ia-ua", targetPhonemes: ["/ʊə/"], difficulty: 5, exampleSentence: "The poor man needs help.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "fear", ipa: "/fɪə/", soundGroupId: "map-t1-g10-ia-ua", targetPhonemes: ["/ɪə/"], difficulty: 4, exampleSentence: "Don't fear the dark.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "sure", ipa: "/ʃʊə/", soundGroupId: "map-t1-g10-ia-ua", targetPhonemes: ["/ʊə/"], difficulty: 5, exampleSentence: "I am sure.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "near", ipa: "/nɪə/", soundGroupId: "map-t1-g10-ia-ua", targetPhonemes: ["/ɪə/"], difficulty: 4, exampleSentence: "The shop is near.", status: "ACTIVE", sourceType: "FREE_API" },
  { word: "pure", ipa: "/pjʊə/", soundGroupId: "map-t1-g10-ia-ua", targetPhonemes: ["/ʊə/"], difficulty: 6, exampleSentence: "The water is pure.", status: "ACTIVE", sourceType: "FREE_API" },
];

export const MINIMAL_PAIRS_T1_G10: MinimalPairData[] = [
  { word1: "ear", ipa1: "/ɪə/", word2: "tour", ipa2: "/tʊə/", soundGroupId: "map-t1-g10-ia-ua", contrastPhonemes: ["/ɪə/", "/ʊə/"], difficulty: 5, explanation: "/ɪə/ từ /ɪ/, /ʊə/ từ /ʊ/ — cùng kết schwa", status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Cặp diphthong kết schwa" },
  { word1: "here", ipa1: "/hɪə/", word2: "poor", ipa2: "/pʊə/", soundGroupId: "map-t1-g10-ia-ua", contrastPhonemes: ["/ɪə/", "/ʊə/"], difficulty: 5, status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "fear", ipa1: "/fɪə/", word2: "sure", ipa2: "/ʃʊə/", soundGroupId: "map-t1-g10-ia-ua", contrastPhonemes: ["/ɪə/", "/ʊə/"], difficulty: 5, status: "ACTIVE", sourceType: "MANUAL" },
  { word1: "near", ipa1: "/nɪə/", word2: "pure", ipa2: "/pjʊə/", soundGroupId: "map-t1-g10-ia-ua", contrastPhonemes: ["/ɪə/", "/ʊə/"], difficulty: 6, status: "ACTIVE", sourceType: "MANUAL" },
];

export const SENTENCES_T1_G10: SentenceItemData[] = [
  { sentence: "Come here near my ear.", soundGroupId: "map-t1-g10-ia-ua", targetWords: ["here", "near", "ear"], targetPhonemes: ["/ɪə/", "/ɪə/", "/ɪə/"], difficulty: 5, status: "ACTIVE", sourceType: "MANUAL", reviewNote: "Câu nhiều /ɪə/" },
  { sentence: "The poor man is sure of the tour.", soundGroupId: "map-t1-g10-ia-ua", targetWords: ["poor", "sure", "tour"], targetPhonemes: ["/ʊə/", "/ʊə/", "/ʊə/"], difficulty: 6, status: "ACTIVE", sourceType: "MANUAL" },
  { sentence: "Don't fear the pure air.", soundGroupId: "map-t1-g10-ia-ua", targetWords: ["fear", "pure"], targetPhonemes: ["/ɪə/", "/ʊə/"], difficulty: 6, status: "ACTIVE", sourceType: "MANUAL" },
];
```

- [ ] **Step 2: Thêm 7 key vào `LESSON_CONTENT_BY_SOUND_GROUP`**

Tìm block `export const LESSON_CONTENT_BY_SOUND_GROUP = {` (gần cuối file), thêm 7 key mới (sau 5 key cũ). Block mới:

```typescript
  "map-t1-g03-central": {
    words: WORDS_T1_G03_CENTRAL,
    minimalPairs: MINIMAL_PAIRS_T1_G03,
    sentences: SENTENCES_T1_G03,
  },
  "map-t1-g05-u-uh": {
    words: WORDS_T1_G05_U_UH,
    minimalPairs: MINIMAL_PAIRS_T1_G05,
    sentences: SENTENCES_T1_G05,
  },
  "map-t1-g06-er": {
    words: WORDS_T1_G06_ER,
    minimalPairs: MINIMAL_PAIRS_T1_G06,
    sentences: SENTENCES_T1_G06,
  },
  "map-t1-g07-ei-ai": {
    words: WORDS_T1_G07_EI_AI,
    minimalPairs: MINIMAL_PAIRS_T1_G07,
    sentences: SENTENCES_T1_G07,
  },
  "map-t1-g08-oi-au": {
    words: WORDS_T1_G08_OI_AU,
    minimalPairs: MINIMAL_PAIRS_T1_G08,
    sentences: SENTENCES_T1_G08,
  },
  "map-t1-g09-ou-ea": {
    words: WORDS_T1_G09_OU_EA,
    minimalPairs: MINIMAL_PAIRS_T1_G09,
    sentences: SENTENCES_T1_G09,
  },
  "map-t1-g10-ia-ua": {
    words: WORDS_T1_G10_IA_UA,
    minimalPairs: MINIMAL_PAIRS_T1_G10,
    sentences: SENTENCES_T1_G10,
  },
```

- [ ] **Step 3: Run test to verify it passes**

Run: `cd english_pronunciation_app\frontend && npm test`
Expected: PASS — test content 7 nhóm + 24 test cũ + 8 catalog = tất cả pass.

- [ ] **Step 4: Commit**

```bash
git add english_pronunciation_app/frontend/prisma/lesson-content.ts english_pronunciation_app/frontend/src/lib/__tests__/lesson-content.test.ts
git commit -m "SP3a.2: content 7 nhom CD1 moi (g03 central, g05 u-uh, g06 er, g07 ei-ai, g08 oi-au, g09 ou-ea, g10 ia-ua) - pass test"
```

---

### Task 3: Viết script rút ruột audio local (`seed_audio_local.ts`)

**Files:**
- Create: `frontend/prisma/seed_audio_local.ts`

- [ ] **Step 1: Tạo script**

Tạo `frontend/prisma/seed_audio_local.ts`:

```typescript
/**
 * SEED AUDIO LOCAL - Rút ruột audio mp3 về public/audio (chạy 1 lần lúc code)
 *
 * Mục đích: app tự chứa audio, không phụ thuộc API runtime → an toàn bảo vệ phản biện.
 * Nguồn: Free Dictionary API (audio từ Wiktionary, CC-BY-SA 3.0).
 *
 * Pipeline:
 * 1. Đọc tất cả WordItem có sourceType = "FREE_API" trong DB
 * 2. Với mỗi từ: nếu public/audio/{word}.mp3 đã có → skip (idempotent)
 *    - Gọi https://api.dictionaryapi.dev/api/v2/entries/en/{word}
 *    - Lấy link mp3 (ưu tiên UK, sau US, sau bất kỳ)
 *    - Tải mp3 về frontend/public/audio/{word}.mp3
 *    - Cập nhật DB: audioUrl = "/audio/{word}.mp3", audioSource = "FREE_DICTIONARY"
 *    - Nếu fail/không audio → giữ status = NEEDS_REVIEW, audioUrl = null
 * 3. Log: số từ tải thành công, số fail
 *
 * Chạy: npx tsx prisma/seed_audio_local.ts
 */

import { PrismaClient } from "@prisma/client";
import { promises as fs } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const prisma = new PrismaClient();
const __dirname = dirname(fileURLToPath(import.meta.url));
const AUDIO_DIR = join(__dirname, "..", "public", "audio");

async function fetchAudioLink(word: string): Promise<string | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 8000);
  try {
    const res = await fetch(
      `https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word.toLowerCase())}`,
      { signal: controller.signal },
    );
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{ phonetics?: Array<{ audio?: string }> }>;
    const phonetics = data[0]?.phonetics ?? [];
    const uk = phonetics.find((p) => p.audio && p.audio.includes("-uk"));
    const us = phonetics.find((p) => p.audio && p.audio.includes("-us"));
    const any = phonetics.find((p) => p.audio && p.audio.length > 0);
    const chosen = uk?.audio || us?.audio || any?.audio || null;
    return chosen && chosen.startsWith("https") ? chosen : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function downloadMp3(url: string, destPath: string): Promise<boolean> {
  try {
    const res = await fetch(url);
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    await fs.writeFile(destPath, buf);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  console.log("🔊 Rút ruột audio local về public/audio...\n");
  await fs.mkdir(AUDIO_DIR, { recursive: true });

  const words = await prisma.wordItem.findMany({
    where: { sourceType: "FREE_API" },
    select: { id: true, word: true, audioUrl: true, status: true },
  });
  console.log(`   Tìm thấy ${words.length} WordItem FREE_API.`);

  let success = 0;
  let skipped = 0;
  let failed = 0;
  const failedWords: string[] = [];

  for (const w of words) {
    const localPath = join(AUDIO_DIR, `${w.word}.mp3`);
    const localUrl = `/audio/${w.word}.mp3`;

    // Idempotent: skip nếu file đã có
    try {
      await fs.access(localPath);
      // File đã có → chỉ cập nhật DB nếu audioUrl chưa phải local
      if (w.audioUrl !== localUrl) {
        await prisma.wordItem.update({
          where: { id: w.id },
          data: { audioUrl: localUrl, audioSource: "FREE_DICTIONARY" },
        });
      }
      skipped++;
      continue;
    } catch {
      // File chưa có → tiếp tục tải
    }

    const link = await fetchAudioLink(w.word);
    if (!link) {
      console.warn(`   ⚠️  Không có audio cho "${w.word}" → NEEDS_REVIEW`);
      await prisma.wordItem.update({
        where: { id: w.id },
        data: { status: "NEEDS_REVIEW", audioUrl: null },
      });
      failed++;
      failedWords.push(w.word);
      continue;
    }

    const ok = await downloadMp3(link, localPath);
    if (!ok) {
      console.warn(`   ⚠️  Tải mp3 fail cho "${w.word}" → NEEDS_REVIEW`);
      await prisma.wordItem.update({
        where: { id: w.id },
        data: { status: "NEEDS_REVIEW", audioUrl: null },
      });
      failed++;
      failedWords.push(w.word);
      continue;
    }

    await prisma.wordItem.update({
      where: { id: w.id },
      data: { audioUrl: localUrl, audioSource: "FREE_DICTIONARY", status: "ACTIVE" },
    });
    success++;
    console.log(`   ✅ ${w.word} → ${localUrl}`);
  }

  console.log(`\n📊 Kết quả: ${success} tải mới, ${skipped} đã có (skip), ${failed} fail (NEEDS_REVIEW).`);
  if (failedWords.length > 0) {
    console.log(`   Từ fail: ${failedWords.join(", ")}`);
  }
  console.log(`\n💡 Audio lưu tại frontend/public/audio/ (CC-BY-SA Wiktionary qua Free Dictionary API).`);
}

main()
  .catch((e) => {
    console.error("❌ Lỗi:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
```

- [ ] **Step 2: Commit (chưa chạy — chạy sau khi re-seed ở Task 4)**

```bash
git add english_pronunciation_app/frontend/prisma/seed_audio_local.ts
git commit -m "SP3a.3: script rut ruot audio local (seed_audio_local.ts) - tai mp3 Free Dictionary API ve public/audio"
```

---

### Task 4: Re-seed + chạy rút ruột audio + verify

**Files:** không sửa code, chỉ chạy.

- [ ] **Step 1: Dọn DB + re-seed (content 10 nhóm CĐ1)**

```bash
cd english_pronunciation_app\frontend
npx tsx prisma/db_cleanup.ts
npx tsx prisma/seed_lessons.ts
cd ..\..
```
Expected: seed log ra 10 nhóm CĐ1 có content (5 cũ + 7 mới), 30 nhóm tổng, 112 exercise. QBI + Question sinh cho 10 nhóm.

- [ ] **Step 2: Chạy rút ruột audio local**

```bash
cd english_pronunciation_app\frontend
npx tsx prisma/seed_audio_local.ts
cd ..\..
```
Expected: log số từ tải thành công (~75-80), skip, fail. File mp3 xuất hiện trong `frontend/public/audio/`.

- [ ] **Step 3: Verify audio local + DB bằng script tạm**

Tạo `frontend/prisma/_verify_sp3a.ts`:

```typescript
import { PrismaClient } from "@prisma/client";
import { promises as fs } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const prisma = new PrismaClient();
const __dirname = dirname(fileURLToPath(import.meta.url));
const AUDIO_DIR = join(__dirname, "..", "public", "audio");

async function main() {
  const cd1GroupIds = ["map-t1-g01-i-ih", "map-t1-g02-e-ae", "map-t1-g03-central", "map-t1-g04-o-oh", "map-t1-g05-u-uh", "map-t1-g06-er", "map-t1-g07-ei-ai", "map-t1-g08-oi-au", "map-t1-g09-ou-ea", "map-t1-g10-ia-ua"];
  // Lấy worditem qua minimalpair/sentence soundGroupId? WordItem không có soundGroupId trực tiếp.
  // Thay vào đó đếm tổng + kiểm audioUrl local.
  const totalWords = await prisma.wordItem.count();
  const localAudio = await prisma.wordItem.count({ where: { audioUrl: { startsWith: "/audio/" } } });
  const needReview = await prisma.wordItem.count({ where: { status: "NEEDS_REVIEW" } });
  const remoteAudio = await prisma.wordItem.count({ where: { audioUrl: { contains: "api.dictionaryapi.dev" } } });
  const files = await fs.readdir(AUDIO_DIR).catch(() => []);
  const mp3Files = files.filter((f) => f.endsWith(".mp3"));

  console.log("WordItem tổng:", totalWords);
  console.log("audioUrl local (/audio/...):", localAudio);
  console.log("audioUrl remote (còn lỗi):", remoteAudio);
  console.log("NEEDS_REVIEW (thiếu audio):", needReview);
  console.log("File mp3 trong public/audio:", mp3Files.length);

  const ok = totalWords > 0 && localAudio > 0 && remoteAudio === 0 && mp3Files.length > 0;
  console.log(ok ? "PASS ✅" : "FAIL ❌");
}
main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
```

Run: `cd english_pronunciation_app\frontend && npx tsx prisma/_verify_sp3a.ts`
Expected: `PASS ✅` — `remoteAudio === 0` (tất cả chuyển sang local), `localAudio > 0`, `mp3Files.length > 0`.

- [ ] **Step 4: Xóa script verify tạm**

```bash
cd english_pronunciation_app\frontend
del prisma\_verify_sp3a.ts
cd ..\..
```

- [ ] **Step 5: Commit (audio KHÔNG commit — .gitignore ở Task 5)**

```bash
git commit --allow-empty -m "SP3a.4: re-seed CD1 (10 nhom) + rut ruot audio local - verify PASS (remoteAudio=0)"
```

---

### Task 5: Thêm nút "Nghe mẫu" speechSynthesis cho sentence trong engine

**Files:**
- Modify: `frontend/src/app/exercises/[id]/ExerciseEngineClient.tsx` (block VoiceQuestion ~dòng 456-461)

- [ ] **Step 1: Thêm helper speakSentence + nút nghe mẫu**

Trong `frontend/src/app/exercises/[id]/ExerciseEngineClient.tsx`, tìm block (khoảng dòng 456-461):

```tsx
        {/* Audio sample button */}
        {(status === "idle" || status === "error" || status === "incorrect") && contentData.audioUrl && (
          <div className="mb-6 flex justify-center">
            <AudioButton audioUrl={contentData.audioUrl} label="🔊 Nghe phát âm mẫu" />
          </div>
        )}
```

Thay bằng:

```tsx
        {/* Audio sample button */}
        {(status === "idle" || status === "error" || status === "incorrect") && (
          <div className="mb-6 flex justify-center gap-3">
            {contentData.audioUrl && (
              <AudioButton audioUrl={contentData.audioUrl} label="🔊 Nghe phát âm mẫu" />
            )}
            {isSentenceMode && (
              <button
                type="button"
                onClick={() => {
                  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
                  const utter = new SpeechSynthesisUtterance(question.answer);
                  utter.lang = "en-US";
                  // Ưu tiên voice en-US/en-UK có trên máy
                  const voices = window.speechSynthesis.getVoices();
                  const enVoice = voices.find((v) => v.lang === "en-US") || voices.find((v) => v.lang.startsWith("en"));
                  if (enVoice) utter.voice = enVoice;
                  window.speechSynthesis.cancel();
                  window.speechSynthesis.speak(utter);
                }}
                className="inline-flex min-h-11 items-center justify-center rounded-lg border border-accent-200 bg-accent-50 px-4 py-2 text-sm font-bold text-accent-700 transition-colors hover:bg-accent-100 focus:outline-none focus-visible:ring-4 focus-visible:ring-accent-500"
                aria-label="Nghe mẫu câu bằng giọng trình duyệt"
              >
                🎧 Nghe mẫu câu
              </button>
            )}
          </div>
        )}
```

- [ ] **Step 2: tsc check**

```bash
cd english_pronunciation_app\frontend
npx tsc --noEmit --pretty false
cd ..\..
```
Expected: không output (pass).

- [ ] **Step 3: Commit**

```bash
git add english_pronunciation_app/frontend/src/app/exercises/[id]/ExerciseEngineClient.tsx
git commit -m "SP3a.5: them nut 'Nghe mau cau' bang speechSynthesis cho sentence mode (Web Speech API)"
```

---

### Task 6: .gitignore audio + README + CURRENT_PROJECT_CONTEXT

**Files:**
- Modify: `english_pronunciation_app/.gitignore`
- Modify: `english_pronunciation_app/frontend/README.md`
- Modify: `PLAN/00_Project_Context/CURRENT_PROJECT_CONTEXT.md`

- [ ] **Step 1: Thêm .gitignore cho audio**

Đọc `english_pronunciation_app/.gitignore`, thêm dòng cuối:

```
# Audio data sinh ra bởi seed_audio_local.ts (không commit, chạy script để tải)
frontend/public/audio/*.mp3
```

- [ ] **Step 2: Cập nhật README**

Đọc `english_pronunciation_app/frontend/README.md` (nếu rỗng/thiếu, tạo mới). Thêm mục "Cài đặt dữ liệu + audio":

```markdown
## Cài đặt dữ liệu + audio

1. Cấu hình `DATABASE_URL` trong `.env` (PostgreSQL).
2. `npx prisma db push` (tạo/cập nhật schema).
3. `npx tsx prisma/db_cleanup.ts` (dọn DB nếu cần re-seed sạch).
4. `npm run db:seed:lessons` (seed content: topic/nhóm/exercise/question).
5. `npx tsx prisma/seed_audio_local.ts` (tải audio mp3 về `public/audio/` — chạy 1 lần, idempotent).

**Nguồn dữ liệu:**
- IPA: CMU Pronouncing Dictionary (open data) + Free Dictionary API.
- Audio: Wiktionary (CC-BY-SA 3.0) via Free Dictionary API.
- Minimal pair / câu: tự biên soạn (MANUAL), tham khảo phương pháp từ Ship or Sheep (Baker), English Pronunciation in Use (Hancock).

**Lưu ý:** audio mp3 KHÔNG commit vào git (`.gitignore`). Chạy `seed_audio_local.ts` để tải về local.
```

- [ ] **Step 3: Cập nhật CURRENT_PROJECT_CONTEXT.md**

Trong `PLAN/00_Project_Context/CURRENT_PROJECT_CONTEXT.md`, thêm vào mục "8. Quy ước" (hoặc tạo mục "9. Nguồn dữ liệu"):

```markdown
## 9. Nguồn dữ liệu (SP3a, 18/06/2026)

- **IPA**: CMU Pronouncing Dictionary (open data) + Free Dictionary API (verify).
- **Audio mp3 (từ)**: Free Dictionary API (audio từ Wiktionary, CC-BY-SA 3.0) → tải về `frontend/public/audio/` qua `seed_audio_local.ts` (chạy 1 lần, idempotent). App runtime đọc audio local → tự chứa, không phụ thuộc API.
- **Audio (câu)**: Web Speech API (`window.speechSynthesis`) runtime, voice cài trên trình duyệt.
- **Minimal pair / câu**: tự biên soạn (MANUAL), tham khảo phương pháp từ Ship or Sheep (Baker), English Pronunciation in Use (Hancock). KHÔNG copy text/audio sách.
- **Cambridge/Oxford**: chỉ đối chiếu IPA thủ công, KHÔNG scrape, KHÔNG lưu audio.
- **Credit**: ghi trong README + báo cáo khóa luận.
```

- [ ] **Step 4: Commit**

```bash
git add english_pronunciation_app/.gitignore english_pronunciation_app/frontend/README.md PLAN/00_Project_Context/CURRENT_PROJECT_CONTEXT.md
git commit -m "SP3a.6: gitignore audio + README huong dan seed + CURRENT_PROJECT_CONTEXT ghi nguon du lieu"
```

---

### Task 7: Quality gate

**Files:** không sửa, chỉ verify.

- [ ] **Step 1: prisma validate + tsc**

```bash
cd english_pronunciation_app\frontend
npx prisma validate
npx tsc --noEmit --pretty false
cd ..\..
```
Expected: schema valid; tsc không lỗi.

- [ ] **Step 2: npm test**

```bash
cd english_pronunciation_app\frontend
npm test
cd ..\..
```
Expected: `pass 29` (24 cũ + 5 content mới), `fail 0`.

- [ ] **Step 3: npm run build**

```bash
cd english_pronunciation_app\frontend
npm run build
cd ..\..
```
Expected: `✓ Compiled successfully`, `✓ Generating static pages ... (24/24)`.

- [ ] **Step 4: Commit marker**

```bash
git commit --allow-empty -m "SP3a.7: quality gate pass (validate + tsc + 29 test + build) - CD1 10 nhom hoan thanh"
```

---

## Tiêu chí hoàn thành SP3a

- [ ] 7 nhóm CĐ1 mới có content (g03/g05/g06/g07/g08/g09/g10) — 5 test content pass.
- [ ] Re-seed: 10 nhóm CĐ1 ACTIVE (trừ g06 speak_minimal_pair DRAFT do không cặp).
- [ ] Script `seed_audio_local.ts` chạy: mp3 tải về `public/audio/`, `audioUrl` DB = `/audio/...` (local), `remoteAudio === 0`.
- [ ] Engine có nút "Nghe mẫu câu" (speechSynthesis) cho sentence mode.
- [ ] `.gitignore` audio + README hướng dẫn + CURRENT_PROJECT_CONTEXT ghi nguồn.
- [ ] Quality gate pass (validate + tsc + 29 test + build).
- [ ] XP/streak/badge/leaderboard/check-in KHÔNG bị đụng.

## Sau SP3a

User review content CĐ1 (10 nhóm). Nếu ưng ý → làm SP3b (CĐ2 12 nhóm Phụ âm + CĐ3 4 nhóm Minimal Pairs Khó + CĐ4 4 nhóm Trọng âm & Nối âm). Nếu cần sửa content → sửa trước khi SP3b.
