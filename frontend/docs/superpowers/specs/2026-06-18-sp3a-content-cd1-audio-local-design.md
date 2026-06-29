# SP3a — Content + seed CĐ1 (10 nhóm) + rút ruột audio local Design

Ngày: 2026-06-18
Trạng thái: design đã được user duyệt (hướng A)
Scope: SP3 chia 2 đợt. SP3a = CĐ1 (10 nhóm Nguyên âm) + audio local. SP3b (sau khi user duyệt SP3a) = CĐ2 (12 nhóm Phụ âm) + CĐ3 (4 nhóm Minimal Pairs Khó) + CĐ4 (4 nhóm Trọng âm & Nối âm).

## Mục tiêu

Soạn content chỉn chu cho 10 nhóm CĐ1 (6 nguyên âm đơn + 4 nguyên âm đôi), rút ruột audio mp3 về `frontend/public/audio/` (app tự chứa, không phụ thuộc API runtime — an toàn bảo vệ phản biện), dùng Web Speech API phát mẫu cho câu. User review chất lượng content CĐ1, ưng ý → làm tiếp SP3b.

## Nguồn dữ liệu (an toàn bản quyền, theo `question-bank-curator` + `ipa-pronunciation-pedagogy`)

| Loại content | Nguồn | Bản quyền |
|---|---|---|
| IPA cho WordItem | CMU Pronouncing Dictionary (open data) + Free Dictionary API (verify) | ✅ open |
| Audio mp3 cho từ | **Free Dictionary API** (audio từ Wiktionary, CC-BY-SA 3.0) → tải về local | ✅ CC-BY-SA (ghi credit) |
| Minimal pair (cặp từ) | **Tự biên soạn** (MANUAL) — từ tiếng Anh chung, tự sắp xếp cặp | ✅ từ chung, không copy sách |
| Câu thực chiến (speak_sentence) | **Tự biên soạn** (MANUAL) — câu ngắn 1-2 target word | ✅ không copy sách |
| Audio cho câu | **Web Speech API** (`window.speechSynthesis`) runtime, voice cài trên trình duyệt | ✅ miễn phí, không cần mạng |

**KHÔNG dùng** (theo `question-bank-curator` Copyright Rules): copy audio Cambridge/Oxford, copy list câu sách (Ship or Sheep, English Pronunciation in Use), scrape Cambridge/Oxford.

## Trạng thái CĐ1 hiện tại (sau SP2)

3 nhóm đã có content: `map-t1-g01-i-ih` (8 từ, 4 cặp, 4 câu), `map-t1-g02-e-ae` (6 từ, 3 cặp, 3 câu), `map-t1-g04-o-oh` (8 từ, 4 cặp, 3 câu). Audio: `audioUrl` đang là **link remote** (`https://api.dictionaryapi.dev/media/...`) → phụ thuộc API runtime → rủi ro bảo vệ.

Cần **thêm 7 nhóm**: `map-t1-g03-central`, `map-t1-g05-u-uh`, `map-t1-g06-er`, `map-t1-g07-ei-ai`, `map-t1-g08-oi-au`, `map-t1-g09-ou-ea`, `map-t1-g10-ia-ua`.

## 3 hướng tiếp cận (đã chốt A)

| Hướng | Làm gì | Chốt |
|---|---|---|
| A — Rút ruột mp3 cả 10 nhóm + content 7 nhóm mới | Script fetch mp3 → `public/audio/`; 3 nhóm cũ chuyển audioUrl remote→local; biên soạn 7 nhóm mới; re-seed. | ✅ User duyệt |
| B — Chỉ content 7 nhóm mới, giữ 3 nhóm cũ audio remote | Nhanh nhưng 3 nhóm cũ vẫn rủi ro bảo vệ. | Loại |
| C — Tách rút ruột và content thành 2 đợt | Chậm, user review 2 lần. | Loại |

## 1. Biên soạn content 7 nhóm mới (theo `ipa-pronunciation-pedagogy`)

Quy tắc skill: bắt đầu từ target phoneme/contrast cụ thể; minimal pair cho contrast dễ nhầm người Việt; 1 bài 1 contrast (không mix); câu ngắn 1-2 target word; tránh homograph/từ hiếm; `commonMistake`/`reviewNote` ghi điểm dễ nhầm.

Mỗi nhóm: 8-10 từ, 4-6 cặp, 3-4 câu. `sourceType`: word = `FREE_API`, pair/sentence = `MANUAL`.

