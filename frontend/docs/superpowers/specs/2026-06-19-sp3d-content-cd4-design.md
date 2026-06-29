# SP3d — Content + seed CĐ4 (4 nhóm Trọng âm & Nối âm) Design

Ngày: 2026-06-19
Trạng thái: design đã được user duyệt qua 3 section (cấu trúc content / type+seed / test+rủi ro), hướng A (mở rộng type hiện có + `contentJson` linh hoạt, không migration). Spec này gộp 3 section + bổ sung 3 phát hiện verify schema/seed (xem mục 1.1).
Scope: master **SP3** (content authoring) — đợt 4. SP3a đã làm CĐ1 (10 nhóm) + audio local. SP3b đã làm CĐ2 (12 nhóm Phụ âm). **SP3d = CĐ4 (4 nhóm Trọng âm & Nối âm)**. CĐ3 (2 nhóm còn lại) defer sang SP3c (không chặn CĐ4 vì CĐ4 dùng mode riêng, không phụ thuộc content CĐ3).

Lưu ý tên: "SP3d" = content CĐ4 (master roadmap SP3 đợt 4). KHÁC "SP3 defer" (WPM/phoneme route — pause brainstorm, xem `CURRENT_PROJECT_CONTEXT.md` mục 11).

## Mục tiêu

Biên soạn content thí điểm cho 4 nhóm CĐ4 (Word Stress / Weak Forms / Linking / Assimilation & Elision), quy mô 8 item/nhóm = 32 item tổng, re-seed để flip DRAFT→ACTIVE + sinh Question cho 2 mode đặc thù (Mode A nghe/chọn + Mode B đọc/so khớp `acceptedAnswers`). Hoàn thiện 30/30 nhóm có content (CĐ1 + CĐ2 + CĐ3 legacy + CĐ4). **Lưu ý: SP3d chỉ làm content + seed (DB-level). UI render 4 dạng CĐ4 = SP4 (defer).** Bài CĐ4 render đúng dữ liệu nhưng UI SP4 chưa xong → chưa playtest được trải nghiệm đầy đủ; verify ở mức DB + test TDD.

## 1. Hiện trạng (nền tảng, không xây từ đáy — verify 19/06)

- **Catalog v2 đã có 4 nhóm CĐ4** (`lesson-catalog.ts:203-208`): `map-t4-g01-word-stress` (targetPhonemes `[]`), `map-t4-g02-weak-forms` (`["/ə/"]`), `map-t4-g03-linking` (`[]`), `map-t4-g04-assimilation` (`[]`). Đã được `seed_lessons.ts:seedSoundGroups` ghi lên `SoundGroup`/`LearningMap` rows (status DRAFT).
- **6 ExerciseMode đã có** (`lesson-catalog.ts:104-159`): 4 mode chuẩn (CĐ1-3) + 2 mode CĐ4: `mode_a_listen_choose` (questionTypeId **placeholder** `qtype-2-voice` — `lesson-catalog.ts:145`, ghi chú "mỗi nhóm CĐ4 override questionTypeId cụ thể khi seed") + `mode_b_speak_match` (`qtype-2-voice`).
- **4 QuestionType CĐ4 đã seed** (`seed_lessons.ts:128-147`): `qtype-4-tap-stress`, `qtype-5-choose-weak`, `qtype-6-choose-linking`, `qtype-7-choose-assimilation`. **Không cần thêm QuestionType.**
- **Schema đã có field CĐ4 sẵn — KHÔNG migration** (verify `schema.prisma`):
  - `WordItem.syllables Json?` (`:282`), `WordItem.stressIndex Int?` (`:283`), `WordItem.wordStressType String?` (`:284`, giá trị `WORD_STRESS | WEAK_FORM | LINKING | ASSIMILATION`, null = từ IPA thường CĐ1-3).
  - `Question.acceptedAnswers Json?` (`:190`, "mảng đáp án chấp nhận cho Mode B CĐ4, null = dùng `answer` đơn trị").
  - `QuestionBankItem.acceptedAnswers Json?` (`:359`), `QuestionBankItem.contentJson Json` (`:357`).
  - `SentenceItem` KHÔNG có phoneme relation (`:332-352`) → sentence-based group (g02/3/4) không dính ràng buộc phoneme.
- **Pattern content rõ** (từ CD1/CD2): `LESSON_CONTENT_BY_SOUND_GROUP` (`lesson-content.ts:1428`) — thêm 4 key `map-t4-g*` → `seedLessonContent` (`seed_lessons.ts:404`) tự seed WordItem/SentenceItem. Type `WordItemData` (`lesson-content.ts:14-26`), `SentenceItemData` (`:44-56`).
- **Audio**: từ = Free Dictionary API → local mp3 qua `seed_audio_local.ts` (idempotent). Câu = Web Speech API runtime (như SP3a/SP3b, không rút local câu).

### 1.1. Ba phát hiện verify (bổ sung so với 3 section gốc — QUAN TRỌNG)

