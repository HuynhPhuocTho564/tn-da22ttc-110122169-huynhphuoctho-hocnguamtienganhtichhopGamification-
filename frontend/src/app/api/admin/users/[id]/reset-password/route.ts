import { NextRequest } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import {
  apiFailure,
  apiSuccess,
  readJsonObject,
  readRequiredString,
  requireAdminSession,
} from "@/lib/admin-api";

type RouteContext = { params: Promise<{ id: string }> };

const MIN_PASSWORD_LENGTH = 6;
const MAX_PASSWORD_LENGTH = 128;
const BCRYPT_SALT_ROUNDS = 10;

/**
 * POST /api/admin/users/[id]/reset-password
 *
 * Admin đặt lại mật khẩu cho user. Mật khẩu mới được hash bằng bcrypt
 * (cùng salt rounds với register route) rồi ghi vào passwordHash.
 *
 * Không trả về mật khẩu trong response — chỉ trả trạng thái thành công.
 */
export async function POST(request: NextRequest, context: RouteContext) {
  try {
    const admin = await requireAdminSession();
    if (!admin.ok) return admin.response;

    const { id } = await context.params;
    const body = await readJsonObject(request);
    if (!body) return apiFailure("VALIDATION_ERROR", "Payload phải là JSON object", 400);

    const newPassword = readRequiredString(body, "password", MAX_PASSWORD_LENGTH);
    if (newPassword === null) {
      return apiFailure("VALIDATION_ERROR", "password không hợp lệ", 400);
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      return apiFailure(
        "VALIDATION_ERROR",
        `Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự`,
        400,
      );
    }

    const existing = await prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true },
    });
    if (!existing) return apiFailure("NOT_FOUND", "Không tìm thấy người dùng", 404);

    const passwordHash = await bcrypt.hash(newPassword, BCRYPT_SALT_ROUNDS);
    await prisma.user.update({
      where: { id },
      data: { passwordHash },
    });

    return apiSuccess({ message: `Đã đặt lại mật khẩu cho user "${existing.username}"` });
  } catch (error) {
    console.error("Admin reset password error:", error);
    return apiFailure("INTERNAL_ERROR", "Lỗi server khi đặt lại mật khẩu", 500);
  }
}
