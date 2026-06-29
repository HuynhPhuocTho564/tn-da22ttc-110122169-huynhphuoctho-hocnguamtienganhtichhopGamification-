# SP3b — Content + seed CĐ2 (12 nhóm Phụ âm) Design

Ngày: 2026-06-19
Trạng thái: design đã được user duyệt (hướng A: 1 đợt trọn 12 nhóm, scale 10/6/4)
Scope: master SP3 (content authoring) — đợt 2. SP3a đã làm CĐ1 (10 nhóm) + audio local. SP3b = CĐ2 (12 nhóm Phụ âm 5 tầng). **Defer sang SP3c**: CĐ3 (2 nhóm còn lại). **Defer sang SP3d**: CĐ4 (4 nhóm Trọng âm & Nối âm — cần UI SP4 trước).

Lưu ý tên: "SP3b" = content CĐ2 (master roadmap SP3 đợt 2). KHÁC "SP3 defer" (WPM/phoneme route — pause brainstorm, xem `CURRENT_PROJECT_CONTEXT.md` mục 11).

## Mục tiêu

Biên soạn content chỉn chu cho 12 nhóm CĐ2 (Phụ âm: Plosives 3 + Fricatives 5 + Affricates 1 + Nasals 1 + Approximants 2), re-seed để flip DRAFT→ACTIVE, rút audio mp3 local cho từ. Hoàn thiện lõi phát âm (CĐ1 nguyên âm + CĐ2 phụ âm = 22/30 nhóm content). User review chất lượng content CĐ2, ưng ý → làm tiếp SP3c (CĐ3) / SP3d (CĐ4).

## 1. Hiện trạng (nền tảng, không xây từ đầu)

- **Catalog v2 đã có 12 nhóm CĐ2** (`lesson-catalog.ts:178-195`): subcategory 5 tầng (Plosives/Fricatives/Affricates/Nasals/Approximants) — đã được `seed_subcategory.ts` (SP3a-fix) ghi lên `SoundGroup`/`LearningMap` rows.
- **Seed đã content-driven**: `seed_lessons.ts` iterate `Object.keys(LESSON_CONTENT_BY_SOUND_GROUP)` (line 411, 443) — chỉ seed content cho nhóm có entry trong map. Thêm 12 entry CD2 → seed tự flip DRAFT→ACTIVE + sinh WordItem/MinimalPair/SentenceItem/QuestionBankItem/Question. **Không sửa seed/catalog**.
- **Pattern content rõ** (từ CD1 SP3a): `WORDS_T2_G0N_*` / `MINIMAL_PAIRS_T2_G0N` / `SENTENCES_T2_G0N`, type `WordItemData[]` / `MinimalPairData[]` / `SentenceItemData[]` (`lesson-content.ts:14-55`). Field: `word/ipa/soundGroupId/targetPhonemes/difficulty/exampleSentence/status/sourceType/sourceUrl/reviewNote` (word), `word1/ipa1/word2/ipa2/soundGroupId/contrastPhonemes/difficulty/explanation/status/sourceType/reviewNote` (pair), `sentence/soundGroupId/targetWords/targetPhonemes/difficulty/translation/status/sourceType/reviewNote` (sentence). **Lưu ý**: field `exampleSentence` (không phải meaningVi), `explanation` (không phải note). KHÔNG author `syllables`/`stressIndex`/`wordStressType` (CĐ4-only).
- **Script audio local đã có** (`seed_audio_local.ts`): idempotent, query `WordItem` có `sourceType="FREE_API"`, skip file đã có, fetch Free Dictionary API → `/audio/{word}.mp3`, update DB audioUrl local. **Chạy lại 1 lần** cho từ CD2 mới.
- **Audio câu**: Web Speech API runtime (nút "Nghe mẫu câu" đã có từ SP3a `ExerciseEngineClient.tsx`). **KHÔNG rút local câu** (user chốt (a) Web Speech runtime như SP3a).
- **Test content đã có** (`lesson-content.test.ts`): 7 nhóm CD1 mới + threshold >=10. **Mở rộng** thêm 12 nhóm CD2.

## 2. 12 nhóm CĐ2 — content outline (scale 10 từ / 6 cặp / 4 câu, trừ g08-h 0 cặp)

