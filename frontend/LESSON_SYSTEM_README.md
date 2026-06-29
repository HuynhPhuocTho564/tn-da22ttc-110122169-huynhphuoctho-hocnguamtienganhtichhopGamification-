# 📚 Hệ Thống Bài Học IPA - Hướng Dẫn Sử Dụng

## ✅ ĐÃ HOÀN THÀNH

### Phase A & B: Lesson Catalog + Seed Pipeline

Đã tạo xong hệ thống bài học hoàn chỉnh với:

- **lesson-catalog.ts**: Định nghĩa 4 chủ đề, 25 nhóm âm, 100 bài
- **lesson-content.ts**: Dữ liệu MVP (16 bài ACTIVE)
- **seed_lessons.ts**: Script seed tự động vào database

---

## 📊 CẤU TRÚC HỆ THỐNG

### 4 Chủ Đề (Topics)
1. **Nguyên âm đơn** - 6 nhóm, 24 bài
2. **Nguyên âm đôi** - 4 nhóm, 16 bài  
3. **Phụ âm** - 11 nhóm, 44 bài
4. **Minimal Pairs khó** - 4 nhóm, 16 bài (Tổng hợp)

### 25 Nhóm Âm (Sound Groups)
Mỗi nhóm có:
- Âm IPA mục tiêu
- Difficulty (1-10)
- Từ, cặp minimal pair, câu ví dụ

### 4 Chế Độ Luyện Tập (Exercise Modes)
Mỗi nhóm âm → 4 bài:
1. 👂 **Luyện tai** (listen_choose) - Nghe và chọn
2. 🗣️ **Luyện miệng** (speak_word) - Đọc từ
3. ⚔️ **Thử thách kép** (speak_minimal_pair) - Đọc cặp từ
4. 🎯 **Thực chiến** (speak_sentence) - Đọc câu

**Tổng**: 25 nhóm × 4 mode = **100 bài**

---

## 🚀 CÁCH CHẠY SEED

### Bước 1: Đảm bảo database chạy
```bash
# Kiểm tra PostgreSQL đang chạy
# Port: 5432
# Database: english_app
```

### Bước 2: Sync schema Prisma
```bash
cd frontend
npx prisma generate
npx prisma db push
```

### Bước 3: Chạy seed
```bash
# Cách 1: Dùng Prisma CLI
npx prisma db seed

# Cách 2: Dùng npm script
npm run db:seed:lessons

# Cách 3: Chạy trực tiếp
npx tsx prisma/seed_lessons.ts
```

### Kết quả mong đợi:
```
🌱 Starting lesson seed...

📦 Seeding Question Types...
   ✓ 3 QuestionTypes created
📚 Seeding Topics...
   ✓ 4 Topics created
🔤 Seeding Phonemes...
   ✓ 44 Phonemes created
🎵 Seeding Sound Groups...
   ✓ 25 SoundGroups created
📝 Seeding Lesson Content...
   ✓ 30 WordItems created
   ✓ 13 MinimalPairs created
   ✓ 9 SentenceItems created
🗺️  Generating Learning Maps...
   ✓ 25 LearningMaps generated
📋 Generating Exercises...
   ✓ 100 Exercises generated (25 groups × 4 modes)
❓ Generating Questions...
   ✓ 64 Questions generated

✅ Lesson seed completed successfully!

📊 Summary:
   - 4 Topics
   - 44 Phonemes
   - 25 Sound Groups
   - 25 Learning Maps
   - 100 Exercises
   - MVP: 4 sound groups with full content (16 lessons ACTIVE)
```

---

## 📝 DỮLIỆU MVP (16 BÀI ACTIVE)

### Chủ đề 1: Nguyên âm đơn (8 bài)

#### Nhóm 1: /iː/ & /ɪ/ (4 bài)
- Luyện tai: Nghe sheep/ship/feel/fill...
- Luyện miệng: Đọc 5 từ
- Thử thách kép: Đọc 4 cặp minimal pairs
- Thực chiến: Đọc 4 câu

#### Nhóm 2: /e/ & /æ/ (4 bài)
- Luyện tai: Nghe bed/bad/pen/pan...
- Luyện miệng: Đọc 6 từ
- Thử thách kép: Đọc 3 cặp  
- Thực chiến: Đọc 3 câu

### Chủ đề 4: Tổng hợp (8 bài)

#### Nhóm 1: Front vowels mix (4 bài)
- 8 từ: sheep/ship/shape/sharp/beat/bit/bet/bat
- 4 cặp minimal pairs
- 2 câu thử thách cao

#### Nhóm 3: Final consonants (4 bài)  
- 6 từ: cap/cab/cat/cad/back/bag
- 3 cặp minimal pairs
- 2 câu tập trung phụ âm cuối

---

