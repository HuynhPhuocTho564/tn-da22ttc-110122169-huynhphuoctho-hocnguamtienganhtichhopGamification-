# Hướng Dẫn Cấu Hình Google OAuth

## 📋 Tổng Quan

Để có nút "Đăng nhập bằng Google" hoạt động, bạn cần:
1. Tạo project trên Google Cloud Console
2. Lấy Client ID và Client Secret
3. Cấu hình trong file .env

---

## 🚀 BƯỚC 1: Tạo Google Cloud Project

### 1.1. Truy cập Google Cloud Console
Mở trình duyệt và truy cập: **https://console.cloud.google.com/**

### 1.2. Tạo Project Mới
1. Click vào dropdown project ở góc trên bên trái
2. Click **"NEW PROJECT"**
3. Nhập tên project: `PhatAmEN` hoặc `English Pronunciation App`
4. Click **"CREATE"**
5. Đợi vài giây cho project được tạo

---

## 🔑 BƯỚC 2: Tạo OAuth 2.0 Credentials

### 2.1. Bật Google+ API (Optional)
1. Trong Google Cloud Console, vào menu **"APIs & Services"** > **"Library"**
2. Tìm **"Google+ API"** hoặc **"Google Identity"**
3. Click **"Enable"** (nếu chưa bật)

### 2.2. Cấu hình OAuth Consent Screen
1. Vào **"APIs & Services"** > **"OAuth consent screen"**
2. Chọn **"External"** (cho phép bất kỳ ai đăng nhập)
3. Click **"CREATE"**

#### Điền thông tin:
- **App name**: `PhatAmEN` hoặc `Ứng dụng học phát âm`
- **User support email**: Email của bạn
- **App logo**: (Optional) upload logo nếu có
- **App domain**: 
  - Application home page: `http://localhost:3000` (development)
  - hoặc domain thật nếu đã deploy
- **Developer contact information**: Email của bạn

4. Click **"SAVE AND CONTINUE"**

#### Scopes (Phạm vi truy cập):
1. Click **"ADD OR REMOVE SCOPES"**
2. Chọn các scope sau:
   - `userinfo.email`
   - `userinfo.profile`
   - `openid`
3. Click **"UPDATE"** > **"SAVE AND CONTINUE"**

#### Test users (Chế độ Testing):
1. Click **"ADD USERS"**
2. Thêm email của bạn (để test)
3. Click **"SAVE AND CONTINUE"**

4. Review và click **"BACK TO DASHBOARD"**

### 2.3. Tạo OAuth 2.0 Client ID
1. Vào **"APIs & Services"** > **"Credentials"**
2. Click **"CREATE CREDENTIALS"** > **"OAuth client ID"**
3. Chọn **Application type**: `Web application`
4. Đặt tên: `PhatAmEN Web Client`

#### Authorized JavaScript origins:
```
http://localhost:3000
http://localhost:3001
```
(Thêm production URL sau khi deploy)

#### Authorized redirect URIs:
```
http://localhost:3000/api/auth/callback/google
http://localhost:3001/api/auth/callback/google
```
(Pattern: `{YOUR_DOMAIN}/api/auth/callback/google`)

5. Click **"CREATE"**

### 2.4. Lưu Client ID và Client Secret
Sau khi tạo, một popup sẽ hiện ra với:
- **Client ID**: Chuỗi dài như `123456789-abc...xyz.apps.googleusercontent.com`
- **Client Secret**: Chuỗi ngắn hơn như `GOCSPX-abc...xyz`

⚠️ **QUAN TRỌNG**: Copy cả 2 giá trị này ngay!

---

## 📝 BƯỚC 3: Cấu Hình File .env

### 3.1. Mở file .env
Trong thư mục `frontend/`, tạo hoặc mở file `.env.local` (hoặc `.env`):

```bash
cd D:\01_Company_Work\Projects\Web_HoTroPhatAmEN\english_pronunciation_app\frontend
```

Nếu chưa có file `.env.local`, tạo mới:
```bash
copy .env.example .env.local
```

### 3.2. Thêm Google OAuth Credentials

Mở `.env.local` và thêm/sửa các dòng sau:

```env
# Database (giữ nguyên)
DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/english_app?schema=public"

# Auth.js / NextAuth v5
AUTH_SECRET="your-super-secret-key-here-minimum-32-characters"
AUTH_URL="http://localhost:3000"

# Google OAuth
AUTH_GOOGLE_ID="123456789-abc...xyz.apps.googleusercontent.com"
AUTH_GOOGLE_SECRET="GOCSPX-abc...xyz"
```

#### Giải thích:
- `AUTH_SECRET`: Chuỗi bí mật bất kỳ (tối thiểu 32 ký tự). Có thể generate bằng:
  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
  ```
  
- `AUTH_URL`: URL của app (local: `http://localhost:3000`, production: `https://yourdomain.com`)

- `AUTH_GOOGLE_ID`: **Client ID** từ Google Cloud Console

- `AUTH_GOOGLE_SECRET`: **Client Secret** từ Google Cloud Console

### 3.3. Lưu file và restart server

```bash
# Dừng server (Ctrl + C)
# Chạy lại
npm run dev
```

---

## ✅ BƯỚC 4: Kiểm Tra