Quá trình verify schema + seed phát hiện 3 điểm mà 3 section design gốc chưa nêu đầy đủ, spec này chốt cách xử lý:

**Phát hiện 1 — WordItem.phonemeId BẮT BUỘC (chỉ ảnh hưởng g01 Word Stress):**
`WordItem.phonemeId String` không null (`schema.prisma:293`, `onDelete: Restrict`, `@@unique([word,ipa,phonemeId])` `:300`). `seedWordItems` (`seed_lessons.ts:274`) đọc `word.targetPhonemes[0]` → `phoneme.findUnique({symbol})` → nếu không có phoneme match thì **bỏ qua từ** (warn + continue, `:279-282`). Word Stress group (g01) dùng **WordItems** (UI tap-stress render `syllables`), nên mỗi từ word-stress **phải có `targetPhonemes[0]` là một symbol tồn tại trong `PHONEMES`** (`lesson-catalog.ts:214-262`). g02/3/4 dùng **SentenceItems** (không phonemeId) → không dính.
→ **Quy tắc authoring g01**: `targetPhonemes` = **nguyên âm của âm tiết nhấn**, dùng symbol trong `PHONEMES`. `WordItemData.targetPhonemes` là `string[]` bắt buộc (`lesson-content.ts:18`) nên không được để rỗng cho g01. (Xem mục 2.1 + 8 edge case.)

**Phát hiện 2 — CĐ4 KHÔNG content-driven như CD1/CD2, cần sửa seed:**
`seedQuestionBankItems` (`seed_lessons.ts:436`) chỉ build bank item cho 4 mode chuẩn (`lc`/`sw`/`smp`/`ss`) — **không tạo bank item mode `mode_a_listen_choose`/`mode_b_speak_match`**. Hơn nữa `hasContent = Boolean(content && content.words.length > 0)` (`:662`, `:694`, `:780`) → g02/3/4 (chỉ có sentences, words rỗng) bị **DRAFT** + `generateQuestions` `continue` sớm (`:780`). Nên nếu chỉ thêm content key thì bài CĐ4 vẫn DRAFT/rỗng.
→ **Giải pháp**: sinh Question CĐ4 **trực tiếp từ content** trong `generateQuestions` (bypass QuestionBankItem — đúng precedent nhánh listen_choose 3-stage `seed_lessons.ts:789-889` vốn build Question trực tiếp từ content, không qua bank) + nới lỏng 3 check `hasContent` (xem mục 3). Vậy **SP3d SỬA `seed_lessons.ts`** (khác CD2 "không sửa seed").

**Phát hiện 3 — cặp noun/verb cùng chính tả (record n/v) có audio mơ hồ:**
Mode A tap-stress dùng audio để user nghe rồi bấm âm tiết. Cùng chính tả "record" (danh/từ) có 2 phát âm nhưng Free Dictionary API có thể chỉ trả 1 audio → user không phân biệt được 2 dạng qua tai. 
→ **Quy tắc authoring g01**: Mode A dùng **từ chính tả riêng biệt, ≥2 âm tiết, stress rõ** (balloon, guitar, hotel, tomorrow, banana, computer, umbrella, dictionary…). Cặp noun/verb stress-shift (record/present/object) chỉ dùng cho **Mode B** (đọc từ, không phụ thuộc audio phân biệt) hoặc bỏ khỏi pilot. (Xem mục 2.1.)

## 2. 4 nhóm CĐ4 — data shape + content outline (quy mô 8 item/nhóm, GA)

Quy ước IPA: **GA (American rhotic), không length mark** — theo commit `17a70bf` (pilot sentence IPA đã chuyển GA). `WordItem.ipa` / `SentenceItemData.ipa` dùng GA không length mark (vd `/foʊtəɡræf/`, `/tɜrn/`). `targetPhonemes` dùng symbol trong `PHONEMES` (có length mark cho nguyên âm dài: `/ɑː/`, `/ɔː/`, `/uː/`, `/ɜː/`; `/əʊ/` cho nguyên âm GO) — 2 field độc lập, giống codebase hiện tại (T2 "rope" `/roʊp/` ipa GA nhưng `targetPhonemes ["/p/"]`).

### 2.1. Nhóm 1: Word Stress (`map-t4-g01-word-stress`) — Mode A: tap-stress / Mode B: đọc từ

**Bản chất**: Mode A — user nghe từ → bấm âm tiết nhấn (tap-stress). Mode B — đọc từ đúng trọng âm (`acceptedAnswers` đơn trị). Cần: từ ≥2 âm tiết + `syllables[]` + `stressIndex` (0-based, đáp án Mode A).

**Data shape** — mở rộng `WordItemData` thêm 3 field optional (`lesson-content.ts:14-26`):

