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

test("pilot nhóm map-t1-g01-i-ih: mỗi sentence có ipa RP (bắt đầu /)", () => {
  const content = getContentBySoundGroup("map-t1-g01-i-ih");
  assert.ok(content, "nhóm map-t1-g01-i-ih phải có content");
  for (const sent of content!.sentences) {
    assert.ok(sent.ipa, `sentence "${sent.sentence}" thiếu ipa`);
    assert.ok(sent.ipa!.startsWith("/"), `ipa "${sent.ipa}" phải bắt đầu bằng /`);
  }
});

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

// ===== CD3 (Topic 3 - Minimal Pairs Khó): g02 + g04 =====

const CD3_GROUPS = [
  "map-t3-g02-initial-confuse",
  "map-t3-g04-dental-sibilant",
];

test("2 nhóm CD3 có trong LESSON_CONTENT_BY_SOUND_GROUP", () => {
  for (const id of CD3_GROUPS) {
    assert.ok(LESSON_CONTENT_BY_SOUND_GROUP[id as keyof typeof LESSON_CONTENT_BY_SOUND_GROUP], `Thiếu nhóm ${id}`);
  }
});

test("mỗi nhóm CD3 có words >= 8, minimalPairs >= 4, sentences >= 3", () => {
  for (const id of CD3_GROUPS) {
    const content = getContentBySoundGroup(id);
    assert.ok(content, `getContentBySoundGroup(${id}) trả undefined`);
    assert.ok(content!.words.length >= 8, `${id}: words >= 8 (hiện ${content!.words.length})`);
    assert.ok(content!.minimalPairs.length >= 4, `${id}: pairs >= 4 (hiện ${content!.minimalPairs.length})`);
    assert.ok(content!.sentences.length >= 3, `${id}: sentences >= 3 (hiện ${content!.sentences.length})`);
  }
});

test("mỗi word CD3 có soundGroupId khớp + ipa bắt đầu / + targetPhonemes", () => {
  for (const id of CD3_GROUPS) {
    const content = getContentBySoundGroup(id);
    for (const w of content!.words) {
      assert.equal(w.soundGroupId, id, `word "${w.word}" soundGroupId sai: ${w.soundGroupId}`);
      assert.ok(w.ipa.startsWith("/"), `word "${w.word}" ipa phải bắt đầu bằng /`);
      assert.ok(w.targetPhonemes.length > 0, `word "${w.word}" thiếu targetPhonemes`);
    }
  }
});

test("tổng số nhóm có content >= 28 (10 CD1 + 12 CD2 + 2 CD3 + 4 CD4)", () => {
  assert.ok(Object.keys(LESSON_CONTENT_BY_SOUND_GROUP).length >= 28, `Ít nhất 28 nhóm content (hiện ${Object.keys(LESSON_CONTENT_BY_SOUND_GROUP).length})`);
});
