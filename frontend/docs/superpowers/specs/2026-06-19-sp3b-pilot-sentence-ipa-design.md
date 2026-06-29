# SP3b-followup: Pilot Sentence IPA (4 câu map-t1-g01-i-ih)

**Ngày:** 2026-06-19
**Loại:** Design spec (pilot feature)
**Scope:** Thêm field `ipa?: string` cho sentence + biên soạn IPA 4 câu pilot (nhóm `/iː/` & `/ɪ/`) + propagate qua seed + UI `SpeakSentenceQuestion` hiện IPA trên câu ẩn.
**Phụ thuộc:** SP3b (content CD2), fix trùng speak_word/speak_sentence (commit `e823e62`).

## 1. Bối cảnh & Vấn đề

Phần thực chiến (speak_sentence) hiện **không hiện IPA câu**. User muốn IPA câu hiện ở trên đầu các chữ đang ẩn (đối chiếu phát âm khi đọc).

**Phát hiện từ điều tra:**
- `SentenceItemData` (`lesson-content.ts:44-55`) — **không có field `ipa`**.
- `SpeakSentenceQuestion.tsx:49` gọi `parseWordPrompt` nhưng `contentData` **không dùng** — không render IPA. `WordPrompt` type + parser **đã hỗ trợ `ipa`** sẵn.
- Seed pipeline drop IPA ở 2 chỗ: bank contentJson (`seed_lessons.ts:598`) không có `ipa`, question contentJson (`seed_lessons.ts:1045`) cũng không propagate.
- **Không cần schema migration** — seed đọc từ in-memory `content.sentences`, không từ DB column.

**Pilot scope:** 4 câu nhóm `map-t1-g01-i-ih` (/iː/ & /ɪ/). Review quality IPA + UI trước khi scale lên 83 câu (task sau).

## 2. Nguồn IPA + bản quyền

- **CMU Pronouncing Dictionary** (open data) — verify IPA word-level.
- **Free Dictionary API** (Wiktionary CC-BY-SA) — IPA + audio.
- **Tự biên soạn GA** cho sentence-level (weak form + linking + stress) — **không copy** từ Ship or Sheep / English Pronunciation in Use (sách chỉ tham khảo phương pháp, policy bản quyền đã ghi trong DATA_SEED_PLAN).
- **Chuẩn:** American GA (General American) — người dùng giọng Mỹ, rhotic (/r/ đọc rõ), không length mark (/i/ không /iː/).
- **Format:** 1 cặp `/ /` ngoài cho cả câu, từ cách nhau khoảng trắng, giữ dấu stress `ˈ`. Ví dụ: `/ðə ˈʃip ər ɑn ðə ˈʃɪp/`.

## 3. Thiết kế — Data layer

### `lesson-content.ts:44-55` — thêm `ipa?: string` (optional)
```ts
export type SentenceItemData = {
  sentence: string;
  soundGroupId: string;
  targetWords: string[];
  targetPhonemes: string[];
  difficulty: number;
  ipa?: string;           // MỚI: phiên âm RP câu (pilot, optional)
  audioUrl?: string;
  translation?: string;
  status: "ACTIVE" | "DRAFT" | "NEEDS_REVIEW";
  sourceType: "MANUAL" | "FREE_API" | "LICENSED";
  reviewNote?: string;
};
```

Optional vì pilot — 79 câu còn lại chưa có IPA (defer). Consistent với `WordItemData.ipa` pattern.

### Pilot data — 4 câu `SENTENCES_T1_G01` (map-t1-g01-i-ih)

| # | Câu | IPA (GA) | Pedagogy note |
|---|---|---|---|
| 1 | "The sheep are on the ship." | /ðə ˈʃip ər ɑn ðə ˈʃɪp/ | "are" weak /ər/ rhotic; "the" /ðə/; stress sheep+ship |
| 2 | "I feel sick when I sit here." | /aɪ ˈfil sɪk wɛn aɪ sɪt hɪr/ | "I" /aɪ/ strong (đầu câu); "here" /hɪr/ rhotic |
| 3 | "Please take your seat and sit down." | /pliz ˈteɪk jər sit ən sɪt ˈdaʊn/ | "your" weak /jər/ rhotic; "and" weak /ən/; stress seat+down |
| 4 | "The heat will hit us soon." | /ðə hit wɪl hɪt əs ˈsun/ | "will" weak /wɪl/; "us" /əs/; stress heat+soon |

Target phonemes /i/ vs /ɪ/ nổi bật (sheep/ship, feel/sick, seat/sit, heat/hit). GA: không length mark, rhotic /r/.

## 4. Thiết kế — Seed propagate (2 chỗ)

