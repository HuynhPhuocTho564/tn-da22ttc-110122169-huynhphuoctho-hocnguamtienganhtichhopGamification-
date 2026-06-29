import assert from "node:assert/strict";
import test from "node:test";
import {
  buildSkeleton,
  filterSinglePhonemeWords,
  buildContrastPhonemes,
  splitStages,
  cycleToTen,
} from "../../../prisma/listen-choose-builder";

test("buildSkeleton: thay targetPhoneme trong ipa bằng _", () => {
  assert.equal(buildSkeleton("/ʃiːp/", "/iː/"), "/ʃ_p/");
  assert.equal(buildSkeleton("/fɪl/", "/ɪ/"), "/f_l/");
  assert.equal(buildSkeleton("/siːt/", "/iː/"), "/s_t/");
});

test("buildSkeleton: target không có trong ipa → null (fallback)", () => {
  assert.equal(buildSkeleton("/kæt/", "/iː/"), null);
});

test("filterSinglePhonemeWords: chỉ giữ từ chứa đúng 1 âm trong contrastPhonemes", () => {
  const words = [
    { word: "sheep", ipa: "/ʃiːp/", targetPhoneme: "/iː/", audioUrl: "u1" },
    { word: "father", ipa: "/ˈfɑːðə/", targetPhoneme: "/ɑː/", audioUrl: "u2" }, // chứa cả /ə/
    { word: "ship", ipa: "/ʃɪp/", targetPhoneme: "/ɪ/", audioUrl: "u3" },
  ];
  const contrastPhonemes = ["/ɑː/", "/ʌ/", "/ə/"];
  // father chứa /ɑː/ và /ə/ (cả 2 trong contrast) → loại
  // sheep/ship không chứa âm nào trong contrast g03 → cũng loại (targetPhoneme phải nằm trong contrast)
  const filtered = filterSinglePhonemeWords(words, contrastPhonemes);
  assert.equal(filtered.length, 0);
});

test("filterSinglePhonemeWords: giữ từ có đúng 1 âm contrast (g01 i-ih)", () => {
  const words = [
    { word: "sheep", ipa: "/ʃiːp/", targetPhoneme: "/iː/", audioUrl: "u1" },
    { word: "ship", ipa: "/ʃɪp/", targetPhoneme: "/ɪ/", audioUrl: "u3" },
  ];
  const contrastPhonemes = ["/iː/", "/ɪ/"];
  const filtered = filterSinglePhonemeWords(words, contrastPhonemes);
  assert.equal(filtered.length, 2);
});

test("buildContrastPhonemes: nhóm 2-âm → 2 contrast", () => {
  assert.deepEqual(buildContrastPhonemes(["/iː/", "/ɪ/"], null), ["/iː/", "/ɪ/"]);
});

test("buildContrastPhonemes: nhóm 1-âm → mồi 1 từ neighbor", () => {
  assert.deepEqual(buildContrastPhonemes(["/ɜː/"], "/ʌ/"), ["/ɜː/", "/ʌ/"]);
});

test("splitStages: 10 index → 4 S1 + 4 S2 + 2 S3", () => {
  const stages = splitStages(10);
  assert.equal(stages[0], 1); // index 0 (câu 1)
  assert.equal(stages[3], 1); // câu 4
  assert.equal(stages[4], 2); // câu 5
  assert.equal(stages[7], 2); // câu 8
  assert.equal(stages[8], 3); // câu 9
  assert.equal(stages[9], 3); // câu 10
  assert.equal(stages.length, 10);
});

test("cycleToTen: pool 6 → lặp đến 10", () => {
  const pool = ["a", "b", "c", "d", "e", "f"];
  const result = cycleToTen(pool);
  assert.equal(result.length, 10);
  assert.equal(result[0], "a");
  assert.equal(result[6], "a"); // lặp
  assert.equal(result[9], "d");
});

test("cycleToTen: pool ≥10 → slice 10", () => {
  const pool = ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l"];
  const result = cycleToTen(pool);
  assert.equal(result.length, 10);
  assert.equal(result[0], "a");
  assert.equal(result[9], "j");
});