```ts
export type WordItemData = {
  // ...existing: word, ipa, soundGroupId, targetPhonemes, difficulty, audioUrl?,
  //   exampleSentence?, status, sourceType, sourceUrl?, reviewNote?
  syllables?: string[];        // MỚI: âm tiết (UI tap-stress render từng khối)
  stressIndex?: number;        // MỚI: index âm tiết nhấn (0-based, đáp án Mode A)
  wordStressType?: "WORD_STRESS" | "WEAK_FORM" | "LINKING" | "ASSIMILATION";  // MỚI: flag nhóm
};
```

Match schema `WordItem.syllables Json? / stressIndex Int? / wordStressType String?` (đã có cột).

**ContentJson Mode A** (`qtype-4-tap-stress`):

```json
{ "mode": "mode_a_listen_choose", "qtype": "tap-stress", "word": "photograph", "ipa": "/ˈfoʊtəɡræf/", "syllables": ["pho","to","graph"], "stressIndex": 0, "audioUrl": "/audio/photograph.mp3" }
```

**ContentJson Mode B** (`qtype-2-voice` — đọc từ, `acceptedAnswers` đơn trị):

```json
{ "mode": "mode_b_speak_match", "word": "photograph", "ipa": "/ˈfoʊtəɡræf/", "syllables": ["pho","to","graph"], "stressIndex": 0, "audioUrl": "/audio/photograph.mp3" }
```

**8 từ pilot** (chính tả riêng biệt, ≥2 âm tiết, stress rõ, có audio Free Dictionary; `targetPhonemes` = nguyên âm âm tiết nhấn — symbol `PHONEMES`):

| # | word | ipa (GA) | syllables | stressIndex | targetPhonemes | audio |
|---|---|---|---|---:|---|---|
| 1 | photograph | `/ˈfoʊtəɡræf/` | `["pho","to","graph"]` | 0 | `["/əʊ/"]` | Free API |
| 2 | photographer | `/fəˈtɑɡrəfər/` | `["pho","tog","ra","pher"]` | 1 | `["/ɑː/"]` | Free API |
| 3 | balloon | `/bəˈlun/` | `["ba","lloon"]` | 1 | `["/uː/"]` | Free API |
| 4 | guitar | `/ɡɪˈtɑr/` | `["gui","tar"]` | 1 | `["/ɑː/"]` | Free API |
| 5 | hotel | `/hoʊˈtɛl/` | `["ho","tel"]` | 1 | `["/e/"]` | Free API |
| 6 | tomorrow | `/təˈmɔroʊ/` | `["to","mor","row"]` | 1 | `["/ɔː/"]` | Free API |
| 7 | banana | `/bəˈnænə/` | `["ba","na","na"]` | 1 | `["/æ/"]` | Free API |
| 8 | computer | `/kəmˈpjutər/` | `["com","pu","ter"]` | 1 | `["/uː/"]` | Free API |

Tất cả `wordStressType: "WORD_STRESS"`, `soundGroupId: "map-t4-g01-word-stress"`, `sourceType: "FREE_API"`, `status: "ACTIVE"` (sau khi có audio). `syllables` split theo phát âm (không phải chính tả cứng — vd "photographer" 4 âm tiết `/fəˈtɑ-ɡrə-fər/` nhưng render thân thiện `pho-tog-ra-pher`). **Cặp photograph/photographer** = cặp stress-shift kinh điển (dạy độ mạnh thay đổi nghĩa) — 2 chính tả khác nhau → audio phân biệt được. Cặp noun/verb cùng chính tả (record/present) **không** đưa vào pilot Mode A (audio mơ hồ — phát hiện 3).

### 2.2. Nhóm 2: Weak Forms (`map-t4-g02-weak-forms`) — Mode A: choose-weak / Mode B: đọc câu

**Bản chất**: Mode A — user nghe câu → chọn từ lướt (weak form `/ə/`). Mode B — đọc câu, `acceptedAnswers` nhiều dạng (strong/weak contraction).

**Data shape** — `SentenceItemData` (đã có `ipa?` pilot GA) + encode weak form trong `contentJson` (không thêm field type):

```ts
// SentenceItemData hiện tại (lesson-content.ts:44-56) — KHÔNG thêm field.
// sentence/soundGroupId/targetWords/targetPhonemes/difficulty/ipa?/audioUrl?/translation?/status/sourceType/reviewNote?
{ sentence: "I'm going to the shop.", soundGroupId: "map-t4-g02-weak-forms", targetWords: ["going","to","the"], targetPhonemes: ["/ə/"], difficulty: 5, ipa: "/aɪm ˈɡoʊɪŋ tə ðə ˈʃɑp/", status: "ACTIVE", sourceType: "MANUAL" }
```

**ContentJson Mode A** (`qtype-5-choose-weak`) — encode danh sách từ weak + đáp án:

```json
{ "mode": "mode_a_listen_choose", "qtype": "choose-weak", "sentence": "I'm going to the shop.", "ipa": "/aɪm ˈɡoʊɪŋ tə ðə ˈʃɑp/", "weakWords": ["to","the"], "audioUrl": null }
```