Quy tắc (`ipa-pronunciation-pedagogy`): từ chung tiếng Anh, minimal pair cho contrast dễ nhầm người Việt, 1 bài 1 contrast, câu ngắn 1-2 target word, tránh homograph/từ hiếm, IPA verify cmudict.

| # | id | Âm target | Từ | Cặp | Câu | Điểm dễ nhầm (người Việt) |
|---|---|---|---:|---:|---:|---|
| 1 | `map-t2-g01-p-b` | /p/ voiceless, /b/ voiced | 10 | 6 | 4 | Gộp /p/ /b/; /p/ initial không thổi hơi như tiếng Việt |
| 2 | `map-t2-g02-t-d` | /t/ voiceless, /d/ voiced | 10 | 6 | 4 | /t/ dental vs /d/ voiced; cuối từ hay bỏ /d/ (bed→be) |
| 3 | `map-t2-g03-k-g` | /k/ voiceless, /g/ voiced | 10 | 6 | 4 | /k/ không thổi hơi như "k" Việt; /g/ cuối từ khó |
| 4 | `map-t2-g04-f-v` | /f/ voiceless, /v/ voiced | 10 | 6 | 4 | /v/ không có tiếng Việt → hay đọc /f/ hoặc "w" |
| 5 | `map-t2-g05-th-dh` | /θ/ voiceless (think), /ð/ voiced (this) | 10 | 6 | 4 | Cả 2 = "th" chữ viết; tiếng Việt không có → đọc "t" hoặc "s" |
| 6 | `map-t2-g06-s-z` | /s/ voiceless, /z/ voiced | 10 | 6 | 4 | /z/ cuối từ hay đọc /s/ (dogs→"dops"); /s/ sắc vs /z/ rung |
| 7 | `map-t2-g07-sh-zh` | /ʃ/ (shoe), /ʒ/ (vision) | 10 | 6 | 4 | /ʒ/ hiếm (measure/vision); hay đọc /ʃ/ cho cả 2 |
| 8 | `map-t2-g08-h` | /h/ đơn phoneme | 10 | **0** | 4 | /h/ Việt nhẹ; tiếng Anh /h/ thở hơi mạnh initial; không contrast tự nhiên |
| 9 | `map-t2-g09-ch-j` | /tʃ/ (chair), /dʒ/ (jump) | 10 | 6 | 4 | Affricate = stop+fricative; /dʒ/ voiced hay đọc /tʃ/ |
| 10 | `map-t2-g10-nasals` | /m/ /n/ /ŋ/ (3 âm mũi) | 10 | 6 | 4 | /ŋ/ cuối từ (sing) không có tiếng Việt → đọc /n/; cặp tập trung /n/ vs /ŋ/ |
| 11 | `map-t2-g11-l-r` | /l/ lateral, /r/ approximant | 10 | 6 | 4 | /r/ tiếng Anh curled không như "r" Việt; /l/ cuối từ dark /ɫ/ |
| 12 | `map-t2-g12-w-j` | /w/ (wet), /j/ (yet) | 10 | 6 | 4 | /j/ = "y" Việt OK; /w/ hay đọc /v/ (wine→vine) |

**Tổng: ~120 từ + ~66 cặp (g08-h 0) + ~48 câu.**

