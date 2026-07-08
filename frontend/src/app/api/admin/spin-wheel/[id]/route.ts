import { SPIN_WHEEL_PRIZES } from "@/lib/gamification/spin-wheel";
import { apiFailure, apiSuccess, requireAdminSession } from "@/lib/admin-api";

/** PATCH /api/admin/spin-wheel/[id] - Prizes are code-defined, read-only */
export async function PATCH() {
  const admin = await requireAdminSession();
  if (!admin.ok) return admin.response;
  return apiFailure("VALIDATION_ERROR", "Phần thưởng vòng quay được cấu hình trong mã nguồn, không thể sửa qua admin", 400);
}

/** DELETE /api/admin/spin-wheel/[id] - Prizes are code-defined, read-only */
export async function DELETE() {
  const admin = await requireAdminSession();
  if (!admin.ok) return admin.response;
  return apiFailure("VALIDATION_ERROR", "Phần thưởng vòng quay được cấu hình trong mã nguồn, không thể xóa qua admin", 400);
}
