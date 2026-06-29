═══════════════════════════════════════════════════════════════
   HƯỚNG DẪN BẬT NÚT "ĐĂNG NHẬP BẰNG GOOGLE" - 3 BƯỚC
═══════════════════════════════════════════════════════════════

📌 BƯỚC 1: LẤY GOOGLE CREDENTIALS (5 phút)
───────────────────────────────────────────────────────────────
1. Truy cập: https://console.cloud.google.com/
2. Tạo Project mới: "PhatAmEN"
3. Vào: APIs & Services → OAuth consent screen
   → Chọn "External" → Điền App name, email → Save
4. Vào: APIs & Services → Credentials
   → Create Credentials → OAuth client ID
   → Web application
   → Authorized redirect URIs: 
     http://localhost:3000/api/auth/callback/google
   → Create
5. Copy 2 giá trị:
   ✓ Client ID
   ✓ Client Secret

───────────────────────────────────────────────────────────────
📌 BƯỚC 2: CẤU HÌNH .ENV (1 phút)
───────────────────────────────────────────────────────────────
Mở file: frontend/.env

Bỏ comment (xóa dấu #) và điền 2 dòng cuối:

AUTH_URL="http://localhost:3000"
AUTH_GOOGLE_ID="<paste-client-id-here>"
AUTH_GOOGLE_SECRET="<paste-client-secret-here>"

───────────────────────────────────────────────────────────────
📌 BƯỚC 3: RESTART SERVER (30 giây)
───────────────────────────────────────────────────────────────
cd frontend
Ctrl + C (dừng server)
npm run dev

───────────────────────────────────────────────────────────────
✅ KIỂM TRA
───────────────────────────────────────────────────────────────
Mở: http://localhost:3000/register
→ Thấy nút "Đăng ký với Google" → THÀNH CÔNG! 🎉

───────────────────────────────────────────────────────────────
🆘 NẾU KHÔNG THẤY NÚT GOOGLE
───────────────────────────────────────────────────────────────
1. Kiểm tra file .env có 3 dòng AUTH_URL, AUTH_GOOGLE_ID, AUTH_GOOGLE_SECRET
2. Restart server (Ctrl+C rồi npm run dev)
3. Xem hướng dẫn chi tiết: QUICK_START_GOOGLE_OAUTH.md

═══════════════════════════════════════════════════════════════