### `seed_lessons.ts:598-604` (bank contentJson)
```ts
const contentJson = {
  mode: "speak_sentence",
  sentence: sent.sentence,
  ipa: sent.ipa ?? undefined,          // MỚI
  targetWords: sent.targetWords,
  targetPhonemes: sent.targetPhonemes,
  hint: sent.translation ?? undefined,
};
```

### `seed_lessons.ts:1045-1050` (question contentJson — khoảng trống quan trọng)
```ts
const contentJson = JSON.stringify({
  mode: "speak_sentence",
  word: sentence,
  ipa: bankContent.ipa ?? undefined,   // MỚI (propagate từ bank)
  audioUrl: bankContent.audioUrl ?? undefined,
  hint: bankContent.hint ?? undefined,
});
```

## 5. Thiết kế — UI SpeakSentenceQuestion

### `SpeakSentenceQuestion.tsx:105-106` — render `contentData.ipa` trên câu ẩn

`contentData` đã parse (line 49, `parseWordPrompt` hỗ trợ `ipa` sẵn). Chèn giữa `<div className="mb-6 text-center">` và `<p>` câu:

```tsx
<div className="mb-6 text-center">
  {contentData.ipa && (
    <p className="mb-3 font-ipa text-2xl font-bold text-accent-600">
      {contentData.ipa}
    </p>
  )}
  <p className="text-xl font-bold leading-relaxed text-neutral-900">
    {showSentence ? question.answer : maskedSentence}
  </p>
  {/* toggle button giữ nguyên */}
</div>
```

IPA hiện **luôn** (không ẩn theo toggle — user đối chiếu với câu ẩn/hiện). Màu `accent` (giống badge Thực chiến).

## 6. Test Design

### `lesson-content.test.ts` — thêm test pilot (TDD)
```ts
test("pilot nhóm map-t1-g01-i-ih: mỗi sentence có ipa RP (bắt đầu /)", () => {
  const content = getContentBySoundGroup("map-t1-g01-i-ih");
  for (const sent of content.sentences) {
    assert.ok(sent.ipa, `sentence "${sent.sentence}" thiếu ipa`);
    assert.ok(sent.ipa.startsWith("/"), `ipa "${sent.ipa}" phải bắt đầu bằng /`);
  }
});
```

### Verify DB sau re-seed
- speak_sentence questions nhóm pilot có `ipa` trong `question.content` JSON.
- Các nhóm khác (79 câu) → `ipa` undefined (pilot only, không break).

### Quality gate
- tsc 0 errors, build success, 62+ test pass.

### Smoke test (bạn làm)
- Vào bài thực chiến nhóm `map-t1-g01-i-ih` → IPA hiện trên câu ẩn.
- Bài thực chiến nhóm khác → không IPA (deferred, không crash).

## 7. Files

| File | Thay đổi |
|---|---|
| `frontend/prisma/lesson-content.ts` | Sửa: thêm `ipa?: string` vào `SentenceItemData` + thêm `ipa` vào 4 câu `SENTENCES_T1_G01`. |
| `frontend/prisma/seed_lessons.ts` | Sửa: 2 chỗ propagate `ipa` (bank + question contentJson). |
| `frontend/src/app/exercises/[id]/SpeakSentenceQuestion.tsx` | Sửa: render `contentData.ipa` trên câu ẩn. |
| `frontend/src/data/lesson-content.test.ts` | Sửa: thêm test pilot ipa. |

**Không sửa:** `schema.prisma` (không migration), `ListenFeedbackSheet`, 3 component speak khác.

## 8. Rủi ro

1. **IPA sai** — weak form/stress có thể không chính xác. Mitigate: pilot 4 câu, user review trước scale. Ghi nguồn verify (cmudict + Free Dictionary API).
2. **79 câu chưa có IPA** — UI guard `{contentData.ipa && ...}` → không break. Defer task sau.
3. **Re-seed lại xóa User** — db_cleanup TRUNCATE. User đăng ký lại (như task trước).

## 9. Defer (ngoài scope)

- 79 câu IPA còn lại (task sau pilot review).
- Schema migration (không cần — in-memory source).
- IPA American GA (chỉ RP pilot).
- Per-phoneme coloring (SP3 defer C).

## 10. Self-review (pre-commit)

- [ ] Không placeholder/TBD.
- [ ] Không contradiction (Section 3 nói optional ipa, Section 8 nhất quán — 79 câu undefined OK).
- [ ] Scope focused (4 câu pilot, không scale 83).
- [ ] Không ambiguity (field name `ipa`, line reference cụ thể, RP rõ).
- [ ] Spec coverage: 1 bối cảnh → 2 nguồn → 3 data → 4 seed → 5 UI → 6 test → 7 files → 8 rủi ro → 9 defer.
