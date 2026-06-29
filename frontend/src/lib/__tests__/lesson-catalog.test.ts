import assert from "node:assert/strict";
import test from "node:test";
import {
  TOPICS,
  SOUND_GROUPS,
  EXERCISE_MODES,
  PHONEMES,
  TOTAL_LESSONS,
  getSoundGroupsByTopic,
} from "../../../prisma/lesson-catalog";

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