User nghe (Web Speech) → chọn "to"/"the" (weak `/tə/`, `/ðə/`). `weakWords` = mảng các từ bị lướt trong câu (đáp án đúng). AnswerOption = tất cả từ câu, user chọn subset weak.

**ContentJson Mode B** (`qtype-2-voice`) — đọc câu, `acceptedAnswers` multi:

```json
{ "mode": "mode_b_speak_match", "sentence": "I'm going to the shop.", "ipa": "/aɪm ˈɡoʊɪŋ tə ðə ˈʃɑp/", "acceptedAnswers": ["I'm going to the shop", "I am going to the shop"] }
```

`acceptedAnswers` chứa dạng contraction ("I'm") + dạng đầy đủ ("I am") → Mode B accept cả 2 (giá trị multi-answer cốt lõi của CĐ4).

**8 câu pilot** (chứa weak form phổ biến to/the/a/of/and/is/are/at/for — MANUAL author, câu ngắn 4-8 từ):

| # | sentence | weakWords | targetPhonemes |
|---|---|---|---|
| 1 | I'm going to the shop. | `["to","the"]` | `["/ə/"]` |
| 2 | What do you want? | `["do"]` | `["/ə/"]` |
| 3 | Can I have a coffee? | `["a"]` | `["/ə/"]` |
| 4 | She's at the bus stop. | `["at","the"]` | `["/ə/"]` |
| 5 | A cup of tea, please. | `["a","of"]` | `["/ə/"]` |
| 6 | It's for you and me. | `["for","and"]` | `["/ə/"]` |
| 7 | There is a book on the table. | `["is","a","the"]` | `["/ə/"]` |
| 8 | What are you doing? | `["are"]` | `["/ə/"]` |

Tất cả `soundGroupId: "map-t4-g02-weak-forms"`, `sourceType: "MANUAL"`, `status: "ACTIVE"`, có `ipa` GA. `acceptedAnswers` Mode B = 1-2 dạng (contraction + đầy đủ) — author từng câu.

### 2.3. Nhóm 3: Linking (`map-t4-g03-linking`) — Mode A: choose-linking / Mode B: đọc câu

**Bản chất**: Mode A — user nghe câu → chọn cặp từ nối âm (consonant-vowel linking boundary). Mode B — đọc câu.

**Data shape** — `SentenceItemData` + encode linking trong `contentJson`:

```ts
{ sentence: "Turn off the light.", soundGroupId: "map-t4-g03-linking", targetWords: ["Turn","off"], targetPhonemes: [], difficulty: 5, ipa: "/ˈtɜrn ˈɔf ðə ˈlaɪt/", status: "ACTIVE", sourceType: "MANUAL" }
```

**ContentJson Mode A** (`qtype-6-choose-linking`) — encode linking pairs:

```json
{ "mode": "mode_a_listen_choose", "qtype": "choose-linking", "sentence": "Turn off the light.", "ipa": "/ˈtɜrn ˈɔf ðə ˈlaɪt/", "linkingPairs": [["Turn","off"]], "audioUrl": null }
```

"Turn off" → consonant `/n/` nối vowel `/ɔ/` → `/tɜrnˈɔf/`. `linkingPairs` = mảng cặp `[wordA, wordB]` có nối âm (đáp án đúng). AnswerOption = các cặp từ kế tiếp trong câu, user chọn cặp có linking.

**ContentJson Mode B** (`qtype-2-voice`) — đọc câu, `acceptedAnswers` đơn trị:

```json
{ "mode": "mode_b_speak_match", "sentence": "Turn off the light.", "ipa": "/ˈtɜrn ˈɔf ðə ˈlaɪt/" }
```

(`acceptedAnswers` null → dùng `answer` = sentence, đơn trị. Linking Mode B không có multi-answer ngữ nghĩa — chỉ đọc câu.)

**8 câu pilot** (consonant-vowel linking — MANUAL, câu ngắn):

| # | sentence | linkingPairs |
|---|---|---|
| 1 | Turn off the light. | `[["Turn","off"]]` |
| 2 | Pick it up. | `[["Pick","it"],["it","up"]]` |
| 3 | Look at this. | `[["Look","at"]]` |
| 4 | Stop it now. | `[["Stop","it"]]` |
| 5 | Come in and sit down. | `[["Come","in"],["in","and"]]` |
| 6 | Hold on a second. | `[["Hold","on"]]` |
| 7 | Take an apple. | `[["Take","an"],["an","apple"]]` |
| 8 | Wash up before dinner. | `[["Wash","up"]]` |

Tất cả `soundGroupId: "map-t4-g03-linking"`, `sourceType: "MANUAL"`, `status: "ACTIVE"`, có `ipa` GA. `targetPhonemes: []` (catalog đã set).

### 2.4. Nhóm 4: Assimilation & Elision (`map-t4-g04-assimilation`) — Mode A: choose-assimilation / Mode B: đọc câu

**Bản chất**: Mode A — user nghe câu tự nhiên → chọn câu biến âm (assimilation `/t/+/j/→/tʃ/`, `/d/+/j/→/dʒ/`; elision drop sound). Mode B — đọc câu.