| Nhóm | Âm target | Từ | Cặp | Câu | Điểm dễ nhầm (người Việt) |
|---|---|---:|---:|---:|---|
| g03 central | /ɑː/ /ʌ/ /ə/ | 9 | 4 (/ɑː//ʌ/) | 3 | Gộp /ɑː/ và /ʌ/; /ə/ quá yếu bị bỏ |
| g05 u-uh | /ʊ/ /uː/ | 8 | 4 | 3 | /ʊ/ ngắn lỏng vs /uː/ dài căng; gộp thành /u/ |
| g06 er | /ɜː/ | 8 | 0 (không cặp) | 3 | Không có âm tương đương tiếng Việt; hay đọc thành /ə/ hoặc /ɔː/ |
| g07 ei-ai | /eɪ/ /aɪ/ | 8 | 4 | 3 | Cả 2 kết thúc /ɪ/ nhưng điểm xuất phát khác (/e/ vs /a/) |
| g08 oi-au | /ɔɪ/ /aʊ/ | 8 | 4 | 3 | /ɔɪ/ lên, /aʊ/ xuống-lên; người Việt hay đọc phẳng |
| g09 ou-ea | /əʊ/ /eə/ | 8 | 4 | 3 | /əʊ/ trượt từ schwa, /eə/ trượt từ /e/; hay nhầm |
| g10 ia-ua | /ɪə/ /ʊə/ | 8 | 4 | 3 | Ít gặp tiếng Việt, khó; hay đọc thành 2 âm tách biệt |

Tổng 7 nhóm: ~57 từ + 24 cặp + 21 câu. IPA tự biên soạn + verify cmudict.

Lưu ý g06 (/ɜː/ không cặp): theo skill "1 bài 1 contrast" — nhóm này không có contrast, nên 4 mode chuẩn vẫn tạo nhưng `speak_minimal_pair` sẽ có ít/0 cặp → exercise `speak_minimal_pair` của g06 ở DRAFT (hoặc sinh câu từ speak_word/speak_sentence thay thế). Chi tiết trong plan.

## 2. Script rút ruột audio local (`frontend/prisma/seed_audio_local.ts`)

Script Node.js/tsx chạy 1 lần lúc code (KHÔNG runtime). Idempotent (skip file đã có).

```text
Đọc tất cả WordItem có sourceType = "FREE_API" trong DB
  → Với mỗi từ:
    - Nếu public/audio/{word}.mp3 đã tồn tại → skip (idempotent)
    - Gọi https://api.dictionaryapi.dev/api/v2/entries/en/{word}
    - Lấy link mp3 (ưu tiên UK, sau US, sau bất kỳ)
    - Tải mp3 về frontend/public/audio/{word}.mp3
    - Cập nhật DB: audioUrl = "/audio/{word}.mp3", audioSource = "FREE_DICTIONARY"
    - Nếu API fail/không audio → giữ status = NEEDS_REVIEW, audioUrl = null
  → Log: số từ tải thành công, số fail
```

Timeout mỗi fetch: 8s (như `fetchAudioUrl` hiện có trong seed_lessons.ts). Retry 1 lần nếu fail.

Kết quả ước tính: ~75-80 từ CĐ1 có audio local; ~5-10 từ fail → NEEDS_REVIEW (không đưa vào listen_choose, theo `DATA_SEED_PLAN` mục 8).

## 3. Web Speech API cho câu (speak_sentence)

Câu không có audio mp3 từ Free Dictionary API. Dùng `window.speechSynthesis` phát runtime:

- Sửa `ExerciseEngineClient.tsx` `VoiceQuestion`: khi `mode = speak_sentence`, thêm nút "🔊 Nghe mẫu" gọi `speechSynthesis.speak(new SpeechSynthesisUtterance(question.answer))` với `lang = "en-US"`, ưu tiên voice en-US/en-UK có trên máy.
- KHÔNG seed mp3 câu (đơn giản MVP).
- Không overclaim: `speechSynthesis` chỉ phát mẫu, không chấm âm vị (theo skill Feedback Rules).

Đây là thay đổi nhỏ trong engine — chỉ thêm nút nghe mẫu cho sentence mode. UI đầy đủ cho CĐ4 + Mode B multi-answer → SP4.

## 4. Seed + verify

- Cập nhật `lesson-content.ts`: thêm 7 nhóm content mới (words/pairs/sentences, `soundGroupId` khớp catalog v2).
- Re-seed: `db_cleanup` → `seed_lessons` (sinh content cho 10 nhóm CĐ1; các nhóm khác vẫn shell DRAFT).
- Chạy `seed_audio_local.ts` (rút ruột mp3 local cho tất cả từ FREE_API, gồm 3 nhóm cũ + 7 nhóm mới).
- Verify DB: CĐ1 có 10 nhóm ACTIVE (trừ g06 speak_minimal_pair có thể DRAFT), ~80 từ (active có audio local), ~32 cặp, ~27 câu, QuestionBankItem + Question cho 10 nhóm. `audioUrl` tất cả = `/audio/...` (local, không link remote).

## 5. Quality gate + README + .gitignore

- `.gitignore` (frontend hoặc english_pronunciation_app): thêm `frontend/public/audio/*.mp3` (không commit mp3 — repo gọn, audio là data sinh ra).
- `frontend/README.md`: thêm mục "Cài đặt dữ liệu + audio":
  ```
  1. Cấu hình DATABASE_URL trong .env (PostgreSQL)
  2. npx prisma db push
  3. npx tsx prisma/db_cleanup.ts (dọn DB nếu cần)
  4. npm run db:seed:lessons (seed content)
  5. npx tsx prisma/seed_audio_local.ts (tải audio mp3 về public/audio — chạy 1 lần)
  ```
  + Credit: "Audio: Wiktionary (CC-BY-SA 3.0) via Free Dictionary API. IPA verified with CMU Pronouncing Dictionary."
- `CURRENT_PROJECT_CONTEXT.md`: ghi nguồn audio Wiktionary CC-BY-SA + cmudict vào mục nguồn dữ liệu.
- Quality gate: `npx prisma validate` + `npx tsc --noEmit --pretty false` + `npm test` + `npm run build` pass.

## 6. Testing

- **Test content (TDD)**: tạo `src/lib/__tests__/lesson-content.test.ts` — kiểm tra 7 nhóm mới có trong `LESSON_CONTENT_BY_SOUND_GROUP`, mỗi nhóm có words/pairs/sentences không rỗng, `soundGroupId` khớp catalog, không có id cũ (`map-t4-g01-...`).
- Test catalog (24 test cũ) vẫn pass.
- Không test script rút ruột (side-effect file system + network — verify thủ công bằng log + kiểm `public/audio/` có file).

## 7. Thay đổi behavior?

- App chạy **offline** cho audio từ (mp3 local) → tốt hơn bảo vệ.
- speak_sentence có thêm nút "Nghe mẫu" (Web Speech API) → cải thiện UX, không vỡ logic cũ.
- 3 nhóm CĐ1 cũ: `audioUrl` remote → local → app không phụ thuộc API.
- 7 nhóm CĐ1 mới: DRAFT → ACTIVE (có audio) / NEEDS_REVIEW (thiếu audio).
- XP/streak/badge/leaderboard/check-in KHÔNG đụng.

## 8. File sẽ tạo/sửa

| Hành động | File |
|---|---|
| tạo | `frontend/prisma/seed_audio_local.ts` (script rút ruột mp3) |
| tạo | `frontend/src/lib/__tests__/lesson-content.test.ts` (TDD content) |
| sửa | `frontend/prisma/lesson-content.ts` (thêm 7 nhóm CĐ1) |
| sửa | `frontend/src/app/exercises/[id]/ExerciseEngineClient.tsx` (nút nghe mẫu câu speechSynthesis) |
| sửa | `english_pronunciation_app/.gitignore` (thêm `frontend/public/audio/*.mp3`) |
| sửa | `english_pronunciation_app/frontend/README.md` (hướng dẫn seed + audio + credit) |
| sửa | `PLAN/00_Project_Context/CURRENT_PROJECT_CONTEXT.md` (ghi nguồn audio) |

## 9. Không nằm trong phạm vi SP3a

- CĐ2 (12 nhóm Phụ âm), CĐ3 (4 nhóm), CĐ4 (4 nhóm đặc thù) → SP3b.
- UI mới CĐ4 (tap-stress/weak/linking/assimilation), Mode B multi-answer, scoring multiplier/retake → SP4.
- Unlock runtime → SP4 + SP6.
- Seed mp3 câu bằng TTS cloud (Google/Azure) → tùy chọn sau, MVP dùng Web Speech API.

## 10. Rủi ro & giải pháp

| Rủi ro | Giải pháp |
|---|---|
| API fail nhiều từ → ít audio | Giữ NEEDS_REVIEW, không đưa listen_choose; ghi log từ fail; có thể bổ sung audio local/manual sau. |
| Web Speech API voice kém trên máy bảo vệ | Test trước trên máy bảo vệ; Chrome/Edge có voice en-US natural; fallback: không có nút nghe nếu `speechSynthesis` undefined. |
| cmudict verify phát hiện IPA sai | Sửa IPA trong content trước khi seed; ghi reviewNote. |
| Content 7 nhóm cẩu thả | User review SP3a trước khi làm SP3b (chính mục đích chia đợt). |
| g06 /ɜː/ không cặp → speak_minimal_pair rỗng | Exercise đó DRAFT; 3 mode khác (listen/speak_word/speak_sentence) vẫn ACTIVE. |
