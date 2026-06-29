# 🚀 HƯỚNG DẪN NHANH: BẬT GOOGLE OAUTH

## ⚡ 3 BƯỚC ĐƠN GIẢN

### BƯỚC 1: Lấy Google OAuth Credentials (5 phút)

1. **Truy cập**: https://console.cloud.google.com/
2. **Tạo Project**: Click "New Project" → Đặt tên "PhatAmEN" → Create
3. **Bật OAuth**:
   - Menu → APIs & Services → OAuth consent screen
   - Chọn "External" → Create
   - Điền:
     - App name: `PhatAmEN`
     - User support email: `<email-của-bạn>`
     - Developer contact: `<email-của-bạn>`
   - Save and Continue → Save and Continue → Back to Dashboard

4. **Tạo Credentials**:
   - APIs & Services → Credentials
   - Create Credentials → OAuth client ID
   - Application type: `Web application`
   - Name: `PhatAmEN Web`
   - Authorized redirect URIs:
     ```
     http://localhost:3000/api/auth/callback/google
     ```
   - Create

5. **Copy 2 giá trị**:
   - ✅ Client ID: `123456...xyz.apps.googleusercontent.com`
   - ✅ Client Secret: `GOCSPX-abc...xyz`

---

### BƯỚC 2: Cấu hình .env (1 phút)

Mở file `frontend/.env` và thêm 3 dòng sau vào cuối:

```env
# Google OAuth
AUTH_URL="http://localhost:3000"
AUTH_GOOGLE_ID="PASTE_CLIENT_ID_HERE"
AUTH_GOOGLE_SECRET="PASTE_CLIENT_SECRET_HERE"
```

**Thay thế**:
- `PASTE_CLIENT_ID_HERE` → Client ID từ bước 1
- `PASTE_CLIENT_SECRET_HERE` → Client Secret từ bước 1

**File .env đầy đủ sẽ như này**:
```env
DATABASE_URL="postgresql://postgres:admin132@localhost:5432/english_app?schema=public"
AUTH_SECRET="16503c4f74d0a797f1f0a256a2bb3c43"

# Google OAuth
AUTH_URL="http://localhost:3000"
AUTH_GOOGLE_ID="123456789-abc...xyz.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="GOCSPX-abc...xyz"
```

---

### BƯỚC 3: Restart Server (30 giây)

```bash
# Vào thư mục frontend
cd D:\01_Company_Work\Projects\Web_HoTroPhatAmEN\english_pronunciation_app\frontend

# Dừng server hiện tại (nếu đang chạy): Ctrl + C

# Chạy lại
npm run dev
```

---

## ✅ KIỂM TRA

1. Mở trình duyệt: http://localhost:3000/register
2. Bạn sẽ thấy nút **"Đăng ký với Google"** với icon Google 🎉
3. Click vào → Chọn tài khoản Google → Đăng nhập thành công!

---

## ⚠️ NẾU KHÔNG THẤY NÚT GOOGLE

### Nguyên nhân 1: Server chưa restart
→ Dừng server (Ctrl+C) và chạy lại `npm run dev`

### Nguyên nhân 2: .env chưa đúng
→ Kiểm tra lại file `.env` có 3 dòng:
- `AUTH_URL`
- `AUTH_GOOGLE_ID`  
- `AUTH_GOOGLE_SECRET`

### Nguyên nhân 3: Client ID/Secret sai
→ Copy lại chính xác từ Google Cloud Console

---

## 🐛 LỖI THƯỜNG GẶP

### Lỗi: "Error 400: redirect_uri_mismatch"
**Sửa**: Vào Google Cloud Console → Credentials → Edit OAuth client
→ Thêm chính xác:
```
http://localhost:3000/api/auth/callback/google
```

### Lỗi: "Error 403: access_denied"  
**Sửa**: 
1. Vào OAuth consent screen
2. Thêm email của bạn vào "Test users"
3. Save

---

## 📸 HÌNH ẢNH THAM KHẢO

### Google Cloud Console:
```
APIs & Services
├── OAuth consent screen (Cấu hình app)
└── Credentials (Lấy Client ID/Secret)
```

### Redirect URI phải chính xác:
```
http://localhost:3000/api/auth/callback/google
                                    ↑
                    Đúng path này: /api/auth/callback/google
```

---

## 🎉 HOÀN TẤT!

Sau khi làm xong 3 bước trên:
- ✅ Nút Google xuất hiện
- ✅ Click → Đăng nhập Google
- ✅ Tự động tạo user trong database
- ✅ Redirect về dashboard

**Thời gian**: Tổng cộng ~7 phút

---

## 📞 CẦN HỖ TRỢ?

Xem hướng dẫn chi tiết: `GOOGLE_OAUTH_SETUP.md`

Hoặc check console log:
```bash
# Browser console (F12)
# Terminal của npm run dev
```

Good luck! 🚀
