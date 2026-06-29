# 🚀 Seed MVP Đơn Giản - Khắc Phục Lỗi Schema

## ⚠️ VẤN ĐỀ

File `seed_lessons.ts` dựa trên catalog phức tạp nhưng schema database hiện tại đơn giản hơn.

**Lỗi gặp phải**:
- Topic không có `orderIndex`
- QuestionType không có `requiresAudio`, `requiresVoice`
- Các field khác có thể khác tên

## ✅ GIẢI PHÁP NHANH

Sử dụng lại file seed cũ đã hoạt động: **`seed_real.ts`**

---

## 📋 CÁCH CHẠY

### Bước 1: Sử dụng seed cũ
```bash
cd frontend

# Chạy seed cũ (đã test và work)
npx tsx prisma/seed_real.ts
```

### Bước 2: Chạy development server
```bash
npm run dev
```

### Bước 3: Kiểm tra
```
http://localhost:3000/learning_map
```

---

## 🔧 SỬA SEED_LESSONS.TS (Sau này)

Cần đồng bộ với schema thực tế:

### 1. Kiểm tra schema
```bash
# Xem các model và fields
cat prisma/schema.prisma | grep "model "
```

### 2. Update seed script
- Bỏ các field không tồn tại (`orderIndex`, `requiresAudio`, etc.)
- Chỉ seed fields có trong schema
- Test từng function riêng

### 3. Các model cần kiểm tra
- ✅ QuestionType (đã fix - chỉ có id, name, description)
- ⚠️ Topic (cần bỏ orderIndex)
- ⚠️ SoundGroup (cần kiểm tra fields)
- ⚠️ Exercise (cần kiểm tra fields)
- ⚠️ Question (cần kiểm tra fields)

---

## 🎯 KẾ HOẠCH TIẾP THEO

### Ngắn hạn (Bây giờ):
1. Dùng `seed_real.ts` để có dữ liệu demo
2. Test web app với dữ liệu hiện có
3. Chạy `npm run dev` để xem giao diện

### Dài hạn (Sau khi test xong):
1. Đọc kỹ `prisma/schema.prisma`
2. Update `lesson-catalog.ts` cho phù hợp
3. Sửa `seed_lessons.ts` theo schema thực tế
4. Test seed từng phase một

---

## ⚡ LỆNH NHANH

```bash
# Vào thư mục frontend
cd D:\01_Company_Work\Projects\Web_HoTroPhatAmEN\english_pronunciation_app\frontend

# Seed dữ liệu (dùng file cũ)
cmd /c "npx tsx prisma/seed_real.ts"

# Chạy web
cmd /c "npm run dev"
```

Sau đó mở: **http://localhost:3000** 🎉

---

## 📝 GHI CHÚ

- `seed_real.ts` đã được test và hoạt động tốt
- `seed_lessons.ts` là phiên bản nâng cao, cần điều chỉnh schema trước
- Ưu tiên làm cho app chạy được trước, tối ưu sau

---

## 🔍 DEBUG SCHEMA

Nếu muốn xem fields thực tế của từng model:

```bash
cd frontend
npx prisma studio
```

Mở trình duyệt: `http://localhost:5555`

Xem từng model và fields có sẵn.