**Lưu ý pedagogy:**
- **g08-h 0 cặp** → `speak_minimal_pair` DRAFT (như g06 /ɜː/ SP3a). 3 mode khác (listen_choose/speak_word/speak_sentence) ACTIVE. listen_choose 3-stage tự mồi neighbor phoneme orderIndex±1 (g07 /ʃ//ʒ/ hoặc g09 /tʃ//dʒ/) qua `seed_lessons.ts:804-816`.
- **g10-nasals 3 âm**: cặp tập trung contrast /n/ vs /ŋ/ cuối từ (sing/sin, thing/thin, rang/ran) — điểm khó nhất người Việt. /m/ ít contrast (đầu từ OK).
- **Minimal pair pattern**: cặp cổ điển contrast voiceless vs voiced (pat/bat, ten/den, cap/gap, fan/van, think/this, sue/zoo, chair/share, etc.) — mỗi cặp 1 contrast rõ.
- **Câu**: 1-2 target word/câu, ngắn 5-8 từ, tránh homograph (read/live có 2 đọc).

## 3. Nguồn dữ liệu (an toàn bản quyền, y hệt SP3a)

| Loại content | Nguồn | Bản quyền |
|---|---|---|
| IPA cho WordItem | CMU Pronouncing Dictionary (open data) + Free Dictionary API (verify) | ✅ open |
| Audio mp3 cho từ | Free Dictionary API (audio từ Wiktionary, CC-BY-SA 3.0) → tải về local `/audio/{word}.mp3` qua `seed_audio_local.ts` | ✅ CC-BY-SA (credit已在 README) |
| Minimal pair (cặp từ) | Tự biên soạn MANUAL — từ tiếng Anh chung, tự sắp xếp cặp | ✅ từ chung, không copy sách |
| Câu thực chiến (speak_sentence) | Tự biên soạn MANUAL — câu ngắn 1-2 target word | ✅ không copy sách |
| Audio cho câu | Web Speech API (`window.speechSynthesis`) runtime, voice cài trên trình duyệt | ✅ miễn phí, không cần mạng |

**KHÔNG dùng**: copy audio Cambridge/Oxford, copy list câu sách (Ship or Sheep, English Pronunciation in Use), scrape Cambridge/Oxford.

## 4. Test design (TDD, mở rộng `lesson-content.test.ts`)

Mở rộng file SP3a đã có. Thêm 12 nhóm CD2 vào test array + assertion (scale 10/6/4):

```ts
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

Test catalog (24 test cũ) + test SP3a (7 nhóm CD1) vẫn pass — không regression.

## 5. Seed flow (không sửa seed — content-driven)

1. Thêm 12 block content vào `lesson-content.ts`: `WORDS_T2_G0N_*` (WordItemData[]), `MINIMAL_PAIRS_T2_G0N` (MinimalPairData[]), `SENTENCES_T2_G0N` (SentenceItemData[]) — theo template CD1 (vd `WORDS_T1_G01_I_IH`).
2. Thêm 12 entry vào `LESSON_CONTENT_BY_SOUND_GROUP` (line ~1032-1093) với key `map-t2-g0N-*` value `{ words: WORDS_T2_G0N_*, minimalPairs: MINIMAL_PAIRS_T2_G0N, sentences: SENTENCES_T2_G0N }`.
3. Re-seed: `npx tsx prisma/db_cleanup.ts` → `npm run db:seed:lessons` (`seed_lessons.ts`). Seed tự:
   - `seedLessonContent` (line 411): iterate map keys → seed WordItem (upsert theo `word_ipa_phonemeId`), MinimalPair (upsert theo `soundGroupId_wordAId_wordBId`), SentenceItem.
   - `seedQuestionBankItems` (line 443): sinh QuestionBankItem per (mode, item) — `lc` (listen_choose, ACTIVE words only), `sw` (speak_word), `smp` (speak_minimal_pair), `ss` (speak_sentence).
   - `generateExercises` (line 690) + `generateQuestions` (line 770): flip CD2 DRAFT→ACTIVE (hasContent check), sinh Question + AnswerOption. listen_choose CD2 dùng 3-stage generator `listen-choose-builder.ts` (line 786-889).
4. Chạy `npx tsx prisma/seed_audio_local.ts` (idempotent): rút mp3 local cho từ FREE_API CD2 mới → `/audio/{word}.mp3`, update DB audioUrl local. Skip file đã có.
5. Verify DB: CD2 có 12 nhóm ACTIVE (trừ g08-h speak_minimal_pair DRAFT), ~120 từ active (có audio local), ~66 cặp, ~48 câu, QuestionBankItem + Question cho 12 nhóm. `audioUrl` tất cả = `/audio/...` (local).

## 6. Scope, edge cases, testing

**Scope SP3b:**
- 12 nhóm CD2 content (10 từ/6 cặp/4 câu, trừ g08-h 0 cặp) + re-seed + audio local + test TDD.

**Defer (ra khỏi SP3b):**
- CĐ3 (2 nhóm còn lại g02, g04) → SP3c.
- CĐ4 (4 nhóm Trọng âm & Nối âm) → SP3d (cần UI SP4 + Mode B `acceptedAnswers` trước).
- UI mới CĐ4, Mode B multi-answer, scoring multiplier/retake → SP4.
- Unlock runtime gating → SP6.
- Seed mp3 câu (TTS cloud) → tùy chọn sau (MVP dùng Web Speech API).

**Edge cases:**
- g08-h /h/ 0 cặp → speak_minimal_pair DRAFT, 3 mode khác ACTIVE (giống g06 SP3a).
- Từ CD2 API fail audio → NEEDS_REVIEW, không đưa listen_choose, log fail.
- g10-nasals 3 phoneme → cặp tập trung /n/ vs /ŋ/, /m/ ít contrast.
- listen_choose 3-stage g08-h (1 phoneme) + g10 (3 phoneme) cần neighbor → CD2 orderIndex 1-12 chain cung cấp tự nhiên.

**Testing:**
- TDD content: mở rộng `lesson-content.test.ts` (4 test mới, section 4). Chạy trước (fail) → implement content → pass.
- Không test script audio (side-effect fs + network — verify thủ công bằng log + kiểm `public/audio/` có file CD2).

**Quality gate:** `npx prisma validate` + `npx tsc --noEmit` + `npm test` + `npm run build` pass.

## 7. File sẽ tạo/sửa

| Hành động | File |
|---|---|
| sửa | `frontend/prisma/lesson-content.ts` (thêm 12 nhóm CD2 content: WORDS/MINIMAL_PAIRS/SENTENCES + 12 entry map) |
| sửa | `frontend/src/lib/__tests__/lesson-content.test.ts` (thêm 12 nhóm CD2 vào test array + 4 test mới) |
| chạy (không sửa) | `frontend/prisma/seed_lessons.ts` (content-driven, tự lo) |
| chạy (không sửa) | `frontend/prisma/seed_audio_local.ts` (rút mp3 local, idempotent) |

**KHÔNG sửa:** `lesson-catalog.ts` (12 nhóm CD2 đã có), `seed_subcategory.ts` (subcategory đã ghi), `seed_lessons.ts` (content-driven), engine (CD2 dùng 4 mode chuẩn đã có UI), schema (không thêm trường).

## 8. Thay đổi behavior?

- App chạy offline cho audio từ CD2 (mp3 local) → tốt hơn bảo vệ (giống CD1).
- 12 nhóm CD2: DRAFT → ACTIVE (có audio) / NEEDS_REVIEW (thiếu audio).
- speak_minimal_pair g08-h DRAFT (0 cặp) — không ảnh hưởng demo (3 mode khác ACTIVE).
- XP/streak/badge/leaderboard/check-in KHÔNG đụng.
- Engine KHÔNG đụng (CD2 dùng 4 mode chuẩn đã có UI: listen_choose/speak_word/speak_minimal_pair/speak_sentence).

## 9. Rủi ro & giải pháp

| Rủi ro | Giải pháp |
|---|---|
| API fail nhiều từ CD2 → ít audio | Giữ NEEDS_REVIEW, log từ fail, không đưa listen_choose. Bổ sung audio manual sau nếu cần. |
| IPA sai (cmudict verify phát hiện) | Sửa IPA trong content trước seed, ghi reviewNote. |
| Content 12 nhóm cẩu thả | Test TDD bắt (word thiếu targetPhonemes, ipa không /, soundGroupId sai) + user review spec trước. |
| g08-h 0 cặp → speak_minimal_pair rỗng | Exercise DRAFT; 3 mode khác ACTIVE (giống g06 SP3a). |
| 1 commit lớn 12 nhóm | Test + user review spec trước → giảm rủi ro. Revert 1 commit nếu cần. |
| listen_choose 3-stage g08-h/g10 cần neighbor phoneme | CD2 orderIndex 1-12 chain cung cấp neighbor tự nhiên (seed_lessons.ts:804-816). |
| Khối lượng biên soạn lớn (~120 từ + 66 cặp + 48 câu) | 1 đợt trọn (approach A), TDD từng nhóm, verify cmudict trước seed. |