**Data shape** — `SentenceItemData` + encode assimilation trong `contentJson`:

```ts
{ sentence: "Did you see it?", soundGroupId: "map-t4-g04-assimilation", targetWords: ["Did","you"], targetPhonemes: [], difficulty: 6, ipa: "/dɪdʒu si ɪt/", status: "ACTIVE", sourceType: "MANUAL" }
```

**ContentJson Mode A** (`qtype-7-choose-assimilation`) — encode assimilation result + options:

```json
{ "mode": "mode_a_listen_choose", "qtype": "choose-assimilation", "sentence": "Did you see it?", "ipa": "/dɪdʒu si ɪt/", "assimilationType": "dj→dʒ", "original": "did you", "result": "didʒu", "audioUrl": null }
```

`assimilationType` = mô tả biến âm (`"dj→dʒ"`, `"tj→tʃ"`, `"elision-t"`). `original` = cụm gốc, `result` = phát âm biến âm. AnswerOption = các variant phát âm (đáp án đúng = `result`), user chọn câu vừa nghe. (Chi tiết option set author ở plan phase — dạng câu hỏi "nghe câu tự nhiên → chọn phát âm đúng".)

**ContentJson Mode B** (`qtype-2-voice`) — đọc câu, đơn trị:

```json
{ "mode": "mode_b_speak_match", "sentence": "Did you see it?", "ipa": "/dɪdʒu si ɪt/" }
```

**8 câu pilot** (assimilation `/t/+/j/`, `/d/+/j/`; elision — MANUAL):

| # | sentence | ipa (GA) | assimilationType |
|---|---|---|---|
| 1 | Did you see it? | `/dɪdʒu si ɪt/` | `dj→dʒ` |
| 2 | Nice to meet you. | `/naɪs tə mitʃu/` | `tj→tʃ` |
| 3 | Would you like tea? | `/wʊdʒu laɪk ti/` | `dj→dʒ` |
| 4 | I got your back. | `/aɪ ɡɑtʃər bæk/` | `tj→tʃ` |
| 5 | Next day, we leave. | `/nɛks deɪ wi liv/` | `elision-t` |
| 6 | Just you and me. | `/dʒʌs tʃu ən mi/` | `tj→tʃ` |
| 7 | Hand your coat over. | `/hændʒər koʊt oʊvər/` | `dj→dʒ` |
| 8 | Last chance, go! | `/læs tʃæns ɡoʊ/` | `elision-t` + `tj→tʃ` |

Tất cả `soundGroupId: "map-t4-g04-assimilation"`, `sourceType: "MANUAL"`, `status: "ACTIVE"`, có `ipa` GA (phiên âm đã biến âm). `targetPhonemes: []`.

### 2.5. Tổng content thí điểm (32 item, 2 đợt)

| Đợt | Nhóm | Item | Loại |
|---|---|---:|---|
| 1 | g01 Word Stress (8 từ) + g02 Weak Forms (8 câu) | 16 | WordItem + SentenceItem |
| 2 | g03 Linking (8 câu) + g04 Assimilation (8 câu) | 16 | SentenceItem |

Structure data shape + seed branch chia sẻ → spec gộp cả 4 nhóm; **chia 2 đợt ở phase implementation (plan)** — mỗi đợt 1 plan + 1 commit, review giữa đợt.

## 3. Seed flow (SỬA seed_lessons.ts — khác CD1/CD2)

CD4 không content-driven thuần (phát hiện 2). 3 điểm sửa `seed_lessons.ts`:

**Sửa 1 — nới lỏng `hasContent`** (3 chỗ, an toàn — CD1/CD2/CD3 luôn có words nên không regression):
- `generateLearningMaps` `seed_lessons.ts:662`: `const hasContent = Boolean(content && content.words.length > 0);` → `Boolean(content && (content.words.length > 0 || content.sentences.length > 0));`
- `generateExercises` `:694`: cùng sửa.
- `generateQuestions` `:780`: `if (!content || content.words.length === 0) continue;` → `if (!content || (content.words.length === 0 && content.sentences.length === 0)) continue;`

→ g02/3/4 (sentences-only) flip DRAFT→ACTIVE.

**Sửa 2 — thêm 2 nhánh generateQuestions cho CĐ4** (sinh Question trực tiếp từ content, bypass QuestionBankItem — precedent nhánh listen_choose 3-stage `:789-889`). Chèn sau khối listen_choose 3-stage (sau `:890`) và trước nhánh bank (`:892`), mỗi nhánh `continue` để không rơi vào bank:

```ts
// === v2 CĐ4 Mode A (mode_a_listen_choose): sinh Question trực tiếp từ content ===
if (mode.id === "mode_a_listen_choose" && sg.topicId === "topic-4-stress-connected") {
  const cd4QtypeId = CD4_QTYPE_BY_GROUP[sg.id]; // map nhóm → qtype-4/5/6/7
  if (!cd4QtypeId) { await prisma.exercise.update({ where: { id: exerciseId }, data: { status: "DRAFT", questionCount: 0 } }); continue; }
  await prisma.question.deleteMany({ where: { exerciseId } }); // idempotent
  let qIdx = 1;
  // g01: iterate content.words; g02/3/4: iterate content.sentences
  // build contentJson theo nhóm (mục 2.1-2.4), Question.answer = stressIndex/weakWords/linkingPairs/result,
  // AnswerOption theo dạng (syllables / từ câu / cặp / variant), typeId = qtypeMap[cd4QtypeId].id
  // (vòng lặp build contentJson + AnswerOption theo shape mục 2.1-2.4; code đầy đủ ở plan phase)
  await prisma.exercise.update({ where: { id: exerciseId }, data: { questionCount: qIdx - 1, status: "ACTIVE" } });
  continue;
}

// === v2 CĐ4 Mode B (mode_b_speak_match): đọc câu/từ, acceptedAnswers multi ===
if (mode.id === "mode_b_speak_match" && sg.topicId === "topic-4-stress-connected") {
  await prisma.question.deleteMany({ where: { exerciseId } });
  let qIdx = 1;
  // g01: iterate content.words (đọc từ); g02/3/4: iterate content.sentences (đọc câu)
  // contentJson { mode, word|sentence, ipa, ... }, Question.answer = word|sentence,
  // Question.acceptedAnswers = acceptedAnswers (Json) hoặc null, typeId = qtypeMap["qtype-2-voice"].id
  // (vòng lặp build contentJson + AnswerOption theo shape mục 2.1-2.4; code đầy đủ ở plan phase)
  await prisma.exercise.update({ where: { id: exerciseId }, data: { questionCount: qIdx - 1, status: "ACTIVE" } });
  continue;
}
```

`CD4_QTYPE_BY_GROUP` (override catalog placeholder `lesson-catalog.ts:145`):

```ts
const CD4_QTYPE_BY_GROUP: Record<string, string> = {
  "map-t4-g01-word-stress": "qtype-4-tap-stress",
  "map-t4-g02-weak-forms": "qtype-5-choose-weak",
  "map-t4-g03-linking": "qtype-6-choose-linking",
  "map-t4-g04-assimilation": "qtype-7-choose-assimilation",
};
```

**Sửa 3 — `seedWordItems` truyền `syllables`/`stressIndex`/`wordStressType`** (`seed_lessons.ts:303-334`): thêm 3 field vào `update` + `create` của `wordItem.upsert` (lấy từ `word.syllables ?? null`…). Field đã có cột schema → không migration. (SentenceItem không cần sửa — `seedSentenceItems` `:377` đã đủ, weak/linking/assimilation encode trong `contentJson` câu hỏi, không lưu ở SentenceItem.)

**Không sửa**: `seedQuestionBankItems` (CĐ4 bypass bank), `lesson-catalog.ts` (4 nhóm + 6 mode + 4 qtype đã có), schema (field đã có), `listen-choose-builder.ts` (CĐ4 Mode A không dùng 3-stage phoneme ID).

**Re-seed pipeline**:
1. Thêm 4 block content vào `lesson-content.ts` (`WORDS_T4_G01_WORD_STRESS`, `SENTENCES_T4_G02_WEAK`, `SENTENCES_T4_G03_LINKING`, `SENTENCES_T4_G04_ASSIM`) + 4 entry `LESSON_CONTENT_BY_SOUND_GROUP` (g01 = `{words, minimalPairs: [], sentences: []}`; g02/3/4 = `{words: [], minimalPairs: [], sentences}`).
2. Sửa `seed_lessons.ts` (3 sửa trên).
3. Re-seed: `npx tsx prisma/db_cleanup.ts` → `npm run db:seed:lessons`.
4. `npx tsx prisma/seed_audio_local.ts` (idempotent) — rút mp3 local cho 8 từ g01 → `/audio/{word}.mp3`.
5. Verify DB: 4 nhóm CĐ4 ACTIVE, 8 từ g01 (có audio local + syllables/stressIndex/wordStressType), 24 câu g02/3/4, 8 exercise CĐ4 (4 nhóm × 2 mode) ACTIVE có Question + AnswerOption + acceptedAnswers (Mode B g02).

## 4. Test design (TDD, mở rộng `lesson-content.test.ts`)

Thêm 4 nhóm CĐ4 vào test file (pattern CD2, `node:test` + `node:assert/strict`):

