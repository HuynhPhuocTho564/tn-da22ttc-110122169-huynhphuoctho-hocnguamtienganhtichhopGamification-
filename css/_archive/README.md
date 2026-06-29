# CSS Archive

Thư mục này lưu CSS cũ không còn được dùng bởi ứng dụng Next.js chính.

## styles.css (archived 2026-06-21)

- **Nguồn gốc:** Static landing page cũ (trước khi迁移 sang Next.js App Router)
- **Kích thước:** ~22 KB, 988 dòng
- **Lý do archive:** Không có file nào trong `frontend/src/` import file này (đã verify bằng grep toàn project). Next.js frontend dùng Tailwind CSS qua `frontend/src/app/globals.css` thay vì file này.
- **Ngày archive:** 2026-06-21 (Task 1.2.2 trong `PLAN/03_UI_UX/IMPROVEMENT_P1_QUICK_WINS.md`)
- **Giữ lại thay vì xóa hẳn:** để tra cứu lịch sử nếu cần style cũ cho landing page hoặc reference

## Không sử dụng cho production

File trong thư mục này **không được import** bởi bất kỳ component hay page nào của ứng dụng Next.js. Nếu cần dùng lại, phải xem xét kỹ và cập nhật theo Tailwind token system hiện tại (`frontend/src/app/globals.css`).