## 🗂️ CẤU TRÚC FILE

```
frontend/
├── prisma/
│   ├── lesson-catalog.ts          ← Định nghĩa 4 topics, 25 groups, 100 bài
│   ├── lesson-content.ts          ← Dữ liệu MVP (từ/cặp/câu)
│   ├── seed_lessons.ts            ← Script seed (RUN THIS!)
│   ├── seed_real.ts               ← Old seed (backup)
│   └── schema.prisma              ← Database schema
└── package.json                   ← Added: "db:seed:lessons" script
```

---

## 🔍 KIỂM TRA KẾT QUẢ

### Trong database:
```sql
-- Check topics
SELECT * FROM "Topic" ORDER BY "orderIndex";

-- Check sound groups  
SELECT * FROM "SoundGroup" ORDER BY "orderIndex";

-- Check learning maps
SELECT * FROM "LearningMap" WHERE status = 'ACTIVE';

-- Check exercises
SELECT * FROM "Exercise" WHERE status = 'ACTIVE';

-- Check questions
SELECT COUNT(*) FROM "Question" GROUP BY "exerciseId";
```

### Trong Learning Map UI:
```
http://localhost:3000/learning_map
```

Bạn sẽ thấy:
- 4 chủ đề
- 25 nhóm âm (4 nhóm ACTIVE, 21 nhóm DRAFT)
- 16 bài ACTIVE (có thể làm ngay)
- 84 bài DRAFT (chưa có dữ liệu đầy đủ)

---

## 📊 STATUS CỦA BÀI HỌC

### ACTIVE ✅
- Có đủ từ/cặp/câu
- Có questions được generate
- User có thể làm bài ngay

### DRAFT 📝
- Chỉ có shell (structure)
- Chưa có questions
- Hiển thị trong Learning Map nhưng chưa làm được

### LOCKED 🔒
- (Chưa dùng trong MVP)
- Có thể dùng sau cho progression system

---

## 🎯 NEXT STEPS

### Phase C: Thêm audio thật
```typescript
// Trong lesson-content.ts, cập nhật audioUrl:
{
  word: "sheep",
  audioUrl: "https://api.dictionaryapi.dev/...",
  status: "ACTIVE",
}
```

### Phase D: Nâng cấp Exercise Engine
Sửa `ExerciseEngineClient.tsx` để:
- Phân biệt `speak_word` vs `speak_sentence` UI
- Hiển thị hint từ `contentJson`
- Better feedback cho từng mode

### Phase E: Cập nhật Learning Map UI
Sửa `LearningMapClient.tsx` để:
- Sort theo orderIndex
- Hiển thị 4 mode icons rõ ràng
- Progress bar cho mỗi nhóm
- Badge "Tổng hợp" cho Topic 4

### Phase F: Admin management
Tạo UI admin để:
- Review WordItem, MinimalPair, SentenceItem
- Thay đổi status DRAFT → ACTIVE
- Upload audio
- Kiểm tra quality

---

## 🐛 TROUBLESHOOTING

### Lỗi: "Table does not exist"
```bash
npx prisma db push
```

### Lỗi: "Unique constraint failed"
```bash
# Xóa dữ liệu cũ và seed lại
npx prisma db push --force-reset
npm run db:seed:lessons
```

### Lỗi: TypeScript type errors
```bash
npx prisma generate
```

### Seed chạy lâu (>30s)
- Bình thường, đang insert 100+ records
- Nếu quá lâu (>2 phút), check database connection

---

## 📚 TÀI LIỆU THAM KHẢO

- `LESSON_CODING_PLAN.md` - Kế hoạch chi tiết
- `DATA_SEED_PLAN.md` - Kế hoạch dữ liệu
- `prisma/schema.prisma` - Database schema
- IPA Pronunciation Pedagogy skill - Nguyên tắc thiết kế bài học

---

## ✅ CHECKLIST

- [x] Tạo lesson-catalog.ts (4 topics, 25 groups)
- [x] Tạo lesson-content.ts (MVP data)
- [x] Tạo seed_lessons.ts (pipeline)
- [x] Cập nhật package.json (seed script)
- [x] Test seed locally
- [ ] Thêm audio URLs thật (Phase C)
- [ ] Nâng cấp Exercise Engine (Phase D)
- [ ] Cập nhật Learning Map UI (Phase E)
- [ ] Admin management UI (Phase F)

---

## 🎉 KẾT LUẬN

Hệ thống bài học đã có cấu trúc đầy đủ:
- **100 bài** theo 4 chủ đề, 25 nhóm âm
- **MVP: 16 bài ACTIVE** sẵn sàng demo
- **Seed tự động** từ catalog
- **Scalable** - dễ thêm content mới

Chạy seed và bắt đầu học ngay! 🚀