### 4.1. Truy cập trang đăng ký/đăng nhập
```
http://localhost:3000/register
http://localhost:3000/login
```

### 4.2. Kiểm tra nút Google
Bạn sẽ thấy nút **"Đăng ký với Google"** hoặc **"Tiếp tục với Google"**

### 4.3. Click và test
1. Click vào nút Google
2. Chọn tài khoản Google của bạn
3. Cho phép app truy cập email và profile
4. Bạn sẽ được redirect về app và tự động đăng nhập

---

## 🐛 TROUBLESHOOTING (Xử lý lỗi)

### Lỗi 1: Không thấy nút Google
**Nguyên nhân**: File .env chưa có `AUTH_GOOGLE_ID` và `AUTH_GOOGLE_SECRET`

**Giải pháp**:
1. Kiểm tra file `.env.local` có 2 biến trên
2. Restart server: `npm run dev`

### Lỗi 2: "Error 400: redirect_uri_mismatch"
**Nguyên nhân**: Redirect URI không khớp với Google Console

**Giải pháp**:
1. Vào Google Cloud Console > Credentials
2. Edit OAuth client
3. Thêm chính xác URL:
   ```
   http://localhost:3000/api/auth/callback/google
   ```
4. Save và thử lại

### Lỗi 3: "Error 403: access_denied"
**Nguyên nhân**: OAuth Consent Screen ở chế độ "Testing" và email chưa được thêm vào Test users

**Giải pháp**:
1. Vào OAuth consent screen
2. Thêm email của bạn vào "Test users"
3. Hoặc publish app (chuyển sang Production)

### Lỗi 4: "Error: NEXTAUTH_SECRET"
**Nguyên nhân**: Thiếu `AUTH_SECRET` trong .env

**Giải pháp**:
```bash
# Generate secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"

# Thêm vào .env.local
AUTH_SECRET="<kết-quả-ở-trên>"
```

---

## 📊 KIỂM TRA CẤU HÌNH

### Checklist:
- [ ] Đã tạo Google Cloud Project
- [ ] Đã cấu hình OAuth Consent Screen
- [ ] Đã tạo OAuth 2.0 Client ID
- [ ] Đã copy Client ID và Client Secret
- [ ] Đã thêm vào file `.env.local`
- [ ] Đã thêm Redirect URI chính xác
- [ ] Đã restart server
- [ ] Thấy nút Google trên trang login/register
- [ ] Click vào nút Google và đăng nhập thành công

---

## 🌐 PRODUCTION DEPLOYMENT

Khi deploy lên production (Vercel, Netlify, etc.):

### 1. Cập nhật Authorized URIs
Vào Google Cloud Console > Credentials > Edit OAuth client:

**Authorized JavaScript origins**:
```
https://yourdomain.com
```

**Authorized redirect URIs**:
```
https://yourdomain.com/api/auth/callback/google
```

### 2. Cập nhật ENV trên hosting
Thêm các biến môi trường trên platform (Vercel/Netlify):
```
AUTH_SECRET=<your-production-secret>
AUTH_URL=https://yourdomain.com
AUTH_GOOGLE_ID=<same-as-local>
AUTH_GOOGLE_SECRET=<same-as-local>
DATABASE_URL=<production-database-url>
```

### 3. Publish OAuth App
1. Vào OAuth consent screen
2. Click **"PUBLISH APP"**
3. Đợi Google review (có thể mất vài ngày)
4. Sau khi được approve, bất kỳ ai cũng có thể đăng nhập

---

## 🔐 BẢO MẬT

### ⚠️ QUAN TRỌNG:
- **KHÔNG BAO GIỜ** commit file `.env.local` vào Git
- Thêm `.env.local` vào `.gitignore`:
  ```
  .env.local
  .env*.local
  ```
- Client Secret phải được giữ bí mật
- Sử dụng các biến môi trường khác nhau cho dev/staging/production

---

## 📚 TÀI LIỆU THAM KHẢO

- [Google OAuth 2.0 Setup](https://developers.google.com/identity/protocols/oauth2)
- [NextAuth.js Google Provider](https://next-auth.js.org/providers/google)
- [Auth.js Documentation](https://authjs.dev/)

---

## 💡 MẸO HAY

### Generate AUTH_SECRET nhanh:
```bash
openssl rand -base64 32
```

### Xem log NextAuth để debug:
Thêm vào `.env.local`:
```env
NEXTAUTH_DEBUG=true
```

### Test với nhiều email:
Thêm tất cả email test vào OAuth consent screen > Test users

---

## ✅ KẾT QUẢ MONG ĐỢI

Sau khi hoàn thành:
1. ✅ Nút Google hiển thị trên trang login/register
2. ✅ Click vào nút → redirect sang Google login
3. ✅ Chọn tài khoản Google → cho phép quyền
4. ✅ Redirect về app → tự động tạo user + đăng nhập
5. ✅ User profile hiển thị tên và ảnh từ Google

---

## 🆘 CẦN TRỢ GIÚP?

Nếu vẫn gặp lỗi, hãy:
1. Kiểm tra console log trong browser (F12)
2. Kiểm tra terminal log của Next.js server
3. Verify lại từng bước trong checklist
4. Google error message cụ thể

Good luck! 🚀