```ts
// ===== SP3d: CĐ4 (4 nhóm Trọng âm & Nối âm) =====

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

test("Weak/Linking/Assimilation (g02/3/4): mỗi nhóm 8 câu, có ipa GA bắt đầu /", () => {
  for (const id of ["map-t4-g02-weak-forms", "map-t4-g03-linking", "map-t4-g04-assimilation"]) {
    const content = getContentBySoundGroup(id);
    assert.ok(content, `${id} phải có content`);
    assert.ok(content!.sentences.length >= 8, `${id} sentences >= 8 (hiện ${content!.sentences.length})`);
    for (const s of content!.sentences) {
      assert.ok(s.ipa, `${id} sentence "${s.sentence}" thiếu ipa`);
      assert.ok(s.ipa!.startsWith("/"), `${id} ipa "${s.ipa}" phải bắt đầu /`);
    }
  }
});

test("Weak Forms (g02): mỗi câu có targetPhonemes chứa /ə/", () => {
  const content = getContentBySoundGroup("map-t4-g02-weak-forms");
  for (const s of content!.sentences) {
    assert.ok(s.targetPhonemes.includes("/ə/"), `g02 sentence "${s.sentence}" thiếu /ə/`);
  }
});

test("tổng số nhóm có content >= 26 (10 CD1 + 2 legacy CD3 + 12 CD2 + 4 CD4 = 28)", () => {
  assert.ok(Object.keys(LESSON_CONTENT_BY_SOUND_GROUP).length >= 26, `Ít nhất 26 nhóm content (hiện ${Object.keys(LESSON_CONTENT_BY_SOUND_GROUP).length})`);
});
```

Test catalog (24 test cũ) + test CD1/CD2/pilot vẫn pass — không regression. Test CĐ4 verify content structure (DB-level); **không verify seed branch** (side-effect DB — verify thủ công bằng log + query sau re-seed, mục 5).

## 5. Scope, edge cases, testing

**Scope SP3d:**
- 4 nhóm CĐ4 content (8 từ g01 + 8 câu × 3 nhóm g02/3/4 = 32 item) + mở rộng type + sửa seed (3 điểm) + re-seed + audio local g01 + test TDD.

**Defer (ra khỏi SP3d):**
- **UI 4 dạng CĐ4** (tap-stress / choose-weak / choose-linking / choose-assimilation render) + Mode B `acceptedAnswers` consume + scoring multiplier/retake → **SP4** (master roadmap SP4). SP3d chỉ đảm bảo DB có Question đúng structure; UI render = SP4.
- CĐ3 (2 nhóm còn lại g02 initial-confuse, g04 dental-sibilant) → SP3c.
- Unlock CĐ4 runtime gating (80% CĐ3) → SP6.
- Scale 8→full (16+ item/nhóm) → sau pilot, nếu user ưng.

**Edge cases:**
- **g01 Word Stress phonemeId bắt buộc** (phát hiện 1): mỗi từ g01 phải có `targetPhonemes[0]` = symbol `PHONEMES` tồn tại. Từ có nguyên âm nhấn không khớp symbol `PHONEMES` (vd GO vowel `/oʊ/` không có, chỉ `/əʊ/`) → dùng symbol `PHONEMES` gần nhất (`/əʊ/`) + ghi `reviewNote`. Test bắt `targetPhonemes.length > 0`.
- **g01 Mode A audio mơ hồ cho cặp cùng chính tả** (phát hiện 3): không dùng record/present/object (n+v) cho Mode A. Dùng chính tả riêng biệt. Cặp stress-shift photograph/photographer OK (2 chính tả).
- **g01 `ipa` GA vs `targetPhonemes` symbol length-mark**: 2 field độc lập (vd ipa `/fəˈtɑɡrəfər/` không length mark, `targetPhonemes ["/ɑː/"]` có length mark). Giống codebase hiện tại. Test chỉ bắt `ipa.startsWith("/")`.
- **g02/3/4 sentences-only** → `hasContent` phải xét sentences (sửa 1) không thì DRAFT.
- **CĐ4 Mode A không dùng 3-stage phoneme ID** (listen_choose 3-stage skip CĐ4 `seed_lessons.ts:789` `sg.topicId !== "topic-4-stress-connected"`) → dùng nhánh riêng.
- **Audio câu CĐ4** = speechSynthesis runtime (`audioUrl: null` trong contentJson) — UI SP4 sẽ dùng Web Speech như speak_sentence hiện tại. Không rút local.
- **`acceptedAnswers` Mode B**: g02 weak-forms = multi (contraction + đầy đủ); g01/3/4 = đơn trị (null, dùng `answer`).

**Testing:**
- TDD content: mở rộng `lesson-content.test.ts` (5 test mới, mục 4). Chạy trước (fail) → implement content → pass.
- Seed branch: verify thủ công sau re-seed — query DB: 4 exercise CĐ4 ACTIVE có `questionCount > 0`, Question có `content` JSON đúng shape (mode/qtype/syllables/stressIndex hoặc weakWords/linkingPairs/assimilationType), Mode B Question có `acceptedAnswers` (g02) / null (g01/3/4). Log seed in ra `✓ {sg.id} mode_a/mode_b: N câu`.
- **Quality gate**: `npx prisma validate` + `npx tsc --noEmit` + `npm test` + `npm run build` — tất cả pass (`CURRENT_PROJECT_CONTEXT.md:152`).

## 6. File sẽ tạo/sửa

| Hành động | File | Chi tiết |
|---|---|---|
| sửa | `frontend/prisma/lesson-content.ts` | Thêm 3 field optional vào `WordItemData` (syllables/stressIndex/wordStressType); thêm 4 block content (`WORDS_T4_G01_WORD_STRESS`, `SENTENCES_T4_G02_WEAK/03_LINKING/04_ASSIM`) + 4 entry `LESSON_CONTENT_BY_SOUND_GROUP`. |
| sửa | `frontend/prisma/seed_lessons.ts` | Sửa 1: nới lỏng `hasContent` 3 chỗ (`:662`,`:694`,`:780`). Sửa 2: thêm `CD4_QTYPE_BY_GROUP` + 2 nhánh `generateQuestions` (mode_a/mode_b, bypass bank). Sửa 3: `seedWordItems` truyền `syllables`/`stressIndex`/`wordStressType` vào upsert. |
| sửa | `frontend/src/lib/__tests__/lesson-content.test.ts` | Thêm `CD4_GROUPS` + 5 test mới (mục 4). |
| chạy (không sửa) | `frontend/prisma/db_cleanup.ts` → `seed_lessons.ts` (`npm run db:seed:lessons`) | Re-seed idempotent. |
| chạy (không sửa) | `frontend/prisma/seed_audio_local.ts` | Rút mp3 local 8 từ g01, idempotent. |

**KHÔNG sửa**: `lesson-catalog.ts` (4 nhóm + 6 mode + 4 qtype đã có), `schema.prisma` (field CĐ4 đã có), `listen-choose-builder.ts` (CĐ4 không dùng 3-stage), engine/UI (SP4).

## 7. Thay đổi behavior?

- 4 nhóm CĐ4: DRAFT → ACTIVE (g01 sau khi có audio; g02/3/4 sentences-only nhờ sửa `hasContent`).
- 8 exercise CĐ4 (4 nhóm × 2 mode) từ rỗng → có Question + AnswerOption (+ `acceptedAnswers` Mode B g02).
- App offline cho audio từ g01 (mp3 local). Audio câu CĐ4 = Web Speech runtime (như hiện tại).
- XP/streak/badge/leaderboard/check-in KHÔNG đụng.
- Engine/UI KHÔNG đụng (CĐ4 render = SP4 — bài CĐ4 có Question nhưng UI SP4 chưa render dạng đặc thù → render fallback/generic, playtest đầy đủ = SP4).
- Catalog/QuestionType KHÔNG đụng (đã có).

## 8. Rủi ro & giải pháp

| Rủi ro | Giải pháp |
|---|---|
| **g01 từ không khớp symbol `PHONEMES`** → `seedWordItems` bỏ qua (warn) → ít từ g01 | Quy tắc authoring: `targetPhonemes` = nguyên âm nhấn, dùng symbol `PHONEMES` (`/əʊ/` cho GO vowel). Test bắt `targetPhonemes.length > 0`. Authoring checklist ở plan phase verify từng từ. |
| **g01 Mode A audio mơ hồ** (cặp cùng chính tả) → user không phân biệt qua tai | Chỉ dùng chính tả riêng biệt cho Mode A (phát hiện 3). Cặp noun/verb stress-shift bỏ hoặc chỉ Mode B. |
| **contentJson structure CĐ4 không typed cứng** (Json linh hoạt) → sai shape | Test TDD validate content (`lesson-content.test.ts`) + ghi rõ shape trong spec (mục 2) + verify thủ công DB sau seed. UI SP4 sẽ typed-render, bắt lỗi shape khi implement. |
| **sửa seed_lessons.ts 3 điểm** → regression CD1/CD2/CD3 | `hasContent` nới lỏng chỉ thêm điều kiện `sentences.length > 0` (CD1/CD2/CD3 luôn có words → không đổi kết quả). 2 nhánh generateQuestions có guard `sg.topicId === "topic-4-stress-connected"` + `continue` → không ảnh hưởng CĐ1-3. Chạy `npm test` + build verify. |
| **cmudict stress marker** → stressIndex sai | Verify stressIndex = vị trí âm tiết nhấn (0-based) theo cmudict (số 0/1/2 = no/primary/secondary stress). Authoring review từng từ. |
| **không playtest** (UI SP4 chưa xong) → không verify trải nghiệm | SP3d verify DB-level (contentJson đúng structure + Question sinh) + test TDD. Playtest = SP4. Rõ ràng tách scope. |
| **1 commit lớn 4 nhóm** | Chia 2 đợt (plan phase): Đợt 1 g01+g02, Đợt 2 g03+g04. Mỗi đợt 1 plan + 1 commit, review giữa. |
| **Audio g01 API fail** → từ NEEDS_REVIEW, không vào Mode A | Giữ NEEDS_REVIEW, log từ fail, bổ sung audio manual sau. Mode B (đọc từ) vẫn hoạt động không cần audio. |
| **scale 8→full** chưa làm | Pilot 8/nhóm đủ demo; scale sau nếu user ưng. |
